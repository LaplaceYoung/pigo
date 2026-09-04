/**
 * Deterministic goal.md composer.
 * BYOK optionally rewrites tone; the install graph always comes from this file.
 */

export const PLATE_BLOCKLIST = ["oh-my-pi", "omp", "@oh-my-pi/"];

export function mergeCatalog(base, overlay) {
  if (!overlay) return base;
  const bricks = [...(base.bricks || [])];
  const byId = new Map(bricks.map((b) => [b.id, b]));
  for (const patch of overlay.patches || []) {
    const cur = byId.get(patch.id);
    if (cur) Object.assign(cur, patch);
  }
  for (const brick of overlay.bricks || []) {
    if (byId.has(brick.id)) Object.assign(byId.get(brick.id), brick);
    else {
      bricks.push(brick);
      byId.set(brick.id, brick);
    }
  }
  return { ...base, bricks };
}

export function isPlateReplacement(name = "") {
  const n = name.toLowerCase();
  return PLATE_BLOCKLIST.some((b) => n === b || n.startsWith(b));
}

export function analyzeBuild(catalog, selectedIds) {
  const byId = Object.fromEntries(catalog.bricks.map((b) => [b.id, b]));
  const selected = selectedIds.map((id) => byId[id]).filter(Boolean);
  const warnings = [];
  const dropped = [];
  const kept = [];

  const slotOwner = new Map();
  for (const brick of selected) {
    if (isPlateReplacement(brick.name) || isPlateReplacement(pkgName(brick))) {
      dropped.push({ brick, reason: "Replaces the Pi plate. Blocked." });
      warnings.push(`Dropped ${brick.name} — plate replacements are banned.`);
      continue;
    }
    const sharedSlot = brick.slot && brick.slot !== "unsorted" && brick.slot !== "community";
    if (sharedSlot && slotOwner.has(brick.slot)) {
      const winner = slotOwner.get(brick.slot);
      dropped.push({ brick, reason: `Slot "${brick.slot}" already taken by ${winner.name}.` });
      warnings.push(`Kept ${winner.name}, dropped ${brick.name} (same slot: ${brick.slot}).`);
      continue;
    }
    const hit = kept.find(
      (k) => (k.conflictsWith || []).includes(brick.id) || (brick.conflictsWith || []).includes(k.id),
    );
    if (hit) {
      dropped.push({ brick, reason: `Conflicts with ${hit.name}.` });
      warnings.push(`Kept ${hit.name}, dropped ${brick.name}.`);
      continue;
    }
    if (sharedSlot) slotOwner.set(brick.slot, brick);
    kept.push(brick);
  }

  const missing = [];
  for (const brick of kept) {
    for (const req of brick.requires || []) {
      if (req.startsWith("system:")) continue;
      if (!kept.some((k) => k.id === req || (k.provides || []).includes(req))) {
        const dep = byId[req];
        if (dep && !kept.includes(dep)) {
          kept.push(dep);
          if (dep.slot && dep.slot !== "unsorted") slotOwner.set(dep.slot, dep);
          warnings.push(`Auto-added dependency ${dep.name} required by ${brick.name}.`);
        } else if (!dep) {
          missing.push({ brick, req });
        }
      }
    }
  }

  const order = topo(kept);
  const highCost = kept.filter((b) => b.contextCost === "high");
  if (highCost.length >= 3) {
    warnings.push("Three or more high-context bricks. Expect a heavier system prompt than stock Pi.");
  }

  return {
    plate: catalog.plate,
    selected: order,
    dropped,
    warnings,
    missing,
    slots: [...slotOwner.entries()].map(([slot, brick]) => ({ slot, id: brick.id, name: brick.name })),
    settingsFragment: composeSettingsFragment(catalog.plate, order),
  };
}

function pkgName(brick) {
  const install = brick.install || "";
  if (install.startsWith("pi install npm:")) return install.replace("pi install npm:", "");
  if (brick.package) return brick.package;
  return brick.name || "";
}

function topo(bricks) {
  const ids = new Set(bricks.map((b) => b.id));
  const done = [];
  const seen = new Set();
  const visit = (b) => {
    if (seen.has(b.id)) return;
    seen.add(b.id);
    for (const req of b.requires || []) {
      const dep = bricks.find((x) => x.id === req);
      if (dep) visit(dep);
    }
    done.push(b);
  };
  bricks.forEach(visit);
  return done.filter((b) => ids.has(b.id));
}

export function composeSettingsFragment(plate, selected) {
  const packages = [];
  const extensions = [];
  let defaultTools = null;

  for (const brick of selected) {
    const frag = brick.settingsFragment || {};
    if (Array.isArray(frag.packages)) {
      for (const p of frag.packages) pushUnique(packages, normalizePkg(p));
    }
    if (brick.install?.startsWith("pi install npm:")) {
      pushUnique(packages, normalizePkg(brick.install.replace("pi install npm:", "")));
    }
    if (Array.isArray(frag.extensions)) {
      for (const e of frag.extensions) pushUnique(extensions, e);
    } else if (brick.install?.startsWith("local:")) {
      pushUnique(extensions, `.pi/${brick.install.slice(6)}`);
    }
    if (Array.isArray(frag.defaultTools)) defaultTools = frag.defaultTools;
  }

  const fragment = {};
  if (packages.length) fragment.packages = packages;
  if (extensions.length) fragment.extensions = extensions;
  if (defaultTools) fragment.defaultTools = defaultTools;
  fragment._pigo = {
    plate: plate?.package || "@earendil-works/pi-coding-agent",
    merge: "Deep-merge into .pi/settings.json. Union packages and extensions with any existing arrays — do not replace the whole file.",
  };
  return fragment;
}

function normalizePkg(name) {
  const raw = String(name).replace(/^npm:/, "");
  return `npm:${raw}`;
}

function pushUnique(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

export function composeGoalMarkdown(analysis, intent = "") {
  const { plate, selected, dropped, warnings, missing, settingsFragment } = analysis;
  const installLines = selected
    .map((b) => {
      if (b.install?.startsWith("pi install")) return `- [ ] \`${b.install}\``;
      if (b.install?.startsWith("local:")) {
        const src = (b.files && b.files[0]) || `packages/recipes/${b.id}/index.ts`;
        return `- [ ] \`mkdir -p .pi/extensions && cp ${src} .pi/${b.install.slice(6)}\` (${b.name})`;
      }
      if (b.install?.startsWith("settings:")) return `- [ ] Enable via Pi settings / tools UI (${b.name})`;
      return `- [ ] ${b.install}`;
    })
    .join("\n");

  const recipes = selected
    .filter((b) => b.recipe)
    .map((b) => {
      const src = (b.files && b.files[0]) || "";
      return `### ${b.name}\n${b.recipe}${src ? `\n\nSource file in this repo: \`${src}\`` : ""}`;
    })
    .join("\n\n");

  const verify = selected.flatMap((b) => (b.verify || []).map((v) => `- [ ] **${b.name}:** ${v}`)).join("\n");

  const droppedMd = dropped.length ? dropped.map((d) => `- ${d.brick.name} — ${d.reason}`).join("\n") : "- None";
  const warnMd = warnings.length ? warnings.map((w) => `- ${w}`).join("\n") : "- None";
  const missMd = missing.length ? missing.map((m) => `- ${m.brick.name} needs \`${m.req}\``).join("\n") : "- None";

  const intentBlock = intent.trim()
    ? intent.trim()
    : "Assemble a personal Pi agent from the official core plate plus the selected capability bricks.";

  const settingsJson = JSON.stringify(
    Object.fromEntries(Object.entries(settingsFragment || {}).filter(([k]) => k !== "_pigo")),
    null,
    2,
  );

  return `# Goal: assemble this Pi agent with Pigo

> Generated by [Pigo](https://github.com/LaplaceYoung/pigo).
> This file is a blueprint. Execute it with Pi, Claude Code, Codex, or omp.
> Do not replace Pi. Do not install the Oh My Pi runtime as a whole.

## Intent

${intentBlock}

## Invariants

${plate.invariants.map((x) => `- ${x}`).join("\n")}
- Core package: \`${plate.package}\`
- Core install: \`${plate.install}\`

## Bill of materials

Selected bricks, already sorted by dependency:

${selected.map((b) => `- **${b.name}** (\`${b.id}\`) · slot \`${b.slot}\` · ${b.maturity} · ${b.install}`).join("\n")}

## Conflict resolutions

${droppedMd}

## Warnings

${warnMd}

## Missing system deps

${missMd}

## Exact install order

1. Confirm Pi is installed and \`pi --version\` works.
2. Stay on official Pi. Do not \`npm i -g oh-my-pi\` for this build.
3. Install npm bricks first, then copy local recipes, then merge settings, then \`/reload\`.

${installLines}

4. Run \`pi list\` and confirm the npm/git packages appear.
5. Deep-merge the settings fragment below into \`.pi/settings.json\` (project) or \`~/.pi/agent/settings.json\` (global). Union \`packages\` and \`extensions\` arrays with anything already there. Do not overwrite the whole file.
6. Run \`/reload\` inside an interactive session.

## settings.json fragment (merge, do not replace)

\```json
${settingsJson || "{ }"}
\```

${settingsFragment?._pigo?.merge || ""}

## Local extensions to write

${recipes || "_No local extension recipes in this build._"}

## Acceptance checks

- [ ] \`pi --version\` prints a current @earendil-works/pi-coding-agent version
- [ ] \`pi list\` matches the bill of materials
- [ ] Core tools remain read / write / edit / bash
${verify}

## Rollback

\```bash
${selected
  .filter((b) => b.install?.startsWith("pi install npm:"))
  .map((b) => `pi remove ${b.install.replace("pi install ", "")}`)
  .join("\n") || "# no npm packages to remove"}
\```

If a local extension misbehaves, move it out of \`.pi/extensions/\` or \`~/.pi/agent/extensions/\` and \`/reload\`.

## Security review

- Read the source of every \`pi install npm:\` package before first use.
- Extensions execute with full user permissions.
- Prefer API keys in env vars. Never paste provider keys into AGENTS.md or the extension source.
`;
}

export function compose({ catalog, selectedIds, intent }) {
  const analysis = analyzeBuild(catalog, selectedIds);
  return {
    ...analysis,
    conflicts: analysis.dropped,
    order: analysis.selected,
    bom: analysis.selected.map((b) => ({ id: b.id, name: b.name, install: b.install, slot: b.slot })),
    goalMd: composeGoalMarkdown(analysis, intent),
    buildJson: {
      plate: analysis.plate.id,
      bricks: analysis.selected.map((b) => b.id),
      warnings: analysis.warnings,
      settingsFragment: analysis.settingsFragment,
    },
  };
}

export function composerSystemPrompt() {
  return `You are the Pigo composer. You receive a locked Pi core plate and a list of capability bricks.
Rewrite the provided goal.md so it is clearer for a coding agent, but:
- Do not add packages that were not selected.
- Do not recommend installing Oh My Pi (omp) as the runtime.
- Do not fork Pi or replace read/write/edit/bash.
- Keep the same section headings.
- You may refine commands, settings fragments, and acceptance checks.
- If a brick is maturity=partial, keep it as a local-extension recipe.
- BYOK may only polish the Intent section wording.
Return only the markdown file.`;
}

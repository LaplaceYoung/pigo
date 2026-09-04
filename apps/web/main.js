import { createScene } from "./scene.js";
import {
  analyzeBuild,
  composeGoalMarkdown,
  composeSettingsFragment,
  composerSystemPrompt,
  isPlateReplacement,
  mergeCatalog,
} from "./compose.js";

const NPM_SEARCH = "https://registry.npmjs.org/-/v1/search";
const STORE = "pigo.v04";

const state = {
  catalog: null,
  presets: [],
  selected: [],
  extras: {},
  cat: "all",
  query: "",
  source: "curated",
  marketHits: [],
  marketStatus: "",
  pendingReplace: null,
  detailId: null,
};

const $ = (id) => document.getElementById(id);
const canvas = $("stage");
const scene = createScene(canvas);
scene.onPick((id) => toggle(id));

async function boot() {
  const [catalog, overlay, presets] = await Promise.all([
    fetch("./data/bricks.json").then((r) => r.json()),
    fetch("./data/bricks.community.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch("./data/presets.json")
      .then((r) => r.json())
      .catch(() => ({ presets: [] })),
  ]);
  state.catalog = mergeCatalog(catalog, overlay);
  state.presets = presets.presets || [];
  restore();
  paintCats();
  paintCrate();
  paintTray();
  paintPresets();
}

function restore() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const fromHash = (hash.get("b") || "").split(",").filter(Boolean);
  const intentHash = hash.get("i");
  if (fromHash.length) {
    state.selected = fromHash;
    if (intentHash) $("intent").value = intentHash;
    return;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved?.selected) state.selected = saved.selected;
    if (saved?.intent) $("intent").value = saved.intent;
  } catch {
    /* ignore */
  }
}

function persist() {
  const intent = $("intent").value;
  localStorage.setItem(STORE, JSON.stringify({ selected: state.selected, intent }));
  const params = new URLSearchParams();
  if (state.selected.length) params.set("b", state.selected.join(","));
  if (intent.trim()) params.set("i", intent.trim());
  const next = params.toString();
  history.replaceState(null, "", next ? `#${next}` : location.pathname);
}

function paintCats() {
  const wrap = $("cats");
  wrap.innerHTML = "";
  if (state.source !== "curated") return;
  const cats = [{ id: "all", label: "All", color: "#f5c400" }, ...state.catalog.categories];
  for (const c of cats) {
    const b = document.createElement("button");
    b.className = "chip" + (state.cat === c.id ? " on" : "");
    b.textContent = c.labelZh || c.label;
    b.onclick = () => {
      state.cat = c.id;
      paintCats();
      paintCrate();
    };
    wrap.appendChild(b);
  }
}

function visibleBricks() {
  if (state.source === "market") return state.marketHits;
  const q = state.query.trim().toLowerCase();
  return state.catalog.bricks.filter((b) => {
    const catOk = state.cat === "all" || b.category === state.cat;
    const text = `${b.name} ${b.nameZh || ""} ${b.summary} ${b.install}`.toLowerCase();
    return catOk && (!q || text.includes(q));
  });
}

function paintCrate() {
  const list = $("crate-list");
  list.innerHTML = "";
  const colors = Object.fromEntries(state.catalog.categories.map((c) => [c.id, c.color]));

  const core = document.createElement("button");
  core.className = "brick-card locked on";
  core.innerHTML = `<span class="swatch" style="background:#111"></span><span><b>Pi Core</b><small>locked plate · read/write/edit/bash</small></span><span class="meta">BASE</span>`;
  list.appendChild(core);

  if (state.source === "market" && state.marketStatus) {
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = state.marketStatus;
    list.appendChild(note);
  }

  for (const brick of visibleBricks()) {
    brick.color = brick.color || colors[brick.category] || "#7B5CFF";
    const on = state.selected.includes(brick.id);
    const el = document.createElement("button");
    el.className = "brick-card" + (on ? " on" : "") + (brick.source === "marketplace-live" ? " market" : "");
    const badge = brick.source === "omp-split" ? "OMP" : brick.source === "marketplace-live" ? "NPM" : "MKT";
    el.innerHTML = `<span class="swatch" style="background:${brick.color}"></span><span><b>${brick.nameZh || brick.name}</b><small>${brick.name} · ${brick.maturity} · slot ${brick.slot}</small></span><span class="meta">${badge}</span>`;
    el.onclick = () => {
      state.detailId = brick.id;
      toggle(brick);
    };
    list.appendChild(el);
  }
}

function brickById(id) {
  return state.catalog.bricks.find((b) => b.id === id) || state.extras[id];
}

function occupant(slot, exceptId) {
  if (!slot || slot === "unsorted" || slot === "community") return null;
  return state.selected.map(brickById).find((b) => b && b.id !== exceptId && b.slot === slot);
}

function toggle(brick) {
  if (typeof brick === "string") {
    const id = brick;
    if (state.selected.includes(id)) state.selected = state.selected.filter((x) => x !== id);
    else state.selected = [...state.selected, id];
    commit();
    return;
  }
  if (isPlateReplacement(brick.name) || isPlateReplacement(brick.id.replace(/^npm:/, ""))) {
    $("compat-line").textContent = `Blocked ${brick.name}: replaces the Pi plate.`;
    scene.bounce();
    return;
  }
  if (!state.catalog.bricks.some((b) => b.id === brick.id)) {
    state.catalog.bricks.push(brick);
    state.extras[brick.id] = brick;
  }
  if (state.selected.includes(brick.id)) {
    state.selected = state.selected.filter((x) => x !== brick.id);
    state.pendingReplace = null;
    commit();
    return;
  }
  const taken = occupant(brick.slot, brick.id);
  if (taken) {
    if (state.pendingReplace === brick.id) {
      state.selected = state.selected.filter((id) => id !== taken.id).concat(brick.id);
      state.pendingReplace = null;
      $("compat-line").textContent = `Replaced ${taken.name} with ${brick.name} on slot ${brick.slot}.`;
      commit();
      return;
    }
    state.pendingReplace = brick.id;
    $("compat-line").textContent = `Slot ${brick.slot} holds ${taken.name}. Click ${brick.name} again to replace.`;
    scene.bounce();
    return;
  }
  state.selected = [...state.selected, brick.id];
  state.pendingReplace = null;
  commit();
}

function commit() {
  persist();
  paintCrate();
  paintTray();
}

function currentAnalysis() {
  return analyzeBuild(state.catalog, state.selected);
}

function paintTray() {
  const analysis = currentAnalysis();
  const colors = Object.fromEntries(state.catalog.categories.map((c) => [c.id, c.color]));
  const selectedBricks = analysis.selected.map((b) => ({ ...b, color: colors[b.category] || b.color || "#7B5CFF" }));
  scene.sync(selectedBricks);

  $("build-count").textContent = selectedBricks.length ? `${selectedBricks.length} bricks on plate` : "core plate only";
  if (!state.pendingReplace) $("compat-line").textContent = analysis.warnings[0] || "No conflicts.";

  const map = $("slot-map");
  map.innerHTML = "";
  for (const row of analysis.slots) {
    const chip = document.createElement("span");
    chip.className = "slot-chip";
    chip.textContent = `${row.slot}: ${row.name}`;
    map.appendChild(chip);
  }

  const ol = $("selected-list");
  ol.innerHTML = "";
  if (!selectedBricks.length) {
    ol.innerHTML = "<li>Empty tray. Snap bricks from the crate.</li>";
  }
  for (const brick of selectedBricks) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${brick.nameZh || brick.name}<br><small style="color:#9a8f7a">${brick.install}</small></span>`;
    const rm = document.createElement("button");
    rm.textContent = "×";
    rm.onclick = () => toggle(brick.id);
    li.appendChild(rm);
    li.onclick = (ev) => {
      if (ev.target === rm) return;
      state.detailId = brick.id;
      paintDetail();
    };
    ol.appendChild(li);
  }
  paintDetail();
}

function paintDetail() {
  const box = $("detail");
  const brick = brickById(state.detailId);
  if (!brick) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }
  box.classList.remove("hidden");
  box.innerHTML = `
    <h3>${brick.nameZh || brick.name}</h3>
    <p>${brick.summary || ""}</p>
    <p class="hint">${brick.install} · slot ${brick.slot} · ${brick.maturity}${brick.ompTool ? ` · omp:${brick.ompTool}` : ""}</p>
    ${brick.notes ? `<p class="hint">${brick.notes}</p>` : ""}
  `;
}

function setSource(source) {
  state.source = source;
  $("src-curated").classList.toggle("on", source === "curated");
  $("src-market").classList.toggle("on", source === "market");
  $("market-hint").classList.toggle("hidden", source !== "market");
  $("filter").placeholder = source === "market" ? "npm search · keywords:pi-package" : "Search bricks…";
  paintCats();
  if (source === "market") searchNpm(state.query);
  else paintCrate();
}

$("src-curated").onclick = () => setSource("curated");
$("src-market").onclick = () => setSource("market");

let searchTimer = 0;
$("filter").addEventListener("input", (e) => {
  state.query = e.target.value;
  if (state.source === "market") {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchNpm(state.query), 280);
  } else {
    paintCrate();
  }
});

$("intent").addEventListener("input", persist);

async function searchNpm(query) {
  const q = query.trim();
  state.marketStatus = q ? `Searching npm for “${q}”…` : "Type to search npm. Showing recent pi-package hits.";
  paintCrate();
  try {
    const text = q ? `keywords:pi-package ${q}` : "keywords:pi-package";
    const url = `${NPM_SEARCH}?text=${encodeURIComponent(text)}&size=20`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`npm ${res.status}`);
    const data = await res.json();
    const curatedInstalls = new Set(
      state.catalog.bricks.filter((b) => b.install?.startsWith("pi install npm:")).map((b) => b.install.replace("pi install npm:", "")),
    );
    state.marketHits = (data.objects || [])
      .map((o) => o.package)
      .filter(Boolean)
      .filter((pkg) => !isPlateReplacement(pkg.name))
      .map((pkg) => {
        const already = curatedInstalls.has(pkg.name);
        const curated = already ? state.catalog.bricks.find((b) => b.install === `pi install npm:${pkg.name}`) : null;
        return {
          id: curated?.id || `npm:${pkg.name}`,
          name: pkg.name,
          nameZh: already ? `${pkg.name} (in crate)` : pkg.name,
          category: curated?.category || "dx",
          source: already ? "marketplace" : "marketplace-live",
          slot: curated?.slot || "unsorted",
          studs: 2,
          contextCost: "low",
          maturity: already ? "community" : "unreviewed",
          summary: pkg.description || "",
          install: `pi install npm:${pkg.name}`,
          provides: [],
          requires: [],
          conflictsWith: [],
          color: already ? "#F5C400" : "#7B5CFF",
        };
      });
    state.marketStatus = `${state.marketHits.length} npm hits. Unreviewed packages land in the unsorted bin.`;
  } catch (err) {
    state.marketHits = [];
    state.marketStatus = `npm search failed: ${err.message}`;
  }
  paintCrate();
}

function applyPreset(preset) {
  state.selected = [...preset.bricks];
  $("intent").value = preset.intent || "";
  setSource("curated");
  $("preset-modal").classList.add("hidden");
  commit();
}

function paintPresets() {
  const list = $("preset-list");
  list.innerHTML = "";
  for (const preset of state.presets) {
    const btn = document.createElement("button");
    btn.className = "preset-card";
    btn.innerHTML = `<b>${preset.nameZh || preset.name}</b><small>${preset.bricks.length} bricks · ${preset.name}</small><p>${preset.intent}</p>`;
    btn.onclick = () => applyPreset(preset);
    list.appendChild(btn);
  }
}

$("btn-reset").onclick = () => {
  state.selected = [];
  state.pendingReplace = null;
  commit();
};

$("btn-presets").onclick = () => $("preset-modal").classList.remove("hidden");
$("btn-preset-close").onclick = () => $("preset-modal").classList.add("hidden");

$("btn-share").onclick = async () => {
  persist();
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    $("compat-line").textContent = "Share URL copied.";
  } catch {
    show(url, "share-url.txt");
  }
};

$("btn-json").onclick = () => {
  const analysis = currentAnalysis();
  show(
    JSON.stringify(
      {
        plate: analysis.plate.id,
        bricks: analysis.selected.map((b) => b.id),
        warnings: analysis.warnings,
        settingsFragment: analysis.settingsFragment,
      },
      null,
      2,
    ),
    "build.json",
  );
};

$("btn-settings").onclick = () => {
  const analysis = currentAnalysis();
  const fragment = composeSettingsFragment(analysis.plate, analysis.selected);
  const body = Object.fromEntries(Object.entries(fragment).filter(([k]) => k !== "_pigo"));
  const note = `// Merge into .pi/settings.json (project) or ~/.pi/agent/settings.json
// Union packages / extensions with existing arrays. Do not overwrite the file.
${JSON.stringify(body, null, 2)}\n`;
  show(note, "settings.json");
};

$("btn-goal").onclick = async () => {
  const analysis = currentAnalysis();
  let md = composeGoalMarkdown(analysis, $("intent").value);
  const provider = $("provider").value;
  if (provider !== "none" && $("api-key").value.trim()) {
    try {
      md = await polish(md, provider);
    } catch (err) {
      md += `\n\n> BYOK polish failed: ${err.message}. Local composer output kept above.\n`;
    }
  }
  show(md, "goal.md");
};

$("btn-close").onclick = () => $("modal").classList.add("hidden");
$("btn-copy").onclick = async () => {
  await navigator.clipboard.writeText($("goal-out").textContent);
};
$("btn-download").onclick = () => {
  const title = document.querySelector("#modal h3").textContent;
  const blob = new Blob([$("goal-out").textContent], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = title;
  a.click();
};

function show(text, title) {
  document.querySelector("#modal h3").textContent = title;
  $("goal-out").textContent = text;
  $("modal").classList.remove("hidden");
}

async function polish(markdown, provider) {
  const key = $("api-key").value.trim();
  const model = $("model").value.trim();
  const override = $("base-url").value.trim();
  const sys = composerSystemPrompt();
  const user = `Intent:\n${$("intent").value}\n\nDraft goal.md:\n${markdown}`;

  if (provider === "anthropic") {
    const url = override || "https://api.anthropic.com/v1/messages";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-5",
        max_tokens: 4000,
        system: sys,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.content.map((p) => p.text || "").join("\n");
  }

  const bases = {
    openai: "https://api.openai.com/v1",
    openrouter: "https://openrouter.ai/api/v1",
    xai: "https://api.x.ai/v1",
  };
  const base = (override || bases[provider] || bases.openai).replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model || (provider === "xai" ? "grok-4" : "gpt-4.1"),
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices[0].message.content;
}

boot();

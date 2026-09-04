/**
 * Pigo brick: rule-compat
 *
 * Inventory foreign rule files at session start. Do not dump full bodies.
 *
 *   mkdir -p .pi/extensions
 *   cp packages/recipes/rule-compat/index.ts .pi/extensions/rule-compat.ts
 *
 * Recognized:
 *   AGENTS.md, CLAUDE.md, .cursorrules, .cursor/rules/*.mdc,
 *   .clinerules, .github/copilot-instructions.md, .codex/AGENTS.md
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  ".cursorrules",
  ".clinerules",
  ".github/copilot-instructions.md",
  ".codex/AGENTS.md",
];

function listMdc(cwd: string): string[] {
  const dir = join(cwd, ".cursor", "rules");
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".mdc") || name.endsWith(".md"))
    .map((name) => `.cursor/rules/${name}`);
}

function inventory(cwd: string): string[] {
  const hits: string[] = [];
  for (const rel of FILES) {
    if (existsSync(join(cwd, rel))) hits.push(rel);
  }
  hits.push(...listMdc(cwd));
  return hits;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    const cwd = ctx.cwd || process.cwd();
    const hits = inventory(cwd);
    if (!hits.length) {
      ctx.ui.setStatus?.("rule-compat", "no foreign rules");
      return;
    }
    ctx.ui.setStatus?.("rule-compat", `${hits.length} rule files`);
    ctx.ui.notify?.(`rule-compat: ${hits.join(", ")}`, "info");
  });

  pi.registerCommand("rules", {
    description: "List detected foreign rule files",
    handler: async (_args, ctx) => {
      const hits = inventory(ctx.cwd || process.cwd());
      ctx.ui.notify(hits.length ? hits.join("\n") : "No foreign rule files found.", "info");
    },
  });
}

/**
 * Pigo brick: stream-rules
 *
 * Mid-turn steering. If a tool call matches a project rule, abort and inject
 * a reminder. Ported as a Pi extension — not the omp binary.
 *
 *   mkdir -p .pi/extensions
 *   cp packages/recipes/stream-rules/index.ts .pi/extensions/stream-rules.ts
 *
 * Rules file (optional): .pi/stream-rules.json
 *   { "rules": [{ "id": "no-force-push", "match": "git push --force", "tool": "bash", "message": "Do not force-push." }] }
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

type Rule = { id: string; match: string; tool?: string; message: string };

const DEFAULT_RULES: Rule[] = [
  {
    id: "no-force-push",
    match: "git push\\s+(-f|--force)",
    tool: "bash",
    message: "Force-push is blocked by stream-rules. Use a non-destructive plan.",
  },
  {
    id: "no-rm-rf-root",
    match: "rm\\s+-rf\\s+[/~]",
    tool: "bash",
    message: "Refusing rm -rf on a root-like path.",
  },
];

function loadRules(cwd: string): Rule[] {
  const path = join(cwd, ".pi", "stream-rules.json");
  if (!existsSync(path)) return DEFAULT_RULES;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    const extra: Rule[] = Array.isArray(raw.rules) ? raw.rules : [];
    return [...DEFAULT_RULES, ...extra];
  } catch {
    return DEFAULT_RULES;
  }
}

function haystack(input: unknown): string {
  if (typeof input === "string") return input;
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    ctx.ui.setStatus?.("stream-rules", "stream-rules on");
  });

  pi.on("tool_call", async (event, ctx) => {
    const rules = loadRules(ctx.cwd || process.cwd());
    const blob = haystack(event.input);
    for (const rule of rules) {
      if (rule.tool && rule.tool !== event.toolName) continue;
      let re: RegExp;
      try {
        re = new RegExp(rule.match, "i");
      } catch {
        continue;
      }
      if (!re.test(blob)) continue;
      return {
        block: true,
        reason: `[stream-rules:${rule.id}] ${rule.message}`,
      };
    }
    return undefined;
  });
}

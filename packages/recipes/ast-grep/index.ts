/**
 * Pigo brick: ast-grep
 *
 * Structural search + preview-then-apply rewrite via the ast-grep CLI.
 * Not a language-server. Not a blind string replace.
 *
 *   mkdir -p .pi/extensions
 *   cp packages/recipes/ast-grep/index.ts .pi/extensions/ast-grep.ts
 *
 * Requires: `sg` or `ast-grep` on PATH (https://ast-grep.github.io).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

async function whichSg(): Promise<string> {
  for (const bin of ["sg", "ast-grep"]) {
    try {
      const { stdout } = await run(process.platform === "win32" ? "where" : "which", [bin]);
      const hit = stdout.trim().split(/\r?\n/)[0];
      if (hit) return hit;
    } catch {
      /* try next */
    }
  }
  throw new Error("ast-grep CLI not found. Install: https://ast-grep.github.io/guide/quick-start.html");
}

async function sg(args: string[], cwd: string) {
  const bin = await whichSg();
  const { stdout, stderr } = await run(bin, args, { cwd, maxBuffer: 4 * 1024 * 1024 });
  return (stdout || stderr || "").trim();
}

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }], details: {} };
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "ast_grep",
    label: "ast-grep",
    description:
      "Structural search and rewrite with ast-grep. Actions: search (preview matches), rewrite (preview a fix), apply (write the rewrite). Always search or rewrite before apply.",
    parameters: Type.Object({
      action: Type.String({ description: "search | rewrite | apply" }),
      pattern: Type.String({ description: "ast-grep pattern, e.g. console.log($A)" }),
      rewrite: Type.Optional(Type.String({ description: "Replacement pattern for rewrite/apply" })),
      lang: Type.Optional(Type.String({ description: "Language id, e.g. ts, py, go, rust" })),
      path: Type.Optional(Type.String({ description: "File or directory. Default: cwd" })),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const action = String(params.action || "search");
      const pattern = String(params.pattern || "");
      if (!pattern) return text("pattern is required");
      const cwd = ctx.cwd || process.cwd();
      const target = params.path ? String(params.path) : ".";
      const lang = params.lang ? ["--lang", String(params.lang)] : [];

      try {
        if (action === "search") {
          const out = await sg(["run", "--pattern", pattern, ...lang, target], cwd);
          return text(out || "(no matches)");
        }
        if (action === "rewrite" || action === "apply") {
          const rewrite = String(params.rewrite || "");
          if (!rewrite) return text("rewrite/apply requires rewrite");
          const args = ["run", "--pattern", pattern, "--rewrite", rewrite, ...lang, target];
          if (action === "rewrite") args.push("--update-all=false");
          if (action === "apply") args.push("--update-all");
          const out = await sg(args, cwd);
          return text((action === "apply" ? "Applied.\n" : "Preview (not written).\n") + (out || "(no matches)"));
        }
        return text(`Unknown action "${action}". Use search | rewrite | apply.`);
      } catch (err) {
        return text(err instanceof Error ? err.message : String(err));
      }
    },
  });
}

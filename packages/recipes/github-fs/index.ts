/**
 * Pigo brick: github-fs
 *
 * Read PRs and issues through path-like URIs via the `gh` CLI.
 *
 *   mkdir -p .pi/extensions
 *   cp packages/recipes/github-fs/index.ts .pi/extensions/github-fs.ts
 *
 * Requires: gh auth login
 *
 * Paths:
 *   pr://12
 *   pr://owner/repo#12
 *   issue://8
 *   issue://owner/repo#8
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }], details: {} };
}

function parseUri(raw: string): { kind: "pr" | "issue"; repo?: string; number: string } | null {
  const m = /^(pr|issue):\/\/(?:([^#/]+\/[^#/]+)#)?(\d+)$/i.exec(raw.trim());
  if (!m) return null;
  return { kind: m[1].toLowerCase() as "pr" | "issue", repo: m[2], number: m[3] };
}

async function gh(args: string[], cwd: string) {
  const { stdout, stderr } = await run("gh", args, { cwd, maxBuffer: 4 * 1024 * 1024 });
  return (stdout || stderr || "").trim();
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "github_read",
    label: "github-fs",
    description:
      "Read a GitHub pull request or issue as if it were a file. Path forms: pr://N, pr://owner/repo#N, issue://N, issue://owner/repo#N.",
    parameters: Type.Object({
      path: Type.String({ description: "pr:// or issue:// URI" }),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const parsed = parseUri(String(params.path || ""));
      if (!parsed) return text("Expected pr://N, pr://owner/repo#N, issue://N, or issue://owner/repo#N");
      const cwd = ctx.cwd || process.cwd();
      const repoArgs = parsed.repo ? ["-R", parsed.repo] : [];
      try {
        if (parsed.kind === "pr") {
          const view = await gh(["pr", "view", parsed.number, ...repoArgs], cwd);
          const diff = await gh(["pr", "diff", parsed.number, ...repoArgs], cwd);
          return text(`# PR ${parsed.number}\n\n${view}\n\n## Diff\n\n${diff}`);
        }
        const view = await gh(["issue", "view", parsed.number, ...repoArgs], cwd);
        return text(`# Issue ${parsed.number}\n\n${view}`);
      } catch (err) {
        return text(err instanceof Error ? err.message : String(err));
      }
    },
  });
}

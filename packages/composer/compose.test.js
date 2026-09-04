import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { analyzeBuild, composeGoalMarkdown, composeSettingsFragment, isPlateReplacement, mergeCatalog } from "./compose.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const base = JSON.parse(readFileSync(join(root, "data/bricks.json"), "utf8"));
const overlay = JSON.parse(readFileSync(join(root, "data/bricks.community.json"), "utf8"));
const catalog = mergeCatalog(base, overlay);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(isPlateReplacement("oh-my-pi"), "block omp");
assert(isPlateReplacement("omp"), "block omp short");
assert(!isPlateReplacement("pi-lens"), "allow community pack");

const daily = analyzeBuild(catalog, [
  "hashline-edit",
  "lsp-lens",
  "web-access",
  "mcp-adapter",
  "review",
  "permission-gate",
]);
assert(daily.selected.length === 6, `daily kept ${daily.selected.length}`);
assert(daily.dropped.length === 0, "daily should have no drops");

const slotClash = analyzeBuild(catalog, ["lsp-lens", "hashline-edit"]);
assert(slotClash.selected.some((b) => b.id === "lsp-lens"), "keep first lsp");

const sameSlot = analyzeBuild(catalog, ["web-access", "web-access"]);
assert(sameSlot.selected.filter((b) => b.id === "web-access").length === 1, "dedupe via slot");

const browser = analyzeBuild(catalog, ["browser"]);
assert(
  browser.selected.some((b) => b.id === "mcp-adapter"),
  "browser auto-adds mcp-adapter",
);

const blocked = analyzeBuild(
  {
    ...catalog,
    bricks: [
      ...catalog.bricks,
      {
        id: "omp-runtime",
        name: "oh-my-pi",
        slot: "plate",
        install: "npm i -g oh-my-pi",
        requires: [],
        conflictsWith: [],
      },
    ],
  },
  ["omp-runtime"],
);
assert(blocked.dropped.length === 1, "drop plate replacement");

const frag = composeSettingsFragment(catalog.plate, daily.selected);
assert(Array.isArray(frag.packages) && frag.packages.every((p) => p.startsWith("npm:")), "packages prefixed");
assert(!frag.packages.includes("oh-my-pi"), "no omp package");

const md = composeGoalMarkdown(daily, "refactor agent");
assert(md.includes("## Intent"), "intent heading");
assert(md.includes("pi install npm:pi-lens"), "install line");
assert(md.includes("Do not install Oh My Pi"), "invariant");
assert(!/^\s*npm i -g oh-my-pi/m.test(md), "no hidden omp install step");

const local = analyzeBuild(catalog, ["dap-debug", "computer-use"]);
const localFrag = composeSettingsFragment(catalog.plate, local.selected);
assert(
  localFrag.extensions.includes(".pi/extensions/dap-debug.ts"),
  "dap extension path",
);
assert(
  localFrag.extensions.includes(".pi/extensions/computer-use.ts"),
  "computer-use extension path",
);

const kitClash = analyzeBuild(catalog, ["session-kit", "todo-ask", "review"]);
assert(kitClash.selected.some((b) => b.id === "session-kit"), "keep session-kit");
assert(
  kitClash.dropped.some((d) => d.brick.id === "todo-ask") || kitClash.dropped.some((d) => d.brick.id === "review"),
  "session-kit conflicts with standalone todo/review",
);

const browserSlot = analyzeBuild(catalog, ["browser", "agent-browser"]);
assert(
  browserSlot.selected.filter((b) => b.slot === "browser").length === 1,
  "one browser driver only",
);
assert(
  browserSlot.dropped.some((d) => d.brick.id === "agent-browser"),
  "agent-browser loses the shared browser slot",
);

const communityDaily = analyzeBuild(catalog, [
  "extmgr",
  "web-access",
  "mcp-adapter",
  "memory-local",
  "permission-gate",
  "powerline",
  "fuzzy-find",
  "sidequest",
]);
assert(communityDaily.dropped.length === 0, "community-daily preset is compatible");
assert(communityDaily.selected.length === 8, `community-daily kept ${communityDaily.selected.length}`);

const connected = analyzeBuild(catalog, [
  "composio-apps",
  "claude-marketplace",
  "mcp-adapter",
  "agent-browser",
  "web-access",
]);
assert(connected.dropped.length === 0, "connected stack is compatible");
const connectedFrag = composeSettingsFragment(catalog.plate, connected.selected);
assert(connectedFrag.packages.includes("npm:composio-x-pi"), "composio package");
assert(connectedFrag.packages.includes("npm:pi-agent-browser"), "agent-browser package");

console.log("ok", {
  bricks: catalog.bricks.length,
  daily: daily.selected.map((b) => b.id),
  browserDeps: browser.selected.map((b) => b.id),
  communityDaily: communityDaily.selected.map((b) => b.id),
});

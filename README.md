<p align="center">
  <img src="docs/assets/pigo-mark.svg" width="220" alt="pigo — yellow interlocking brick stamped with π">
</p>

<h1 align="center">pigo</h1>

<p align="center">
  <strong>Keep the plate. Pick the bricks. Print the build.</strong><br>
  锁死官方 Pi 底座，把 Oh My Pi 的能力拆成积木，拼完打印 <code>goal.md</code>。
</p>

<p align="center">
  <a href="https://github.com/earendil-works/pi"><img alt="plate" src="https://img.shields.io/badge/plate-official%20Pi-111111?style=flat-square"></a>
  <img alt="status" src="https://img.shields.io/badge/status-v0.4%20community-f5c400?style=flat-square&labelColor=111111">
  <img alt="bricks" src="https://img.shields.io/badge/bricks-36%20curated-2bb673?style=flat-square&labelColor=111111">
  <img alt="runtime" src="https://img.shields.io/badge/runtime-not%20an%20agent-6e6a62?style=flat-square&labelColor=111111">
  <img alt="byok" src="https://img.shields.io/badge/BYOK-browser%20only-6e6a62?style=flat-square&labelColor=111111">
</p>

<p align="center">
  A visual assembly bench for <a href="https://github.com/earendil-works/pi">Pi</a>.<br>
  Sister of <a href="https://github.com/LaplaceYoung/oh-my-dsh">oh-my-dsh</a>
  · cousin of <a href="https://github.com/LaplaceYoung/pixelcraft">pixelcraft</a>.
</p>

> [!NOTE]
> Pigo does **not** run an agent, fork Pi, or install Oh My Pi as a runtime.
> You snap capability bricks onto the locked `pi` nameplate. The bench prints a blueprint *your* coding agent executes.

<p align="center">
  <img src="docs/logo.svg" width="168" alt="pigo mark — brick on the locked Pi plate">
</p>

---

## Why

Oh My Pi is a batteries-included fork. Pi is a small plate with four tools and an extension seam. Most people want the former's capabilities on the latter's skeleton.

Pigo splits those capabilities into **slots**, maps each slot to one `pi install` package or one local TypeScript recipe, then emits:

| Artifact | What it is |
|---|---|
| `goal.md` | Ordered install + copy + verify checklist for *your* coding agent |
| `settings.json` fragment | Merge-only patch for `.pi/settings.json` |
| `build.json` | Machine-readable bill of materials |

Same idea as oh-my-dsh (capabilities through the seam, never through surgery) and pixelcraft (a picture becomes a blueprint).

- Official Pi plate is locked. `read` / `write` / `edit` / `bash` stay put.
- One brick per slot. Same-slot bricks bounce off.
- Curated crate by default. Opt-in npm market searches `keywords:pi-package`.
- Plate replacements (`oh-my-pi`, `omp`, `@oh-my-pi/*`) are blocked.
- BYOK is optional, browser-only, and may polish Intent — never invent packages.

---

## Quick start

```bash
git clone https://github.com/LaplaceYoung/pigo.git
cd pigo/apps/web
python3 -m http.server 4173
```

Open [http://localhost:4173](http://localhost:4173).

1. The center plate is official Pi. The nameplate says `pi`. It cannot be swapped.
2. Snap bricks from the **curated** crate, or load a preset. Same-slot bricks bounce; click again to replace.
3. Optionally switch the crate to **npm market**. Default crate stays curated.
4. Write one sentence of intent. Share the URL — the build lives in the hash.
5. Print `goal.md`, or export the mergeable `settings.json` fragment.
6. Hand `goal.md` to Pi, Claude Code, Codex, or whatever you already use.

```
locked plate          curated / npm bricks         composer
─────────────         ────────────────────         ────────
@earendil-works/      one brick per slot           goal.md
pi-coding-agent       + conflict graph             settings fragment
read write edit bash  + local recipes              build.json
```

GitHub Pages (Settings → Pages → `main` / root; private repos need GitHub Pro):

- https://laplaceyoung.github.io/pigo/
- https://laplaceyoung.github.io/pigo/apps/web/

---

## How a build is composed

Install order is fixed:

1. Confirm `pi --version`
2. `pi install npm:…` packages
3. Copy local recipes into `.pi/extensions/`
4. **Deep-merge** the settings fragment (union `packages` and `extensions`)
5. `/reload`
6. Run the acceptance checks in `goal.md`

Do not overwrite an existing `settings.json`. Arrays in Pi settings *replace* on read, so union them yourself.

```json
{
  "packages": ["npm:pi-lens", "npm:pi-web-access", "npm:pi-mcp-adapter"],
  "extensions": [".pi/extensions/dap-debug.ts"]
}
```

Sample blueprint: [`examples/goal.sample.md`](examples/goal.sample.md).

---

## Brick model

Each brick occupies one slot. One brick per slot.

| Slot | Default brick | Maturity |
|---|---|---|
| plate | official Pi core | locked |
| edit-format | Hashline Edit | community |
| lsp | LSP Lens (`pi-lens`) | community |
| debugger | DAP recipe | partial |
| subagents | `pi-subagents` | community |
| web | `pi-web-access` | community |
| mcp | `pi-mcp-adapter` | community |
| browser | `pi-agent-browser` *or* MCP chrome-devtools | community |
| desktop | computer-use recipe | partial |
| memory | `pi-memory` | community |
| permissions | permission gate | community |
| pack-mgr | `pi-extmgr` | community |

Full map: [`docs/BRICK-LEDGER.md`](docs/BRICK-LEDGER.md). Catalog: [`data/bricks.json`](data/bricks.json).

Market hits that are not in the ledger land in the `unsorted` bin and cannot steal a reserved slot.

---

## Community crate (v0.4)

The official catalog at [pi.dev/packages](https://pi.dev/packages) lists thousands of `pi-package` hits. Pigo does not dump that list onto the plate. A community brick has to earn a **slot**: one capability, one install line, named source, and no plate replacement.

Signal used (Sep 2026 catalog + GitHub monorepos), not a ranking:

| Brick | Package | Why it is on the plate |
|---|---|---|
| MCP Adapter | `pi-mcp-adapter` | Highest-download Pi package. One proxy tool instead of stuffing every MCP schema into context. |
| Web Access | `pi-web-access` | Search + fetch + PDF + YouTube. The default world I/O brick. |
| Subagents | `pi-subagents` | Isolated child sessions. Other subagent packs are alts, not extra slots. |
| LSP Lens | `pi-lens` | Diagnostics / rename / actions after every write. |
| Hashline Edit | `pi-hashline-edit-pro` | Content-hash anchors — closest community stand-in for omp's edit format. |
| Todo + Ask | `@juicesharp/rpiv-todo` + ask-user | Live overlay todos and typed questions. |
| Plan / Goal | `@narumitw/pi-plan-mode` | Read-only plan mode before writes. |
| Review | `@plannotator/pi-extension` | Annotated plan / diff review. |
| Memory | `pi-memory` | One memory pack. `pi-hermes-memory` is the alt. |
| Background Jobs | `pi-background-tasks` | Durable child shells. |
| Permission Gate | `@gotgenes/pi-permission-system` | Confirm destructive bash. |
| Powerline | `pi-powerline-footer` | Footer. Alts: `@narumitw/pi-statusline`, `@ogulcancelik/pi-minimal-footer`. |
| Extension Manager | `pi-extmgr` | `/extensions` TUI for install / enable / search. |
| Composio Apps | `composio-x-pi` | 1000+ SaaS tools with managed auth. |
| Claude Marketplace | `pi-claude-marketplace` | Claude commands / skills / agents / hooks on the Pi plate. |
| Intercom | `pi-intercom` | Mailbox between live sessions. |
| Fuzzy Find | `@ff-labs/pi-fff` | In-process fuzzy file + content search. |
| Piolium Audit | `@vigolium/piolium` | Multi-phase security audits. High context — snap deliberately. |
| SSH Tools | `@ogulcancelik/pi-ssh-tools` | Remote read/write/edit/bash without replacing local tools. |
| Session Kit | `pi-agent-extensions` | 17-extension daily kit (sessions, handoff, notify). Conflicts with standalone todo / review. |
| Firecrawl | `@benvargas/pi-firecrawl` | Site scrape / map. Complementary to web-access. |
| Agent Browser | `pi-agent-browser` | First-class browser driver. Same slot as the MCP chrome-devtools brick. |
| BTW | `@narumitw/pi-btw` | Side question that does not pollute the main transcript. |
| Blackbox | `pi-blackbox` | Tool-call flight recorder for the current session. |

Worthy GitHub collections that stay as *sources*, not as one mega-brick:

- [sids/pi-extensions](https://github.com/sids/pi-extensions) — plan-md, task-subagents, plannotator review
- [narumiruna/pi-extensions](https://github.com/narumiruna/pi-extensions) — `@narumitw/*` daily kit
- [ogulcancelik/pi-extensions](https://github.com/ogulcancelik/pi-extensions) — footer, ssh, compaction, session-recall
- [k3dom/pi-plugins](https://github.com/k3dom/pi-plugins) — Effect-TS single-purpose plugins
- [ben-vargas/pi-packages](https://github.com/ben-vargas/pi-packages) — Firecrawl, Exa, themes, providers
- [jayshah5696/pi-agent-extensions](https://github.com/jayshah5696/pi-agent-extensions) — session kit above
- [artmsilva/agent-tools](https://github.com/artmsilva/agent-tools) — agent-browser, blackbox, gondolin
- [diegopetrucci/pi-extensions](https://github.com/diegopetrucci/pi-extensions) — reviewer / contrarian / librarian subagents

Presets that snap these: **Community daily** and **Connected stack**.

---

## Local recipes

Slots with no first-class Pi package ship a small extension. Copy, then `/reload`.

| Brick | Source | Copy to |
|---|---|---|
| AST Grep | [`packages/recipes/ast-grep/index.ts`](packages/recipes/ast-grep/index.ts) | `.pi/extensions/ast-grep.ts` |
| DAP debugger | [`packages/recipes/dap-debug/index.ts`](packages/recipes/dap-debug/index.ts) | `.pi/extensions/dap-debug.ts` |
| Persistent kernel | [`packages/recipes/eval-kernel/index.ts`](packages/recipes/eval-kernel/index.ts) | `.pi/extensions/eval-kernel.ts` |
| Stream rules | [`packages/recipes/stream-rules/index.ts`](packages/recipes/stream-rules/index.ts) | `.pi/extensions/stream-rules.ts` |
| GitHub as files | [`packages/recipes/github-fs/index.ts`](packages/recipes/github-fs/index.ts) | `.pi/extensions/github-fs.ts` |
| Desktop control | [`packages/recipes/computer-use/index.ts`](packages/recipes/computer-use/index.ts) | `.pi/extensions/computer-use.ts` |
| Rule compat | [`packages/recipes/rule-compat/index.ts`](packages/recipes/rule-compat/index.ts) | `.pi/extensions/rule-compat.ts` |
| Role routing | [`packages/recipes/role-routing/index.ts`](packages/recipes/role-routing/index.ts) | `.pi/extensions/role-routing.ts` |

```bash
mkdir -p .pi/extensions
cp packages/recipes/dap-debug/index.ts .pi/extensions/dap-debug.ts
cp packages/recipes/computer-use/index.ts .pi/extensions/computer-use.ts
```

- **debug** — `launch | attach | set_breakpoint | continue | step_* | evaluate | terminate`. Default adapter is `python3 -m debugpy.adapter`. This is not omp's 28 DAP ops.
- **computer** — `screenshot | windows | click | type | key`. Default `read_only=true`. Mutations require `ctx.ui.confirm`. This is OS input, not a browser driver.

---

## What it is not

- A third coding agent.
- A wrapper that hides `omp` as the engine.
- A fork of Pi that adds tools to the core loop.
- A dump of every `pi-package` on npm onto the plate.
- A server that stores BYOK keys.
- A LEGO-branded product. The visual language is generic interlocking bricks and studs.

---

## Repository

```
apps/web/                 3D plate + crate + composer
apps/web/data/            bricks.json + presets.json
data/bricks.json          same ledger at repo root
packages/catalog/         bricks + presets
packages/composer/        goal.md composer + tests
packages/recipes/         local TypeScript extensions
docs/SPEC.md              product spec
docs/BRICK-LEDGER.md      slot map
docs/CHANGELOG.md
examples/goal.sample.md   sample blueprint
```

---

## Family

| Repo | Role |
|---|---|
| [Pi](https://github.com/earendil-works/pi) | Locked plate |
| [oh-my-dsh](https://github.com/LaplaceYoung/oh-my-dsh) | Capability library for DeepSeek Harness. Never touches the loop. |
| [pixelcraft](https://github.com/LaplaceYoung/pixelcraft) | Picture → blueprint |
| **pigo** | Plate + bricks → `goal.md` |

---

## Status

v0.4 community crate: 36 curated bricks, seven presets, live npm market still opt-in, Pages tree includes the JS bench.

Extensions run as you. Read every `pi install npm:` package before the first load.

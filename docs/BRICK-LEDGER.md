# Brick ledger

Capability slots on the official Pi plate. One brick per slot.

## Plate and OMP-split slots

| Slot | OMP origin | Default brick | Install | Maturity |
|---|---|---|---|---|
| plate | pi-mono core | pi-core | `@earendil-works/pi-coding-agent` | locked |
| edit-format | hashline `edit` | hashline-edit | `pi-hashline-edit-pro` | community |
| ast | `ast_edit` / `ast_grep` | ast-grep | local extension | local-extension |
| lsp | `lsp` | lsp-lens | `pi-lens` | community |
| debugger | `debug` DAP | dap-debug | local extension | partial |
| kernel | `eval` | eval-kernel | local extension | local-extension |
| search | `grep` / `glob` | native-search | Pi built-in tools | core-optional |
| file-nav | — | fuzzy-find | `@ff-labs/pi-fff` | community |
| subagents | `task` | subagents | `pi-subagents` | community |
| plan | `/plan` | plan-goal | `@narumitw/pi-plan-mode` | community |
| session-ops | `todo` / `ask` | todo-ask | `@juicesharp/rpiv-todo` | community |
| session-kit | sessions / handoff | session-kit | `pi-agent-extensions` | community |
| review | `/review` | review | `@plannotator/pi-extension` | community |
| steering | stream rules | stream-rules | local extension | local-extension |
| sidequest | — | sidequest | `@narumitw/pi-btw` | community |
| intercom | mailbox | intercom | `pi-intercom` | community |
| web | `web_search` | web-access | `pi-web-access` | community |
| crawl | `web_fetch` | firecrawl | `@benvargas/pi-firecrawl` | community |
| mcp | MCP host | mcp-adapter | `pi-mcp-adapter` | community |
| browser | `browser` | browser / agent-browser | chrome-devtools MCP **or** `pi-agent-browser` | community |
| github | `pr://` | github-fs | local extension | local-extension |
| docs | rich `read` | docs-office | `pi-docparser` | community |
| desktop | `computer` | computer-use | local extension | partial |
| saas-apps | integrations | composio-apps | `composio-x-pi` | community |
| remote | ssh | ssh-remote | `@ogulcancelik/pi-ssh-tools` | community |
| memory | retain/recall | memory-local | `pi-memory` | community |
| jobs | background | background-tasks | `pi-background-tasks` | community |
| permissions | approvalMode | permission-gate | `@gotgenes/pi-permission-system` | community |
| sandbox | worktree isolation | sandbox | `@sysid/pi-sandbox-extended` | community |
| sec-audit | — | piolium-audit | `@vigolium/piolium` | community |
| statusline | powerline TUI | powerline | `pi-powerline-footer` | community |
| pack-mgr | — | extmgr | `pi-extmgr` | community |
| claude-compat | importer | claude-marketplace | `pi-claude-marketplace` | community |
| telemetry | — | blackbox | `pi-blackbox` | community |
| rules | 8-format importer | rule-compat | local extension | local-extension |
| routing | role models | role-routing | models.json + extension | settings |

## Explicitly not a brick

Installing `oh-my-pi` / `omp` as the runtime. That replaces the plate.
Family bundles (`pi-code`, `pi-maestro-flow`, `omni-pi`) that secretly stack half the crate.

`pi-agent-extensions` is allowed as the **session-kit** brick because it stays on the official plate and declares itself as extensions + themes. It still conflicts with standalone todo / review bricks.

## Market crate policy

Live search uses `https://registry.npmjs.org/-/v1/search?text=keywords:pi-package`.
Default crate only shows curated bricks above. Marketplace hits must map to an existing slot or stay in the "unsorted" bin and cannot snap until reviewed.

Curated community picks are chosen for: distinct slot, real `pi install npm:` surface, source we can name, and not a plate fork. Download count is a signal, not a vote.

## Local recipe files

| Brick id | File |
|---|---|
| ast-grep | `packages/recipes/ast-grep/index.ts` |
| dap-debug | `packages/recipes/dap-debug/index.ts` |
| eval-kernel | `packages/recipes/eval-kernel/index.ts` |
| stream-rules | `packages/recipes/stream-rules/index.ts` |
| github-fs | `packages/recipes/github-fs/index.ts` |
| computer-use | `packages/recipes/computer-use/index.ts` |
| rule-compat | `packages/recipes/rule-compat/index.ts` |
| role-routing | `packages/recipes/role-routing/index.ts` |

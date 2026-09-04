# Brick ledger

Capability slots on the official Pi plate. One brick per slot.

| Slot | OMP origin | Default brick | Install | Maturity |
|---|---|---|---|---|
| plate | pi-mono core | pi-core | `@earendil-works/pi-coding-agent` | locked |
| edit-format | hashline `edit` | hashline-edit | `pi-hashline-edit-pro` | community |
| ast | `ast_edit` / `ast_grep` | ast-grep | local extension | local-extension |
| lsp | `lsp` | lsp-lens | `pi-lens` | community |
| debugger | `debug` DAP | dap-debug | local extension | partial |
| kernel | `eval` | eval-kernel | local extension | local-extension |
| search | `grep` / `glob` | native-search | Pi built-in tools | core-optional |
| subagents | `task` | subagents | `pi-subagents` | community |
| plan | `/plan` | plan-goal | `@narumitw/pi-plan-mode` | community |
| session-ops | `todo` / `ask` | todo-ask | `@juicesharp/rpiv-todo` | community |
| review | `/review` | review | `@plannotator/pi-extension` | community |
| steering | stream rules | stream-rules | local extension | local-extension |
| web | `web_search` | web-access | `pi-web-access` | community |
| mcp | MCP host | mcp-adapter | `pi-mcp-adapter` | community |
| browser | `browser` | browser | mcp + chrome-devtools | community |
| github | `pr://` | github-fs | local extension | local-extension |
| docs | rich `read` | docs-office | `pi-docparser` | community |
| desktop | `computer` | computer-use | local extension | partial |
| memory | retain/recall | memory-local | `pi-memory` | community |
| jobs | background | background-tasks | `pi-background-tasks` | community |
| permissions | approvalMode | permission-gate | `@gotgenes/pi-permission-system` | community |
| sandbox | worktree isolation | sandbox | `@sysid/pi-sandbox-extended` | community |
| statusline | powerline TUI | powerline | `pi-powerline-footer` | community |
| rules | 8-format importer | rule-compat | local extension | local-extension |
| routing | role models | role-routing | models.json + extension | settings |

## Explicitly not a brick

Installing `oh-my-pi` / `omp` as the runtime. That replaces the plate.
Family bundles (`pi-code`, `pi-maestro-flow`, `omni-pi`) that secretly stack half the crate.

## Market crate policy

Live search uses `https://registry.npmjs.org/-/v1/search?text=keywords:pi-package`.
Default crate only shows curated bricks above. Marketplace hits must map to an existing slot or stay in the "unsorted" bin and cannot snap until reviewed.

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

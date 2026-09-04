# Goal: assemble this Pi agent with Pigo

> Sample output for the daily refactor preset.

## Intent

日常 TypeScript / Python 重构：要 LSP、稳编辑、能查文档，并挡住危险命令。

## Invariants

- Do not fork Pi or replace the four core tools.
- Do not install Oh My Pi (omp) as a whole runtime.
- Add capabilities only through pi install, settings.json, skills, or local TypeScript extensions.

## Bill of materials

- **Hashline Edit** (`hashline-edit`) · `pi install npm:pi-hashline-edit-pro`
- **LSP Lens** (`lsp-lens`) · `pi install npm:pi-lens`
- **Web Access** (`web-access`) · `pi install npm:pi-web-access`
- **MCP Adapter** (`mcp-adapter`) · `pi install npm:pi-mcp-adapter`
- **Code Review** (`review`) · `pi install npm:@plannotator/pi-extension`
- **Permission Gate** (`permission-gate`) · `pi install npm:@gotgenes/pi-permission-system`

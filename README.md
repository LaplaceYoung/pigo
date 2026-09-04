# pigo

**Keep the plate. Pick the bricks. Print the build.**

Pigo is a visual assembly bench for [Pi](https://github.com/earendil-works/pi).
It is the Pi-world sister of [oh-my-dsh](https://github.com/LaplaceYoung/oh-my-dsh) and the blueprint cousin of [pixelcraft](https://github.com/LaplaceYoung/pixelcraft).

- The plate is always official Pi. `read` / `write` / `edit` / `bash` stay put.
- Bricks are Oh My Pi capabilities split into slots, plus curated `pi-package` community modules.
- The deliverable is `goal.md` — a blueprint you hand to your own coding agent.
- Pigo is not a third agent and not an `omp` fork.

## Open the bench

```bash
cd apps/web
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

1. Snap bricks from the crate onto the `pi` nameplate.
2. Same-slot bricks bounce off (one LSP pack, one memory pack, one subagent pack).
3. Write one sentence of intent.
4. Print `goal.md`. BYOK is optional and stays in the browser.

## Repository

```
apps/web                3D plate + crate + composer UI
packages/catalog        bricks.json
packages/composer       deterministic goal.md engine
docs/SPEC.md            product spec
docs/BRICK-LEDGER.md    slot map
```

## Invariants

- Do not install Oh My Pi as the runtime.
- Do not fork Pi to add features.
- Add power only with `pi install`, `settings.json`, skills, or local TypeScript extensions.
- Review package source. Extensions run as you.

## Status

v0 bench: curated crate, slot conflicts, local composer, optional BYOK polish.
Next: live npm `keywords:pi-package` crate, shareable build links, settings.json export.

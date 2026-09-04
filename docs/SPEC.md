# Pigo specification

Pigo is the Pi-world sister of [oh-my-dsh](https://github.com/LaplaceYoung/oh-my-dsh) and the blueprint cousin of [pixelcraft](https://github.com/LaplaceYoung/pixelcraft).

- oh-my-dsh: capability library for DeepSeek Harness. Never touches the agent loop.
- pixelcraft: picture → bead blueprint.
- **pigo: official Pi plate + capability bricks → `goal.md` blueprint.**

Pigo is not a coding agent and not an Oh My Pi fork.

## One-liner

Keep the plate. Pick the bricks. Print the build.

## Loop

1. User opens the bench.
2. Center stage shows a studded plate with a nameplate `pi`.
3. The crate on the left holds OMP-split capabilities and curated community packages.
4. Clicking a brick snaps it onto the plate. Same-slot bricks bounce off.
5. User states intent, optionally pastes a BYOK key.
6. Composer emits `goal.md` + `build.json`.
7. User sends `goal.md` to their own coding agent. That agent installs Pi packages / writes local extensions.

## Non-goals

- Do not ship a third runtime.
- Do not wrap `omp` as a hidden engine.
- Do not scrape all 5k+ `pi-package` npm entries onto the plate.
- Do not persist BYOK keys on a server.

## Brick model

See `packages/catalog/bricks.json` and `docs/BRICK-LEDGER.md`.

Each brick maps one capability slot to one install recipe.

## Composer

`packages/composer/compose.js` is the source of truth for install order and conflicts.
BYOK may rewrite prose. It may not invent packages.

## Trademark

Visual language is generic interlocking bricks and studs.
Product copy uses plate / brick / stud / crate / nameplate.
Do not brand the product as LEGO.

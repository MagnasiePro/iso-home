# IsoHome — repo map

Touch-controlled isometric view of a room for Home Assistant wall tablets. pnpm monorepo,
TypeScript strict, PixiJS v8. Governance lives in `.specify/memory/constitution.md`; the current
feature is specified in `specs/001-poc-room-control/` (spec, plan, tasks, quickstart).

## Commands

```sh
pnpm check                                         # lint + typecheck + unit tests (pre-commit + CI)
pnpm lint:fix                                      # Biome autofix
pnpm generate:schemas                              # zod -> JSON Schema (packages/core/model/schemas)
pnpm --filter @iso-home/core-render test:e2e       # Playwright: gestures + idle redraws
pnpm --filter @iso-home/ha-card test:visual        # Playwright: tablet pan/zoom screenshot
pnpm --filter @iso-home/ha-card check:size         # build + 300 KB gzip budget
pnpm --filter @iso-home/playground dev [--mode live]
```

Playwright is pinned to 1.59 to match the locally installed Chromium build.

## Layout

- `packages/core/model` — zod schemas (HomeModel, Room, PlacedObject, ElementPack, QuickAction),
  merge, slug, grid snap, `validateElementPack`. The quick-action domain allowlist (FR-009) lives
  in `quick-action.ts`; do not weaken it.
- `packages/core/render` — PixiJS scene, camera, gesture recognizer, interactions, sprite state,
  halo, `ConnectionState`. No Home Assistant imports (Principle III).
- `packages/importer-magicplan` — SVG -> Room (see `docs/adr/0001`).
- `packages/ha-card` — Lit custom card, single ES module. The build aliases Pixi's WebGPU
  renderer to a stub (`src/webgpu-stub.ts`) to stay under 300 KB, so the card is WebGL-only.
- `apps/playground` — mock mode (default) and live mode (`--mode live`, token in
  `apps/playground/.env.local`, never committed). Entity ids in `src/devices.ts` are placeholders.
- `packs/base` — data-only element packs; sprites are generated placeholders.

## Conventions

- New element type = new pack folder, no core change.
- A forbidden quick action drops the quick action and keeps the device tap-only (not whole-pack
  rejection).
- Rendering is on demand through `IdleRenderLoop`; anything animating must call
  `setAnimating(true)` and stop it after.
- Playground exposes `window.__isoHome` (read-only) for the Playwright specs.

## Status

POC code complete. Open: T039a (touch check on Companion app / Fully Kiosk) and a live run against
a real Home Assistant. See `docs/ROADMAP.md`.

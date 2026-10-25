# Implementation Plan: POC – One Room, Touch-Controlled on a Tablet

**Branch**: `001-poc-room-control` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-poc-room-control/spec.md`

## Summary

Prove, end to end, that a Magicplan room export can become a recognizable isometric pixel-art
scene with real Home Assistant devices placed in it, touch-controllable on a wall tablet with
live state feedback. The approach is a platform-agnostic core (model + renderer) fed by a
Magicplan importer and data-only element packs, consumed by two thin adapters — a Home Assistant
Lovelace card and a standalone playground — so Home Assistant never leaks into core code.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js 20 LTS (pnpm workspaces toolchain)

**Primary Dependencies**: PixiJS v8 (nearest-neighbor WebGPU/WebGL/Canvas rendering), Lit (HA
Lovelace card shell), `home-assistant-js-websocket` (playground live mode + card connection
state), zod (runtime validation of `HomeModel` and pack manifests, source for generated JSON
Schema)

**Storage**: N/A — the POC's `HomeModel` is a hand-written JSON file merged with importer output
at build/dev time; no database or server-side persistence

**Testing**: Vitest (unit: importer, model validation, gesture math), Playwright (integration:
mock-mode gesture flows; visual: tablet-viewport + 4x-CPU-throttled render snapshots)

**Target Platform**: Browser surfaces only — a Home Assistant Lovelace card running inside HA's
frontend on wall tablets (HA Companion app on iOS/Android, Fully Kiosk Browser) and a standalone
Vite-served playground for development and live validation

**Project Type**: Web — pnpm workspace monorepo: one platform-agnostic core library, one importer
library, one data-only pack directory, two thin adapter apps (card + playground)

**Performance Goals**: 0 redraws/second while idle; a real Home Assistant state change reflected
in the sprite within 1 second (SC-002); panning/zooming stays visually smooth on a tablet profile
with CPU throttled 4x (SC-007)

**Constraints**: `packages/ha-card` bundle MUST stay under 300KB gzipped (packs excluded); one
sprite atlas per pack; `devicePixelRatio` capped at 2; renderer MUST fall back
WebGPU → WebGL → Canvas; every interaction MUST work by touch alone with ≥44×44px tap targets; no
Home Assistant token MUST ever be committed (`.env.local` only)

**Scale/Scope**: Exactly one room, one house, one tablet instance — a POC, not a multi-room or
multi-tenant product

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Representation, Not Reproduction | Importer snaps to a 0.5m grid; no architectural precision goal | PASS |
| II. Visual Consistency | All assets must follow `docs/STYLE_GUIDE.md` | PASS — publishing the style guide is itself part of this feature's scope (FR-016) |
| III. Core Platform Agnosticism | `packages/core` must not import Home Assistant or its DOM | PASS — HA only appears in `packages/ha-card` and `apps/playground` |
| IV. Extensibility Through Data | New element type = new pack folder, no core change | PASS — demonstrated by the "plant" example pack (FR-011) |
| V. Validated Data Contracts | `HomeModel`/manifests in zod, with generated JSON Schema | PASS — see Phase 1 contracts |
| VI. Minimalism | Reuse platform/libs first; no abstraction without a 2nd use case | PASS — gestures hand-rolled on Pointer Events rather than a new dependency (see research.md); core already has two real consumers (card, playground) justifying its adapter boundary |
| VII. Local Quality Gate First | lefthook (lint/typecheck/test) blocks commits; CI replays it | PASS — planned as setup tasks, not yet wired (new repo) |
| VIII. Security | No committed tokens; sensitive domains never actuated without confirmation | PASS — forbidden-domain blocklist (FR-009) + `.env.local` for the playground's live mode |
| IX. Tablet-First | On-demand rendering, 100% touch, resource budget, sober animations | PASS — directly reflected in Technical Context constraints and FR-004/008/013/014 |

No violations requiring justification. Complexity Tracking is not needed.

**Post-Phase 1 re-check**: `data-model.md` and `contracts/` keep Home Assistant entirely out of
`packages/core` (III), express every exchanged shape as zod with generated JSON Schema (V), add
no new dependency beyond the stack already fixed by the constitution (VI), and the stale-sprite
reconnection behavior and forbidden-domain rejection are both load/runtime-time gates, not UI
suggestions (VIII, IX). Gate still PASSES — no changes to the table above.

## Project Structure

### Documentation (this feature)

```text
specs/001-poc-room-control/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/            # Phase 1 output
│   ├── home-model.schema.md
│   ├── pack-manifest.schema.md
│   └── ha-card-interface.md
└── tasks.md              # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
packages/
├── core/
│   ├── model/            # HomeModel, Room, PlacedObject: zod schemas + validation + merge logic
│   │   └── tests/
│   └── render/            # PixiJS scene: tile/wall rendering, depth sort, gestures, sprite state
│       └── tests/
├── importer-magicplan/    # Magicplan (SVG/DXF) → HomeModel geometry
│   └── tests/
└── ha-card/                # custom:iso-home-card — Lovelace adapter (Lit shell + packages/core/render)
    └── tests/

apps/
└── playground/             # Standalone Vite app: mock mode + live mode (home-assistant-js-websocket)
    └── tests/

packs/
└── base/                   # Data-only: lamp, ceiling-light, tv, speaker, plant (manifest + spritesheet)

fixtures/
└── magicplan/               # Sample room export(s): SVG and DXF, used by importer tests

docs/
├── STYLE_GUIDE.md
├── ASSET_PROMPTING.md
├── ROADMAP.md
└── adr/
    └── 0001-magicplan-source-format.md   # FR-015's required decision record
```

**Structure Decision**: A pnpm workspace monorepo, matching the constitution's stack. `packages/core`
has zero Home Assistant dependency (Principle III); `packages/importer-magicplan` only produces
`HomeModel` geometry; `packages/ha-card` and `apps/playground` are the two real consumers of core
that justify its existence as a separate package (Principle VI); `packs/base` is data, not code
(Principle IV); `docs/adr/` holds the Magicplan-format decision this feature's spec requires
(FR-015).

## Complexity Tracking

*No violations — table omitted.*

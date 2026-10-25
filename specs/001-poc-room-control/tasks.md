---

description: "Task list for POC – One Room, Touch-Controlled on a Tablet"
---

# Tasks: POC – One Room, Touch-Controlled on a Tablet

**Input**: Design documents from `/specs/001-poc-room-control/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Included — the spec itself requires them (`pnpm check` with tests, an importer fixture
test, and a Playwright visual capture for pan/zoom), and the constitution's Principle VII makes
the local test gate non-negotiable.

**Organization**: Tasks are grouped by user story (spec.md: US1/US2/US3, priority order) so each
milestone can be implemented and validated independently, matching the spec's three sign-off
checkpoints.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (P1, room rendered), US2 (P2, touch control in mock mode), US3 (P3, live HA)

## Path Conventions

Monorepo per plan.md: `packages/core/{model,render}`, `packages/importer-magicplan`,
`packages/ha-card`, `apps/playground`, `packs/base`, `fixtures/magicplan`, `docs/`.

---

## Phase 1: Setup

**Purpose**: Stand up the pnpm workspace monorepo and its quality tooling.

- [X] T001 Create the workspace skeleton (`packages/core/model`, `packages/core/render`,
  `packages/importer-magicplan`, `packages/ha-card`, `apps/playground`, `packs/base`,
  `fixtures/magicplan`, `docs/adr`) per plan.md's Project Structure
- [X] T002 Initialize root `package.json` and `pnpm-workspace.yaml`, with a shared strict
  `tsconfig.base.json` (TypeScript strict mode, per plan.md Technical Context)
- [X] T003 [P] Configure Biome for lint/format across the workspace (`biome.json`)
- [X] T004 [P] Configure lefthook (`lefthook.yml`) to run lint, typecheck, and tests on
  pre-commit, per constitution Principle VII (non-negotiable)
- [X] T005 [P] Add a GitHub Actions workflow (`.github/workflows/ci.yml`) that replays the same
  lint/typecheck/test checks on every PR, per constitution Principle VII
- [X] T006 [P] Add a root `pnpm check` script (lint + typecheck + test) that lefthook and CI both
  call, so the two never drift

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The validated data contracts every story depends on (Principle V). No user story
work starts until this phase is done.

**⚠️ CRITICAL**: Blocks all of Phase 3–5.

- [X] T007 Define zod schemas for `Point`, `Opening`, `Room`, and `PlacedObject` in
  `packages/core/model/src/schemas.ts`, per data-model.md's field tables: `Room.id` matches
  `^[a-z0-9]+(-[a-z0-9]+)*$`; `Room.polygon` has ≥3 points; `PlacedObject.rotation` is
  `0 | 90 | 180 | 270`; `PlacedObject.entityId` is optional and matches
  `^[a-z_]+\.[a-z0-9_]+$` when present
- [X] T008 [P] Define the zod schema for the `HomeModel` root (`version: "1"`, `rooms: Room[]`,
  `objects: PlacedObject[]`) in `packages/core/model/src/home-model.ts` (depends on T007)
- [X] T009 [P] Define the zod schema for the `ElementPack` manifest (`id`, `type`, `haDomains[]`,
  `footprint`, `sprites`, `stateMap`, optional `quickAction`) in
  `packages/core/model/src/pack-schema.ts`, per contracts/pack-manifest.schema.md
- [X] T010 [P] Define the `QuickAction` schema with a domain-blocklist validator (`lock`,
  `alarm_control_panel`, `valve`, or `cover` with `device_class` in `garage`/`door`/`gate`) in
  `packages/core/model/src/quick-action.ts`, per contracts/pack-manifest.schema.md's FR-009 rule
- [X] T011 Implement the deterministic room-id slug function (`name → id`) in
  `packages/core/model/src/slug.ts`, used by both the importer and the merge validator
  (Clarification 1)
- [X] T012 Implement the `HomeModel` merge function (importer `rooms` output + hand-written
  `objects`) in `packages/core/model/src/merge.ts`, which MUST throw naming the offending object
  id and unmatched `roomId` if any `objects[].roomId` doesn't match a `rooms[].id` (depends on
  T008, T011)
- [X] T013 [P] Set up the shared Vitest config at the repo root and wire it into
  `packages/core/model/package.json`
- [X] T014 [P] Add the `zod-to-json-schema` generation script (`pnpm generate:schemas`) that
  produces JSON Schema from the T007–T010 zod schemas, per research.md §7

**Checkpoint**: Validated contracts exist — US1/US2/US3 implementation can begin.

---

## Phase 3: User Story 1 - See the room, recognizably (Priority: P1) 🎯 MVP

**Goal**: A Magicplan export becomes a recognizable, auto-fit, idle-at-rest isometric room.

**Independent Test**: In mock mode, a person unfamiliar with the real room identifies its shape,
doors, and windows from the rendered scene, and an on-screen counter shows 0 redraws/second while
idle (quickstart.md Milestone 1).

### Tests for User Story 1

- [X] T015 [P] [US1] Unit test for Magicplan geometry extraction against
  `fixtures/magicplan/*.svg`/`*.dxf` in `packages/importer-magicplan/tests/extract.test.ts`
  (spec Acceptance Scenario 1, FR-001)
- [X] T016 [P] [US1] Unit test for 0.5m grid snapping in
  `packages/core/model/tests/snap.test.ts`
- [X] T017 [P] [US1] Playwright test asserting 0 redraws/second while idle in
  `packages/core/render/tests/idle-render.spec.ts` (SC-006)

### Implementation for User Story 1

- [X] T018 [US1] Analyze both `fixtures/magicplan/*.svg` and `*.dxf` and write
  `docs/adr/0001-magicplan-source-format.md` recording the chosen source format and why
  (FR-015, research.md §1)
- [X] T019 [US1] Implement the Magicplan geometry extractor (walls/doors/windows) for the chosen
  format in `packages/importer-magicplan/src/extract.ts`, converting to meters and snapping to
  the 0.5m grid (FR-001) (depends on T018)
- [X] T020 [US1] Implement importer → `Room` mapping (polygon + openings, id via T011's slug) in
  `packages/importer-magicplan/src/to-home-model.ts` (depends on T019, T011)
- [X] T021 [P] [US1] Implement the PixiJS `Application` bootstrap with WebGPU→WebGL→Canvas
  fallback and `devicePixelRatio` capped at 2 in `packages/core/render/src/app.ts` (research.md
  §4)
- [X] T022 [US1] Implement floor-tile and wall rendering with painter's-algorithm depth sort
  (`x + y`) and front-wall culling in `packages/core/render/src/scene.ts` (research.md §2)
  (depends on T021)
- [X] T023 [US1] Implement auto-fit-to-viewport for portrait and landscape in
  `packages/core/render/src/viewport.ts` (depends on T022)
- [X] T024 [US1] Implement the idle-render loop — redraw only on state change, interaction, or an
  in-progress animation, otherwise stay at rest (FR-008) — in
  `packages/core/render/src/render-loop.ts` (depends on T022)
- [X] T025 [US1] Wire `apps/playground` mock mode to merge the importer's output (T020) with a
  hand-written device-list fixture (via T012) and render the bare room in
  `apps/playground/src/main.ts` (depends on T020, T012, T023, T024)

**Checkpoint**: Milestone 1 — importer + bare room rendered, zero idle redraws. Stop for sign-off.

---

## Phase 4: User Story 2 - Touch a device to control it (Priority: P2)

**Goal**: Tap opens a device; long-press fires its quick action; gestures never scroll the page;
forbidden-domain quick actions are rejected at load.

**Independent Test**: In mock mode, tap opens the mock info panel; long-press on a quick-action
lamp toggles it with a progress ring and haptic feedback, no popup; a pack declaring a forbidden
quick action is rejected with a console message (quickstart.md Milestone 2).

### Tests for User Story 2

- [X] T026 [P] [US2] Unit test for long-press threshold/cancel logic (~500ms, cancel if the
  finger moves >10px) in `packages/core/render/tests/gestures.test.ts` (FR-005)
- [X] T027 [P] [US2] Unit test for forbidden-domain pack rejection in
  `packages/core/model/tests/pack-validation.test.ts` (FR-009)
- [X] T028 [P] [US2] Playwright test covering tap, long-press, one-finger pan, pinch, and
  double-tap in mock mode in `packages/core/render/tests/gestures.spec.ts` (spec User Story 2
  Acceptance Scenarios)

### Implementation for User Story 2

- [X] T029 [P] [US2] Author base pack manifests and placeholder spritesheets (lamp, ceiling
  light, TV, speaker, plant) under `packs/base/*/manifest.json` (FR-010, FR-011), each following
  contracts/pack-manifest.schema.md
- [X] T030 [US2] Implement the pack loader with manifest validation and forbidden-domain
  rejection (clear console message) in `packages/core/render/src/pack-loader.ts` (depends on
  T010, T029)
- [X] T031 [US2] Implement Pointer Events gesture handling — tap, long-press (progress ring +
  `navigator.vibrate` where supported), one-finger pan, integer-step pinch zoom, double-tap
  recenter — in `packages/core/render/src/gestures.ts` (research.md §3) (depends on T022)
- [X] T032 [US2] Set `touch-action: none` on the render canvas so gestures never scroll the page
  (FR-013) in `packages/core/render/src/app.ts` (depends on T021)
- [X] T033 [US2] Implement `SpriteState` (visualState/optimistic/stale/errorFlag) with
  optimistic-update-then-rollback logic in `packages/core/render/src/sprite-state.ts`
  (data-model.md) (depends on T022)
- [X] T034 [US2] Wire tap → open-device callback, and long-press → quick-action-or-tap-fallback
  dispatch in `packages/core/render/src/interactions.ts` (depends on T030, T031, T033)
- [X] T035 [US2] Implement the 44×44px minimum tap-target enlargement (beyond sprite bounds when
  needed) in `packages/core/render/src/hit-area.ts` (FR-014) (depends on T022)
- [X] T036 [US2] Wire `apps/playground` mock mode to simulated entity states with debug toggles
  and a mock info panel on tap in `apps/playground/src/mock-mode.ts` (depends on T034)

**Checkpoint**: Milestone 2 — elements placed, gestures and forbidden-domain rejection working in
mock mode. Stop for sign-off.

---

## Phase 5: User Story 3 - Wire it to the real house (Priority: P3)

**Goal**: Real Home Assistant state drives the tablet within 1 second; taps/long-presses control
real devices; a dropped connection visibly marks every sprite stale instead of lying about state.

**Independent Test**: Toggling the real lamp from the Home Assistant app updates the tablet
sprite within 1 second; killing the connection dims every sprite until it's confirmed back
(quickstart.md Milestone 3).

### Tests for User Story 3

- [X] T037 [P] [US3] Unit test for the generic `ConnectionState` store's transitions
  (`connected` ↔ `reconnecting`) in `packages/core/render/tests/connection-state.test.ts`
  (FR-017) — no Home Assistant import in this test; it only exercises the plain setter
- [X] T038 [P] [US3] Playwright visual test for pan/zoom smoothness on a tablet viewport with 4x
  CPU throttling, with a reference screenshot, in
  `packages/ha-card/tests/visual/pan-zoom.spec.ts` (SC-007, research.md §8)
- [X] T039 [P] [US3] Integration test asserting a simulated `home-assistant-js-websocket` state
  change reflects in the sprite within 1 second, in
  `packages/ha-card/tests/live-update.test.ts` (SC-002)
- [ ] T039a [US3] Manual verification: confirm touch-only operation on the Home Assistant
  Companion app (iOS and Android) and on Fully Kiosk Browser, per SC-008; record the outcome in
  `quickstart.md`'s Milestone 3 section

### Implementation for User Story 3

- [X] T040 [P] [US3] Implement a generic `ConnectionState` store (`status: "connected" |
  "reconnecting"`, a plain `setStatus()` setter) with **no Home Assistant import** in
  `packages/core/render/src/connection-state.ts` (FR-017) — core stays platform-agnostic
  (constitution Principle III); HA-specific wiring happens in T043 and T046 below (depends on
  T033)
- [X] T041 [US3] Implement stale-sprite dimming applied to every `SpriteState` when
  `ConnectionState.status !== "connected"`, reverting on reconnect, in
  `packages/core/render/src/sprite-state.ts` (FR-017) (depends on T033, T040)
- [X] T042 [US3] Implement halo tinting for a lit lamp sprite from its `rgb_color`/`brightness`
  attributes, when present, in `packages/core/render/src/halo.ts` (FR-007) (depends on T033)
- [X] T043 [US3] Implement the `packages/ha-card` Lit shell: `hass` setter diffing watched
  entities into `SpriteState`, `setConfig` loading the `HomeModel` and packs, and deriving
  connection status from `hass.connection`'s own lifecycle events (the card never opens its own
  socket) to call T040's `setStatus()`, in `packages/ha-card/src/iso-home-card.ts`
  (contracts/ha-card-interface.md) (depends on T025, T034, T040)
- [X] T044 [US3] Wire tap → dispatch a bubbling, composed `hass-more-info` CustomEvent with
  `{ entityId }` in `packages/ha-card/src/iso-home-card.ts` (depends on T043)
- [X] T045 [US3] Wire long-press → `hass.callService` with the pack's `quickAction.service` in
  `packages/ha-card/src/iso-home-card.ts` (depends on T043)
- [X] T046 [P] [US3] Implement `apps/playground` live mode: a `home-assistant-js-websocket`
  connection reading its token only from `.env.local`, a mini on/off+brightness panel on tap,
  long-press calling the same service as the card, and deriving connection status from this
  connection's own lifecycle to call T040's `setStatus()`, in
  `apps/playground/src/live-mode.ts` (contracts/ha-card-interface.md) (depends on T034, T040)
- [X] T047 [US3] Configure `packages/ha-card`'s Vite library-mode build to emit a single ES
  module and verify its gzip size stays under 300KB with packs excluded, in
  `packages/ha-card/vite.config.ts` (research.md §6)

**Checkpoint**: Milestone 3 — live Home Assistant wiring, real device control, honest
stale-state behavior on disconnect. Stop for sign-off.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Contributor-facing docs and project-memory upkeep the constitution requires, plus
final verification.

- [X] T048 [P] Write `docs/STYLE_GUIDE.md` (2:1 dimetric projection, 64×32 tile, locked palette,
  top-left light, 1px dark outline, no anti-aliasing), per constitution Principle II
- [X] T049 [P] Write `docs/ASSET_PROMPTING.md` with prompt templates and a contributor validation
  checklist (palette, projection, size, states, tap zone)
- [X] T050 [P] Write `README.md` (with a GIF and HACS install steps), `CONTRIBUTING.md`, and a
  "propose a pack" GitHub issue template
- [X] T051 [P] Generate and commit the JSON Schema files for `HomeModel` and the pack manifest
  via `pnpm generate:schemas` (T014) into `packages/core/model/schemas/*.json`
- [X] T052 Update `CLAUDE.md` and `docs/ROADMAP.md` to reflect the POC's completed state, per the
  constitution's Project Memory & Workflow section
- [X] T053 Run `pnpm check` (lint + typecheck + tests) across the workspace and fix any failures
- [ ] T054 Run all three `quickstart.md` milestone validations end-to-end and capture the
  sign-off screenshots the spec's Method calls for

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS Phases 3–5
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; reuses US1's scene/render infrastructure
  (T022) but does not require US1's importer/playground wiring to be finished first
- **User Story 3 (Phase 5)**: Depends on Foundational; its `ha-card`/live-mode tasks (T043, T046)
  build on US1's merge+render pipeline (T025) and US2's interaction/sprite-state layer (T034),
  so in practice runs after US1 and US2
- **Polish (Phase 6)**: Depends on the user stories it documents/verifies being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on US2/US3 — independently testable per quickstart Milestone 1
- **US2 (P2)**: Reuses US1's render scene (T022) as infrastructure but is independently testable
  in mock mode per quickstart Milestone 2
- **US3 (P3)**: Integrates US1 (T025) and US2 (T034) into the live adapters; independently
  testable against a real/simulated HA connection per quickstart Milestone 3

### Within Each User Story

- Tests are written before the implementation tasks they cover, per the spec's explicit test
  requirements
- Schemas/models (Phase 2) before importer/render logic before adapter wiring
- Story complete and signed off before moving to the next priority, per the spec's Method

### Parallel Opportunities

- T003–T006 (Setup) in parallel
- T008–T010, T013–T014 (Foundational) in parallel once T007 lands
- T015–T017 (US1 tests) in parallel; T021 can start alongside the importer tasks (T018–T020)
- T026–T028 (US2 tests) in parallel; T029 (pack authoring) in parallel with T031/T032/T033
- T037–T039 (US3 tests) in parallel; T040 and T046 in parallel once T033/T034 land
- T048–T051 (Polish docs/schemas) in parallel

---

## Parallel Example: User Story 1

```bash
# Tests, together:
Task: "Unit test for Magicplan geometry extraction in packages/importer-magicplan/tests/extract.test.ts"
Task: "Unit test for 0.5m grid snapping in packages/core/model/tests/snap.test.ts"
Task: "Playwright idle-render test in packages/core/render/tests/idle-render.spec.ts"

# Independent implementation slices, together:
Task: "PixiJS Application bootstrap with renderer fallback in packages/core/render/src/app.ts"
Task: "Magicplan ADR (docs/adr/0001-magicplan-source-format.md)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1)
2. **Stop and get sign-off** on the rendered, idle-at-rest room (quickstart Milestone 1)

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → sign-off (Milestone 1)
3. US2 → sign-off (Milestone 2)
4. US3 → sign-off (Milestone 3)
5. Polish (docs, schemas, CLAUDE.md/ROADMAP.md, full `pnpm check`)

Each milestone is a real stopping point per the spec's Method — do not start the next story's
implementation tasks before the prior milestone's sign-off.

---

## Notes

- `[P]` tasks touch different files and have no unmet dependency
- `[US#]` traces every story-phase task back to spec.md's prioritized user stories
- Commit after each task or logical group
- Stop at each milestone checkpoint for the explicit sign-off the spec's Method requires

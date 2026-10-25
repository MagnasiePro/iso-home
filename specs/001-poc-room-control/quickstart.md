# Quickstart: POC – One Room, Touch-Controlled on a Tablet

Validates the feature end-to-end against the three milestones in the spec's Assumptions. Each
section is a stopping point — get sign-off before moving to the next (per the spec's Method).

## Prerequisites

- `pnpm install` at the repo root (installs the workspace).
- A Magicplan export (SVG and DXF) placed under `fixtures/magicplan/` for the room being tested.
- A hand-written device list JSON following `contracts/home-model.schema.md`, with real
  `entityId`s for Milestone 3.
- For Milestone 3 only: a Home Assistant long-lived access token in `apps/playground/.env.local`
  (never commit this file).

## Milestone 1 — Importer + bare room rendered

```sh
pnpm --filter importer-magicplan test
pnpm --filter playground dev
```

**Expected outcome**: the importer test passes against the fixture; opening the playground (mock
mode, no devices placed yet) shows the room's wall outline, doors, and windows, auto-fit to the
viewport in both portrait and landscape. Zero redraws/second while idle (SC-006), shown by the
on-screen debug counter.

## Milestone 2 — Elements placed, gestures in mock mode

```sh
pnpm --filter playground dev -- --mode=mock
```

**Expected outcome**: devices from the hand-written list (data-model.md's `PlacedObject`s) appear
on their packs' sprites. Tap opens the mock info panel; long-press on a `quickAction` device
toggles it optimistically with a progress ring and haptic feedback where supported; pan/pinch/
double-tap work as described in `spec.md`'s Acceptance Scenarios for User Story 2. A pack that
declares a quick action on a forbidden domain is rejected at load with a console message
(FR-009) — try this with a deliberately misconfigured test pack.

## Milestone 3 — Live Home Assistant wiring

```sh
pnpm --filter playground dev -- --mode=live
```

and, separately, install `packages/ha-card`'s build output as a HACS custom repository on a real
Home Assistant instance.

**Expected outcome**: toggling the real device from the Home Assistant app updates the tablet
sprite within 1 second (SC-002); a long-press on the tablet toggles the real device; a lit lamp's
halo reflects its real `rgb_color`/`brightness`; killing the network (or restarting HA) visibly
dims every sprite within one render cycle, and they return to normal within 1 second of
reconnecting (SC-009).

## Full verification

```sh
pnpm check   # lint + typecheck + unit tests, same as the lefthook pre-commit gate
pnpm --filter ha-card test:visual   # Playwright, tablet viewport, 4x CPU throttle (SC-007)
```

See `data-model.md` for the exact shapes being exercised and `contracts/` for the three external
interfaces (`HomeModel`, pack manifests, the Lovelace card) this quickstart validates against.

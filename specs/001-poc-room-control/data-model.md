# Phase 1 Data Model: POC – One Room, Touch-Controlled on a Tablet

All persisted/exchanged shapes are zod schemas in `packages/core/model` (Principle V); the
runtime-only shapes live beside the renderer in `packages/core/render`. Field names are kept
`camelCase` end-to-end to match the spec's Key Entities.

## HomeModel (root)

| Field | Type | Notes |
|---|---|---|
| `version` | `"1"` (literal) | Lets future POCs evolve the shape without breaking old files |
| `rooms` | `Room[]` | Exactly one entry for this POC (FR per spec Assumptions: one room) |
| `objects` | `PlacedObject[]` | The hand-written device list merged with importer output |

**Validation (merge-time, Clarification 1)**: every `objects[].roomId` MUST equal some
`rooms[].id`. If not, the merge MUST throw with a message naming the offending object id and the
unmatched `roomId` — this is a hard failure, not a silent drop.

## Room

| Field | Type | Notes |
|---|---|---|
| `id` | `string`, pattern `^[a-z0-9]+(-[a-z0-9]+)*$` | Deterministic slug of `name` (Clarification 1); same input name always yields the same id |
| `name` | `string` | Human-readable room name |
| `polygon` | `Point[]`, ≥3 points | Room outline in meters, snapped to a 0.5m grid (FR-001) |
| `openings` | `Opening[]` | Doors/windows along the polygon's edges |

## Point

| Field | Type | Notes |
|---|---|---|
| `x` | `number` | Meters, room-local |
| `y` | `number` | Meters, room-local |

## Opening

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique within the room |
| `type` | `"door" \| "window"` | |
| `wallSegmentIndex` | `number` | Index into `Room.polygon`'s edge list the opening sits on |
| `width` | `number` | Meters |

## PlacedObject

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique within `HomeModel.objects` |
| `type` | `string` | Must match some loaded `ElementPack.type` |
| `roomId` | `string` | FK → `Room.id`; validated at merge time (Clarification 1) |
| `position` | `Point` | Room-local meters |
| `rotation` | `0 \| 90 \| 180 \| 270` | Degrees |
| `entityId` | `string`, optional | Home Assistant entity id, pattern `^[a-z_]+\.[a-z0-9_]+$`; absent for decorative objects (e.g. the "plant" example) |

**Lifecycle**: authored by hand for the POC, merged with the importer's `rooms` output into one
`HomeModel` at dev/build time. No runtime creation/deletion — this POC has no house editor.

## ElementPack manifest (`packs/*/manifest.json`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Pack identifier |
| `type` | `string` | Unique element type key, referenced by `PlacedObject.type` |
| `haDomains` | `string[]` | Home Assistant domains this type can bind to (base pack: `light`, `switch`, `fan`, `input_boolean`, `media_player`) |
| `footprint` | `{ width: number; height: number }` | Tile footprint |
| `sprites` | `Record<string, SpriteFrameRef>` | Maps a visual state key to a spritesheet frame |
| `stateMap` | declarative entity→state-key mapping | How an HA entity's `state`/attributes resolve to a `sprites` key (e.g. a lit lamp's halo tint from `rgb_color`/`brightness`) |
| `quickAction` | `QuickAction`, optional | Long-press action, e.g. `{ service: "light.toggle" }` |

**Validation (load-time, FR-009)**: if `quickAction.service`'s domain is in the forbidden set
(`lock`, `alarm_control_panel`, a `cover` with a garage/door/gate `device_class`, `valve`), the
whole pack MUST be rejected with a clear console message — regardless of what the manifest
declares. The device stays usable via tap only.

## QuickAction

| Field | Type | Notes |
|---|---|---|
| `service` | `string`, `"domain.service"` | Subject to the forbidden-domain check above |

## ConnectionState (runtime only, not persisted)

| Field | Type | Notes |
|---|---|---|
| `status` | `"connected" \| "reconnecting"` | Drives the stale-sprite visual (Clarification 2, FR-017) |

**Transitions**: `connected → reconnecting` on a detected drop; `reconnecting → connected` once
the underlying `home-assistant-js-websocket` connection reports `ready` again (see research.md
§5). There is no terminal "disconnected" state — the library retries indefinitely, matching a
24/7 kiosk's needs.

## SpriteState (runtime only, per rendered `PlacedObject`)

| Field | Type | Notes |
|---|---|---|
| `objectId` | `string` | FK → `PlacedObject.id` |
| `visualState` | `string` | Current `sprites` key from the object's `ElementPack` |
| `optimistic` | `boolean` | `true` between a user action and HA's confirmation (FR-006) |
| `stale` | `boolean` | Mirrors `ConnectionState.status !== "connected"` (FR-017) |
| `errorFlag` | `boolean` | Transient; set when an optimistic action's service call fails, cleared after the rollback indicator is shown |

**Transitions**:
- Tap/long-press on a quick-action device → `optimistic = true`, `visualState` flips immediately.
- HA confirms the real state → `optimistic = false`, `visualState` reconciled to the real value.
- The service call fails → `errorFlag = true` briefly, `visualState` rolls back to its
  pre-optimistic value.
- `ConnectionState` becomes `reconnecting` → every `SpriteState.stale = true`; back to
  `connected` → every `stale = false`.

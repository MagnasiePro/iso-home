# Contract: `custom:iso-home-card` (Lovelace Custom Card)

**Consumer**: Home Assistant's Lovelace dashboard, following the standard custom-card interface
HA expects from any card.

## Inbound

| Member | Type | Behavior |
|---|---|---|
| `hass` (property setter) | Home Assistant's `hass` object | On every assignment, diff watched entities against their last-known state and update the matching `SpriteState` (data-model.md) — this is the card's only state-update path |
| `setConfig(config)` | `{ homeModelPath?: string }` | Loads the `HomeModel` + referenced packs once at card creation |

## Outbound

| Event | Payload | When |
|---|---|---|
| `hass-more-info` (DOM CustomEvent, bubbling, composed) | `{ entityId: string }` | On a tap (FR-006), or on a long-press of a device with no `quickAction` (treated as a tap per FR-004) |
| Home Assistant service call (via `hass.callService`) | the pack's `quickAction.service`, target `entity_id` | On a long-press of a device that declares a `quickAction` (FR-005) |

## Connection-state behavior

The card does not open its own Home Assistant connection — `hass` updates arrive from HA's
frontend. "Connection lost" for the card's purposes (FR-017) means `hass` updates stop arriving
or HA's own connection object reports a lost/reconnecting WebSocket; the card mirrors that into
`ConnectionState.status` (data-model.md) to drive the stale-sprite visual.

## Bundling

Ships as a single ES module (research.md §6), installable through HACS as a custom repository,
staying under the 300KB gzip budget with packs excluded.

---

# Contract: Playground Modes (`apps/playground`)

Not a Home Assistant-facing contract — an internal dev/validation tool with two modes selected at
launch:

| Mode | Behavior |
|---|---|
| `mock` | Entities are simulated in memory, with on-screen debug toggles to flip any watched entity's state/attributes; no network connection |
| `live` | Opens a real `home-assistant-js-websocket` connection using a long-lived token read only from `.env.local` (never committed); tap opens a mini on/off + brightness panel instead of HA's native more-info popup; long-press calls the same `quickAction.service` the card would |

Both modes render through the same `packages/core/render` surface and share the same
`SpriteState`/`ConnectionState` model as the card, so behavior validated in `mock` mode
(Milestone 2) carries over directly to `live` mode (Milestone 3).

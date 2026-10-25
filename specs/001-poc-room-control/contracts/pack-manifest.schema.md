# Contract: Element Pack Manifest (`packs/*/manifest.json`)

**Source of truth**: a zod schema in `packages/core/model`, exported as JSON Schema the same way
as `HomeModel` (research.md §7). This is the contract a contributor follows to add a new element
type without touching core code (Principle IV).

**Consumers**: the pack loader in `packages/core/render`, which validates every manifest at load
time before it can be referenced by any `PlacedObject`.

**Shape** (see `data-model.md` for the full field table):

```jsonc
{
  "id": "floor-lamp",
  "type": "floor-lamp",
  "haDomains": ["light"],
  "footprint": { "width": 1, "height": 1 },
  "sprites": { "off": "floor-lamp-off.png", "on": "floor-lamp-on.png" },
  "stateMap": { "on": "on", "off": "off" },
  "quickAction": { "service": "light.toggle" }
}
```

**Enforced at load time (FR-009)**: `quickAction.service`'s domain MUST be on an allowlist
(`light`, `switch`, `fan`, `input_boolean`, `media_player`, `cover`) — not a denylist. A generic
or indirect service (`homeassistant.*`, `script.*`, `scene.*`, `automation.*`, ...) can act on any
entity regardless of its own domain, so it is rejected outright rather than enumerated as
individually "forbidden". A `cover` quick action additionally requires a known, safe
`device_class` (`curtain`, `blind`, `shade`, `shutter`, `awning`, `window`) — an unknown or
missing `device_class` is rejected (fail-closed), not allowed. When the bound entity is known, its
domain (from `entityId`) MUST also match the service's own domain. This check runs in core and
cannot be bypassed by a pack manifest, regardless of what it declares — see
`packages/core/model/src/quick-action.ts`.

**The "plant" example pack** (FR-011/SC-005) follows this same contract with no `haDomains`,
`stateMap`, or `quickAction` entry and no `entityId` ever set on the `PlacedObject` that uses it —
proving a purely decorative element needs nothing beyond the standard manifest shape.

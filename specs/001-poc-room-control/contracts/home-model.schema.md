# Contract: HomeModel JSON Schema

**Source of truth**: the zod schema in `packages/core/model`. The JSON Schema below is *generated*
from it via `zod-to-json-schema` (research.md §7) — never hand-maintained separately.

**Consumers**: contributors hand-writing a room's device list; the importer's merge step; the
`ha-card` and `playground` adapters that load a `HomeModel` at startup.

**Shape** (see `data-model.md` for full field tables):

```jsonc
{
  "version": "1",
  "rooms": [
    {
      "id": "living-room",
      "name": "Living room",
      "polygon": [{ "x": 0, "y": 0 }, { "x": 4.5, "y": 0 }, { "x": 4.5, "y": 3.5 }, { "x": 0, "y": 3.5 }],
      "openings": [{ "id": "door-1", "type": "door", "wallSegmentIndex": 0, "width": 0.9 }]
    }
  ],
  "objects": [
    {
      "id": "lamp-1",
      "type": "floor-lamp",
      "roomId": "living-room",
      "position": { "x": 4.0, "y": 0.5 },
      "rotation": 0,
      "entityId": "light.salon_lampadaire"
    }
  ]
}
```

**Enforced at load/merge time** (not just "nice to have"):
- Every `objects[].roomId` MUST match a `rooms[].id` — the merge step rejects the file otherwise
  (Clarification 1).
- `rooms[].id` MUST be the deterministic slug of `rooms[].name` when produced by the importer.
- `polygon` coordinates MUST already be snapped to the 0.5m grid (FR-001) — the importer
  guarantees this on its own output; a hand-written room polygon should follow the same
  convention for consistency, though this file format does not itself re-snap it.

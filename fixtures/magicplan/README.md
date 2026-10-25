# Magicplan fixtures

`sample-room.svg` is a **synthetic test fixture**, not a real Magicplan export — the user hasn't
supplied one yet (spec.md's Assumptions flag the real room name/export as still-to-come
configuration data). It exists so `packages/importer-magicplan`'s extraction logic has something
concrete to parse and unit-test against, using a convention documented in the file itself:

- 1 SVG unit = 1 cm, origin top-left, y increasing downward (standard SVG/floorplan convention).
- The wall outline is a `<polygon class="wall-outline">`.
- Openings are `<rect class="door">` / `<rect class="window">`, matched to the nearest wall edge
  by distance from the opening's center point to each polygon edge.

**This is not the format decision.** `docs/adr/0001-magicplan-source-format.md` records SVG as
the provisional default per `research.md` §1, explicitly pending the user's real SVG/DXF export —
re-open that ADR once real fixtures land here.

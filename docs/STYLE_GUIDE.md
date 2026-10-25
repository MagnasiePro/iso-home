# IsoHome style guide

Every asset MUST follow these rules (constitution, Principle II). An asset that breaks one is
refused, however good it looks.

| Rule | Value |
|---|---|
| Projection | 2:1 dimetric (isometric pixel-art), fixed camera looking from the north-west |
| Base tile | 64 × 32 px diamond = 1 m × 1 m of floor (`TILE_WIDTH` / `TILE_HEIGHT` in `packages/core/render/src/projection.ts`) |
| Light | From the top-left: highlights on top/left faces, shade on right/bottom faces |
| Outline | 1 px dark outline (`#3a2f26`) around every shape |
| Anti-aliasing | None. Hard pixel edges only; sprites are drawn with nearest-neighbor scaling |
| Palette | A locked palette shared with the Agent Office project (see below) |
| Anchor | Sprite base sits on the bottom vertex of its tile; the renderer anchors sprites bottom-center |
| Footprint | `footprint` in the manifest is in tiles; the sprite must not visibly overflow its footprint's floor diamond |
| States | One frame per state key listed in the manifest's `sprites` (e.g. `off`, `on`) |

## Palette

The shared Agent Office palette file has not been imported into this repo yet. Until it is, the
POC's scene uses these colors (see `packages/core/render/src/scene.ts`); new assets should stay
within this family and the palette file replaces this table once added:

| Use | Hex |
|---|---|
| Outline | `#3a2f26` |
| Floor | `#d8c9a8` |
| Wall | `#e8dcc2` |

The placeholder sprites in `packs/base` are generated flat-color blocks (32 × 48 px) and are
not final art.

## Tap target

Whatever the sprite size, the renderer enlarges the touch area to at least 44 × 44 px. Do not
pad the sprite itself to reach that size.

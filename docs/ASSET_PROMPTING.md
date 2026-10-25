# Prompting an AI for a pack asset

Use any image generator, then clean the result by hand. The style rules live in
[STYLE_GUIDE.md](STYLE_GUIDE.md); the generator output is only a draft until it passes the
checklist below.

## Prompt template

```
Isometric pixel art sprite of <OBJECT>, 2:1 dimetric view seen from the north-west,
single object on a transparent background, 1px dark outline (#3a2f26), flat colors,
no anti-aliasing, no dithering, no shadow on the ground, light from the top-left,
limited palette, game asset, centered, base resting on the bottom edge.
```

Generate one prompt per state, changing only the state part:

- `<OBJECT>` = `floor lamp, switched off` / `floor lamp, switched on, lit shade`
- Keep the camera and framing sentences identical across states so the frames line up.

## Cleanup

1. Downscale to the final size with nearest-neighbor (never bilinear).
2. Snap colors to the palette; remove any semi-transparent pixels.
3. Align every state frame on the same anchor (bottom-center) so toggling does not make the
   object jump.

## Validation checklist (copy into your pack PR)

- [ ] Projection is 2:1 dimetric, seen from the north-west
- [ ] Light comes from the top-left
- [ ] 1 px dark outline, no anti-aliasing, no semi-transparent pixels
- [ ] Colors are within the palette
- [ ] Sprite fits its footprint (`footprint` is in 1 m tiles)
- [ ] One frame for every key in `sprites`, same size, same anchor
- [ ] Manifest validates against `packages/core/model/schemas/pack-manifest.schema.json`
- [ ] If a `quickAction` is declared: its domain is `light`, `switch`, `fan`, `input_boolean`,
      `media_player` or `cover` (cover only with a safe device class). Anything else is dropped at
      load
- [ ] The object is still easy to hit with a finger (tap zone is enlarged to 44 px automatically)

## Pack layout

```
packs/<name>/<type>/
├── manifest.json        # see the pack manifest schema
└── <type>-<state>.png   # one file per state
```

Adding a folder is all it takes; no core code changes (see `packs/base/plant` for a decorative
element with no Home Assistant entity).

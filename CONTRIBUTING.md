# Contributing

## Proposing a new element pack

Open a "Propose a pack" issue first (template provided). Then:

1. Add `packs/<name>/<type>/manifest.json` and the sprite PNGs.
2. Follow [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) and tick the checklist in
   [docs/ASSET_PROMPTING.md](docs/ASSET_PROMPTING.md) in your PR description.
3. Do not touch `packages/core`: a new element type is data only.

## Working on the code

```sh
pnpm install
pnpm check                       # lint + typecheck + unit tests (also the pre-commit hook and CI)
pnpm --filter @iso-home/core-render test:e2e   # Playwright gesture/idle specs
pnpm --filter @iso-home/ha-card test:visual    # tablet pan/zoom reference screenshot
pnpm --filter @iso-home/ha-card check:size     # build + 300 KB gzip budget
```

- Biome handles lint and format (`pnpm lint:fix`).
- `packages/core` must never import Home Assistant; HA only appears in `packages/ha-card` and
  `apps/playground`.
- Never commit a Home Assistant token. The playground reads it from `apps/playground/.env.local`.

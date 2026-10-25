<!--
Sync Impact Report
Version change: [TEMPLATE] → 1.0.0 (initial ratification)
Modified principles: n/a (first adoption)
Added sections:
  - Core Principles I–IX (Representation Not Reproduction, Visual Consistency, Core Platform
    Agnosticism, Extensibility Through Data, Validated Data Contracts, Minimalism, Local Quality
    Gate First, Security, Tablet-First)
  - Technology Stack & Licensing
  - Project Memory & Workflow
  - Governance
Removed sections: none (template placeholders only)
Deferred items / TODOs: none
Templates requiring follow-up: none checked automatically by this command — dependent
  commands/templates read this constitution at runtime and are not modified here.
-->

# IsoHome Constitution

## Core Principles

### I. Representation, Not Reproduction
The house MUST be stylized, not architecturally reproduced. Readability and charm come before
dimensional accuracy. Any decision that trades visual charm for architectural fidelity MUST be
rejected.

### II. Visual Consistency
Every asset MUST comply with `docs/STYLE_GUIDE.md`: 2:1 dimetric projection, 64×32 base tile,
locked palette shared with the Agent Office project, light source from the top-left, 1px dark
outline, no anti-aliasing. An asset that violates the style guide MUST be refused, regardless of
its artistic quality.

### III. Core Platform Agnosticism
`packages/core` MUST NOT depend on Home Assistant or the HA DOM. Home Assistant is only an
adapter plugged into the core. This keeps the core reusable and testable in isolation and
insulates it from churn in HA's own APIs.

### IV. Extensibility Through Data
Adding a new element type MUST only require adding a pack folder (JSON manifest + spritesheet).
Core code MUST NOT be modified to support a new element type.

### V. Validated Data Contracts
The house model and pack manifests MUST be described as zod schemas, with JSON Schema generated
from them for contributors. This is the single source of truth for both runtime validation and
contributor-facing documentation.

### VI. Minimalism
The platform and existing libraries MUST be reused before writing new code (Ponytail stays
active). No abstraction MUST be introduced without a second real use case already in hand.

### VII. Local Quality Gate First (NON-NEGOTIABLE)
Lefthook hooks (lint, typecheck, tests) MUST block the commit on failure. GitHub Actions MUST
replay the same checks on every pull request (free on a public repository). CI is a safety net,
not the primary gate — the primary gate runs locally, before the commit exists.

### VIII. Security
No token MUST ever be committed to the repository. The playground reads credentials only from
`.env.local` (git-ignored). The HA card uses the existing HA session rather than its own
credentials. Sensitive devices MUST NOT be actuated without explicit confirmation.

### IX. Tablet-First (NON-NEGOTIABLE)
The reference device is an entry-level wall tablet powered on 24/7. Consequently:
- **On-demand rendering**: no permanent render loop. Redraw MUST happen only on HA state change,
  user interaction, or an in-progress animation, then return to idle.
- **100% touch**: no functionality MUST depend on hover. Tap targets MUST be at least 44×44px,
  enlarged beyond the sprite's own bounds if needed.
- **Resource budget**: the card bundle MUST stay under 300KB gzipped (packs excluded), one sprite
  atlas per pack, `devicePixelRatio` capped at 2, with automatic fallback WebGPU → WebGL → Canvas.
- **Sober animations**: animations MUST be precomputed or low-framerate, MUST be disableable, and
  MUST be suppressed under `prefers-reduced-motion`.

## Technology Stack & Licensing

**Stack**: TypeScript (strict mode), pnpm workspaces, Vite, PixiJS v8 (nearest-neighbor
rendering), Lit for the Lovelace card, `home-assistant-js-websocket` for the playground, zod,
Vitest, Playwright (visual tests and tablet CPU-throttled profiles), lefthook, Biome.

**Licensing**: Code is MIT. Assets are CC BY 4.0, with per-pack attribution declared in that
pack's manifest. These licenses apply to every contribution without exception, since the project
is public and open to outside asset packs.

## Project Memory & Workflow

- `CLAUDE.md` is the map of the repo: commands, conventions, and orientation for anyone (human or
  agent) working in it.
- `docs/ROADMAP.md` tracks what is done, in progress, and planned.
- `docs/adr/` holds architecture decision records for choices with lasting consequences (e.g. the
  Magicplan export format chosen for the importer).

`CLAUDE.md` and `docs/ROADMAP.md` MUST be updated at the end of every task — this is not optional
cleanup, it is how the project's memory stays trustworthy for the next session.

## Governance

This constitution supersedes any conflicting practice, template default, or prior habit. Every
pull request and review MUST verify compliance with these principles; Principle VII's local and
CI quality gates are the primary enforcement mechanism, but they check code health, not principle
compliance — reviewers remain responsible for the latter.

A deviation from any principle MUST be justified in an ADR under `docs/adr/` rather than silently
absorbed into the code.

**Amendment procedure**: propose the change, state the rationale, update this file, and bump the
version per the policy below. `Last Amended` is set to the date of the amendment; `Ratified`
never changes once set.

**Versioning policy** (semantic versioning applied to this document):
- **MAJOR**: backward-incompatible governance change, or removal/redefinition of a principle.
- **MINOR**: a new principle or section added, or materially expanded guidance.
- **PATCH**: wording, clarification, or typo fixes with no semantic change.

**Version**: 1.0.0 | **Ratified**: 2026-10-24 | **Last Amended**: 2026-10-24

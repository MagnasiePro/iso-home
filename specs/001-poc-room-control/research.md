# Phase 0 Research: POC – One Room, Touch-Controlled on a Tablet

No field in Technical Context was left as `NEEDS CLARIFICATION` — the constitution already fixes
the stack. What remained were implementation-approach decisions needed before Phase 1 design.

## 1. Magicplan source format (SVG vs. DXF)

**Decision**: Default to SVG as the importer's source of truth; confirm (or override) once real
fixtures are analyzed, and record the final call in `docs/adr/0001-magicplan-source-format.md` as
FR-015 requires.

**Rationale**: SVG exposes wall/door/window geometry as vector path/polygon commands that a
small, dependency-free parser can walk directly. DXF carries richer CAD metadata (layers, block
references) but needs a dedicated DXF parser and depends on layer-naming conventions that vary by
export settings — more moving parts for a POC that only needs an outline. No real export exists
in the repo yet to inspect, so this is a working default, not a final answer.

**Alternatives considered**: DXF-first (richer metadata, heavier dependency, format conventions
not yet verified against the user's actual Magicplan export).

## 2. Isometric depth sorting and "front walls hidden"

**Decision**: Standard painter's-algorithm depth sort keyed on each sprite's room-space
`x + y`, using PixiJS v8's `Container.sortableChildren` + `zIndex`. "Front walls hidden" is
simply: don't render the wall segments whose outward normal faces the camera's near side.

**Rationale**: This is the conventional dimetric-tile sort; the scene is static in structure (only
sprite *state* changes, not layout), so no per-frame z-buffer or sorting library is needed.

**Alternatives considered**: A true z-buffer (unnecessary for one flat room); resorting every
frame (wasted work — sort order only changes if an object moves rooms, which doesn't happen here).

## 3. Touch gesture handling

**Decision**: Hand-roll tap / long-press / pan / pinch / double-tap on raw Pointer Events
(`pointerdown`/`move`/`up`/`cancel`); no gesture library.

**Rationale**: The gesture set is small and has exact, spec-mandated thresholds (500ms + 10px
cancel for long-press, integer-step pinch zoom) that a generic library would need to be configured
or fought around anyway. Per Principle VI (Minimalism), a new dependency isn't justified for a few
hundred lines of well-tested pointer-event code, and it keeps `packages/ha-card`'s bundle lighter
against the 300KB budget.

**Alternatives considered**: Hammer.js (unmaintained, extra bundle weight), `@use-gesture`
(React-oriented, awkward standalone, still extra weight for a narrow need).

## 4. Renderer fallback (WebGPU → WebGL → Canvas) and DPR cap

**Decision**: Use PixiJS v8's own `Application.init({ preference: 'webgpu' })` path, which already
resolves WebGPU → WebGL; wrap initialization in a try/catch that falls back to PixiJS's Canvas
renderer backend if both GPU paths fail. Cap resolution with
`Math.min(window.devicePixelRatio, 2)` at `Application.init` time.

**Rationale**: PixiJS already implements this capability detection correctly; reimplementing it
would duplicate work and risk subtly different fallback behavior across devices.

**Alternatives considered**: Manual `navigator.gpu` / WebGL context-loss feature detection
(duplicate effort, PixiJS already does this).

## 5. Home Assistant connection state and reconnection

**Decision**: Use `home-assistant-js-websocket`'s built-in reconnect/backoff behavior, listening
to its connection lifecycle (ready / disconnected / reconnect-error) to drive the stale-sprite
visual state from Clarification 2 (FR-017), rather than writing custom reconnect logic.

**Rationale**: The library already implements exponential-backoff reconnection; re-implementing it
would violate Minimalism and add a new source of reconnection bugs.

**Alternatives considered**: A custom WebSocket wrapper (unneeded risk for behavior the library
already provides).

## 6. HACS-installable single-file card bundle

**Decision**: Build `packages/ha-card` with Vite in library mode producing one ES module, import
only the PixiJS v8 submodules actually used (it is tree-shakeable), and check gzip size in CI
against the 300KB budget.

**Rationale**: Vite library mode is the lowest-ceremony way to produce a single HACS-installable
file and matches the stack's existing bundler; no second build tool needed.

**Alternatives considered**: Raw Rollup config (redundant — Vite already wraps Rollup for library
builds); Webpack (a second bundler the stack doesn't otherwise use).

## 7. Zod → JSON Schema generation for contributors

**Decision**: Use `zod-to-json-schema` to generate the contributor-facing JSON Schema directly
from the same zod schemas that validate `HomeModel` and pack manifests at runtime.

**Rationale**: Single source of truth, which is exactly what Principle V requires; well-maintained,
widely used package; avoids hand-maintaining a second schema that can drift from the real one.

**Alternatives considered**: Hand-written JSON Schema (duplicate-source-of-truth risk).

## 8. Tablet-profile, CPU-throttled visual testing

**Decision**: Use Playwright's device/viewport emulation plus CDP-based CPU throttling (4x) and
`expect(page).toHaveScreenshot()` for the pan/zoom smoothness reference capture (SC-007).

**Rationale**: This is Playwright's documented mechanism for exactly this test shape, and the
stack already includes Playwright; no extra tooling needed.

**Alternatives considered**: Lighthouse/WebPageTest (not touch-gesture-aware, and don't produce
the pixel-level visual snapshot SC-007 calls for).

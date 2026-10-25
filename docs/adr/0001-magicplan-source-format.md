# ADR 0001: Magicplan source format for the importer

**Status**: Provisional — pending the user's real Magicplan export

**Date**: 2026-10-25

## Context

FR-015 requires picking one of the two Magicplan export formats (SVG or DXF) as the importer's
source of truth and recording why. The spec expected both formats to be supplied under
`fixtures/magicplan/` for comparison before this decision was made.

As of this ADR, no real Magicplan export of any format has been supplied. `fixtures/magicplan/`
contains only a synthetic SVG test fixture (see its README), invented to unblock building and
testing the extraction logic rather than to inform this decision.

## Decision

Default to **SVG** as the importer's source format, per `research.md` §1's reasoning: SVG
exposes wall/door/window geometry as vector path/polygon commands a small, dependency-free parser
can walk directly, while DXF carries richer CAD metadata (layers, block references) that needs a
dedicated parser and depends on export-setting-specific layer-naming conventions.

## Consequences

- The importer (`packages/importer-magicplan`) is built against SVG only for this POC.
- **This decision is not yet validated against a real export.** Once the user supplies their
  actual Magicplan SVG and DXF files, re-open this ADR: confirm SVG still extracts cleanly, or
  switch to DXF and update this record with the real rationale.
- If the real export's SVG structure differs materially from the synthetic fixture's
  (`class="wall-outline"`/`class="door"`/`class="window"` on simple shapes), the extractor in
  `packages/importer-magicplan/src/extract.ts` will need adjusting to match Magicplan's actual
  markup — this ADR's "SVG over DXF" conclusion is expected to hold either way, but the parsing
  details are provisional.

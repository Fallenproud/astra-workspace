# Brand Identity Packaging

## Purpose

Transforms an approved identity direction into a verified, vector-first, documented, frontend-ready brand operating package.

## Invoke when

- approved identity direction needs production packaging
- brand assets need vector QA and implementation handoff

## Do not invoke when

- identity direction is not approved
- request is only for one isolated image

## Inputs

- approved identity direction
- source assets
- brand constraints
- target surfaces

## Outputs

- verified asset package
- SVG/vector outputs
- design tokens
- usage guidance
- frontend handoff
- integrity report

## Method

1. Freeze the approved identity direction and source references.
2. Inventory required marks, lockups, icons, typography, tokens, light/dark variants, and product surfaces.
3. Reconstruct or vectorize only from approved evidence; do not silently redesign.
4. Verify SVG structure, viewBox, fills/strokes, text/lettering, and raster fallbacks.
5. Build token and placement maps for frontend use.
6. Package assets, indexes, usage guidance, provenance, and checksums.
7. Run package integrity and visual QA before claiming completion.

## Quality gates

- lettering and geometry are verified
- vector source is preferred where appropriate
- asset index matches package contents
- project-specific branding stays in supplied profile
- package integrity is verified before handoff

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

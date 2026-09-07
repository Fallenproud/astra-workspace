# Screenshot to Blueprint

## Purpose

Converts approved visual references into measurable layout, component, token, asset, and implementation blueprints before code generation.

## Invoke when

- screenshots or mockups must be translated into implementation structure

## Do not invoke when

- reference image is missing
- task only requests image generation

## Inputs

- screenshots or visual references
- viewport information if known
- project constraints

## Outputs

- layout map
- component inventory
- spacing/dimension notes
- token extraction
- asset map
- implementation prompt

## Method

1. Establish reference precedence and viewport assumptions.
2. Identify page regions and visual hierarchy before styling details.
3. Inventory visible components and repeated patterns.
4. Estimate dimensions/spacing only where the image supports them; label uncertainty.
5. Extract colors, type roles, radii, borders, shadows, and motion hints.
6. Map assets and distinguish supplied assets from inferred placeholders.
7. Produce responsive/topology recommendations separately from observed desktop geometry.
8. Output implementation order and validation checkpoints.

## Quality gates

- topology before cosmetics
- every visible component is accounted for
- uncertain measurements are labeled
- project identity is preserved
- no generic dashboard substitution

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

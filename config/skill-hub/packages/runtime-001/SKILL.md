# Registry Migration & Parity Auditor

## Purpose

Migrates legacy registry definitions into file-backed packages and blocks cutover when IDs, routing, contracts, policy, or runtime bindings drift.

## Invoke when

- Skill Hub registry is being migrated between storage authorities
- legacy database definitions need file packages

## Do not invoke when

- no source registry export is available

## Inputs

- legacy registry export
- compiled file registry
- adapter binding inventory

## Outputs

- generated packages
- parity report
- mismatch list
- cutover recommendation
- rollback metadata

## Method

1. Export the live registry without mutating it.
2. Preserve stable IDs and recorded routing/contracts.
3. Generate file packages with conservative status: definition does not imply execution.
4. Compile the new registry deterministically.
5. Compare IDs, slugs, categories, routing, contracts, policy flags, fallbacks, status, and bindings.
6. Run shadow routing comparisons where possible.
7. Recommend `files` cutover only when required parity gates pass.
8. Preserve `db` fallback until rollback confidence is established.

## Quality gates

- stable IDs preserved
- no false executable status
- mismatches are explicit
- cutover is reversible
- source registry remains untouched during migration

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

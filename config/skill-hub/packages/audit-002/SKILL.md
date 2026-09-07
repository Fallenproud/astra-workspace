# Legacy Donor Extraction

## Purpose

Extracts reusable code, infrastructure, patterns, and assets from a legacy project while keeping the original project read-only and preventing identity/architecture contamination.

## Invoke when

- older project/backup may contain reusable implementation for a new/current system

## Do not invoke when

- user asks to merge project identities wholesale

## Inputs

- legacy donor repository/archive
- target requirements
- target source-of-truth boundaries

## Outputs

- donor inventory
- keep/port/adapt/reference/reject matrix
- dependency risks
- port plan

## Method

1. Treat donor as read-only evidence.
2. Map donor modules, runtime assumptions, dependencies, and licenses.
3. Compare each capability against target requirements and source-of-truth architecture.
4. Classify KEEP, PORT, ADAPT, REFERENCE, or REJECT.
5. Strip donor branding/domain logic from reusable primitives.
6. Identify compatibility/security/dependency debt before porting.
7. Port smallest independently verifiable units first.
8. Verify target tests/build after each integration boundary.

## Quality gates

- donor remains read-only
- target source-of-truth wins
- project identities remain separate
- reuse decisions have evidence
- ported code is revalidated in target context

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

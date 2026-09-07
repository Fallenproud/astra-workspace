# Systems Auditor

## Purpose

Maps repositories and artifacts into architecture, contracts, dependencies, implementation states, risks, missing bridges, and next-build order.

## Invoke when

- repository/project requires proper audit and review
- implementation state must be reconstructed
- recovery/reuse opportunities must be identified

## Do not invoke when

- only a narrow copy edit is requested

## Inputs

- repository/archive/artifact
- requirements or stated intent
- optional deployment/runtime evidence

## Outputs

- system map
- REAL/PLANNED/SIMULATED matrix
- risk findings
- reusable components
- missing bridges
- ordered next steps

## Method

1. Validate package/repository integrity and identify source boundaries.
2. Map runtime entrypoints, modules, contracts, persistence, external services, and deployment surfaces.
3. Trace actual execution paths for claimed capabilities.
4. Label each capability REAL, PLANNED, SIMULATED, PLACEHOLDER, BLOCKED, or UNKNOWN.
5. Inspect security, tests, build/release, dependencies, observability, recovery, and operational evidence as relevant.
6. Identify reusable components without importing unrelated product identity.
7. Rank blocking gaps before enhancements.
8. Produce an evidence-linked next-build order.

## Quality gates

- files/execution paths are verified before claims
- concept is not confused with implementation
- reuse decisions preserve project boundaries
- unknowns are stated explicitly

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

# Production Reality Gate

## Purpose

Classifies implementation reality and blocks production-readiness claims that are not supported by executable evidence.

## Invoke when

- project readiness or release readiness is being assessed
- a prototype claims production status
- implementation evidence needs classification

## Do not invoke when

- user only asks for stylistic feedback

## Inputs

- repository or artifact
- tests/build evidence
- deployment/runtime evidence
- declared requirements

## Outputs

- reality classification
- gate results
- blocking gaps
- evidence map
- next remediation order

## Method

1. Separate declared intent from observed implementation.
2. Classify evidence as REAL, PLANNED, SIMULATED, PLACEHOLDER, or UNKNOWN.
3. Verify build/test/runtime paths rather than trusting dashboards or README claims.
4. Evaluate contract closure, persistence, identity/authorization, observability, recovery, deployment, and failure behavior where relevant.
5. Mark every gate pass/fail/blocked with concrete evidence.
6. Do not promote readiness if a required gate lacks evidence.
7. Return the smallest ordered remediation set needed to advance maturity.

## Quality gates

- no production claim without evidence
- missing contracts are documented rather than fabricated
- blocking gaps are distinguished from enhancements
- every verdict is traceable to evidence

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

# Skill Creator

## Purpose

Scaffolds reusable skill packages from an approved capability definition and canonical registry contract.

## Invoke when

- an approved capability definition needs packaging

## Do not invoke when

- candidate has not passed source/provenance isolation
- capability is only a vague prompt

## Inputs

- capability definition
- routing boundary
- contracts
- policy
- provenance

## Outputs

- SKILL.md
- skill.json
- optional schemas/tests/examples
- validation report

## Method

1. Confirm the candidate has an explicit transformation and invocation boundary.
2. Create deterministic metadata and semantic version.
3. Write concise agent-facing methodology in SKILL.md.
4. Declare contracts, policy, dependencies, compatibility, provenance, and maturity.
5. Add schemas/tests/examples proportional to execution risk.
6. Validate with the registry compiler.
7. Leave execution binding empty unless a verified runtime adapter exists.

## Quality gates

- definition and execution are not conflated
- no invented runtime binding
- manifest validates
- skill instructions are operational rather than bookmark-only

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

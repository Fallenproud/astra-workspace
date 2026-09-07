# Capability Conditioning Protocol

## Purpose

Checkpointed process for turning raw multimodal source material into governed, testable, runtime-improvable capabilities.

## Invoke when

- raw documents/prompts/code/assets should become a reusable skill
- a candidate requires governance before promotion

## Do not invoke when

- source provenance cannot be established

## Inputs

- source material
- provenance
- target runtime constraints

## Outputs

- comprehension map
- dependency map
- risk report
- draft skill package
- simulation/evaluation evidence
- promotion decision

## Method

1. Capture immutable source provenance.
2. Prove comprehension of the source before extracting capability.
3. Identify transformation, inputs, outputs, constraints, metrics, dependencies, and execution context.
4. Isolate project/domain-specific material into profiles or specimens.
5. Map risks, permissions, and external dependencies.
6. Draft contracts and failure behavior.
7. Simulate or test the capability against a canonical specimen.
8. Require explicit approval before promotion when governance policy demands it.
9. Preserve rejected/deferred candidates rather than deleting useful source evidence.

## Quality gates

- source-to-skill jump is never automatic
- project identity is isolated
- risk/dependency map exists
- promotion decision matches maturity evidence

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

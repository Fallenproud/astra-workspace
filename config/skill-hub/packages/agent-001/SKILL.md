# Agent Creation & Packaging

## Purpose

Creates a specialist agent package with responsibility, system contract, tools, permissions, memory policy, runtime expectations, evaluation, and provenance.

## Invoke when

- a specialist agent needs to be designed or normalized

## Do not invoke when

- request only needs a one-off prompt with no reusable agent lifecycle

## Inputs

- mission
- domain boundaries
- tools/runtimes
- memory requirements
- risk constraints

## Outputs

- agent manifest
- system contract
- tool permissions
- memory policy
- evaluation plan
- runtime/deployment notes

## Method

1. Define mission and responsibility before personality.
2. Separate model, agent, tool, skill, workflow, orchestrator, memory, policy, and evidence.
3. Declare allowed/denied capabilities and escalation boundaries.
4. Define memory read/write scope and retention rules.
5. Define runtime inputs/outputs, cancellation, retries, and observability.
6. Add evaluation scenarios for success, refusal, failure, and boundary cases.
7. Package with provenance and compatibility metadata.

## Quality gates

- identity changes responsibility not just tone
- permissions are explicit
- memory scope is explicit
- evaluation includes failure/boundary cases
- no hidden tool authority

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

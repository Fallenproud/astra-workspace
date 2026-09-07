# Multi-Agent Orchestration

## Purpose

Plans work, selects specialists, dispatches bounded parallel tasks, verifies artifacts, synthesizes outputs, and reroutes failures only when multi-agent separation adds value.

## Invoke when

- task benefits from separable specialist work, parallelism, isolation, or independent evaluation

## Do not invoke when

- single-agent execution is simpler and equally reliable

## Inputs

- goal
- constraints
- available skills/agents
- dependencies
- budget/concurrency limits

## Outputs

- execution plan
- dispatch graph
- artifact/evidence map
- synthesized result
- failure/retry record

## Method

1. Decompose only along independently verifiable boundaries.
2. Select the smallest adequate specialist set.
3. Build dependency graph and bound concurrency.
4. Give each worker explicit inputs, outputs, and authority.
5. Verify returned artifacts before marking tasks complete.
6. Retry only understood, bounded failures and preserve degraded states.
7. Synthesize without erasing disagreements/evidence.
8. End with explicit completion criteria and unresolved items.

## Quality gates

- parallelism has measurable reason
- dependencies are explicit
- artifacts are verified
- retry is bounded
- synthesis preserves evidence and disagreement

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

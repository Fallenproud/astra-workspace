# Human Approval Gate

## Purpose

Pauses sensitive actions, presents evidence and expected impact, and requires authorized human approval before execution.

## Invoke when

- policy marks an operation as sensitive or approval-required

## Do not invoke when

- operation is already explicitly denied by policy

## Inputs

- proposed action
- risk/evidence
- requesting identity
- scope/expiry

## Outputs

- approval request
- approved/denied/expired decision
- audit event

## Method

1. Freeze the proposed action parameters.
2. Present actor, target, expected effect, risk, and evidence.
3. Bind approval to action digest/scope and expiry.
4. Treat rejection or expiry as terminal unless a new request is created.
5. Revalidate action digest immediately before execution.
6. Emit attributable approval and execution events.

## Quality gates

- approval cannot be replayed onto changed action
- expiry/rejection are explicit
- requesting identity is attributable
- policy denial is not bypassed by approval

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

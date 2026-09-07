# Deployment-Ready Package Builder

## Purpose

Packages a verified project for a declared hosting target with environment templates, manifests, smoke checks, and rollback guidance.

## Invoke when

- project needs a deployable handoff for a specific hosting target

## Do not invoke when

- target platform or runtime requirements are unknown

## Inputs

- verified project
- target platform
- environment requirements
- domain/deployment constraints

## Outputs

- deployment bundle
- environment template
- runbook
- smoke checks
- rollback guidance

## Method

1. Verify the project builds/runs before packaging.
2. Identify target platform contract and unsupported features.
3. Produce environment template without secrets.
4. Add platform config/manifests and deterministic start/build commands.
5. Add health/smoke verification.
6. Document domain, persistence, background-job, and secret requirements.
7. Add rollback/redeploy steps and known limitations.

## Quality gates

- package is target-specific
- secrets are not embedded
- build/start commands are verified
- smoke checks exist
- rollback path is documented

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

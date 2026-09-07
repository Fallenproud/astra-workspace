# Evidence-Grounded Research

## Purpose

Produces source-backed research with freshness checks, source authority, fact/inference separation, citations, and explicit uncertainty.

## Invoke when

- decision-quality research or current external facts are required

## Do not invoke when

- task is purely creative or transformation of supplied text

## Inputs

- research question
- scope
- freshness requirements
- source constraints

## Outputs

- findings
- source map
- fact/inference separation
- uncertainties
- decision-relevant synthesis

## Method

1. Resolve the exact decision/question and time sensitivity.
2. Prefer primary/authoritative sources for load-bearing claims.
3. Check freshness for unstable facts.
4. Separate sourced facts from analysis/inference.
5. Record disagreements and missing evidence.
6. Cite claims close to the supported text.
7. Synthesize toward the requested decision rather than dumping links.

## Quality gates

- no invented percentages or citations
- fresh facts are actually checked
- facts and inference are distinguishable
- source quality matches claim importance

## Failure behavior

If required evidence, authority, runtime capability, or source material is missing, return the missing dependency or blocked state explicitly. Do not fabricate execution, verification, or source-of-truth evidence.

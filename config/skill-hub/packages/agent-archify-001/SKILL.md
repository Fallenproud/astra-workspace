---
name: archify-system-maps
description: Create trustworthy, validated technical system maps from repository evidence or bounded system descriptions using the Archify typed-IR workflow. Use for architecture, workflow, sequence, data-flow, lifecycle/state, architecture-delta, repository visualization, and verified technical communication artifacts.
license: MIT-derived integration guidance; Archify upstream is MIT licensed.
metadata:
  version: "0.1.0"
  upstream: "tt-a1i/archify"
  upstream_reviewed: "2026-09-03"
---

# Archify System Maps

## Purpose

Use this Skill when a user wants a technical system visualized as a trustworthy artifact rather than an unconstrained AI drawing.

The canonical execution model is:

**Evidence or bounded description → typed IR → deterministic validation → structured repair → verified artifact → receipt → atomic handoff.**

Archify is the preferred renderer/tool when available. The execution doctrine remains useful even when the Archify CLI is unavailable.

## Trigger conditions

Invoke when the user asks to:

- visualize a repository, codebase, service architecture, infrastructure, or system topology;
- create an architecture, workflow, sequence, data-flow, or lifecycle/state diagram;
- explain API/request paths, async flows, CI/CD, agent tool calls, ETL/ELT, data lineage, retries, waits, or terminal states;
- compare architecture before and after a change;
- turn Mermaid or a prose system description into a stronger technical communication artifact;
- create a reviewable or shareable system map grounded in source evidence.

Do not invoke merely because a task contains code. The user must need a system map, topology explanation, flow visualization, or architecture comparison.

## Core doctrine

### 1. Truth before spectacle

Never invent topology, runtime behavior, dependencies, ownership, risk, causality, blast radius, or breakage.

Distinguish clearly between:

- authored relationships;
- repository-verified evidence;
- deterministic validation evidence;
- browser/runtime evidence;
- human or image-based perceptual review.

Graph reachability is not automatically runtime impact.

### 2. Typed intermediary representation

Prefer a typed, schema-valid IR between model reasoning and rendering.

The agent proposes facts and structure. The deterministic renderer owns geometry, validation, serialization, and export behavior.

Do not let free-form generated HTML/SVG become the canonical source of truth when a typed IR is available.

### 3. Surgical repair

When validation fails:

1. Read the structured diagnostic.
2. Identify the exact rule and subject.
3. Inspect measured evidence.
4. Use only supported repair controls where available.
5. Modify the smallest affected portion.
6. Revalidate.

Do not regenerate the entire artifact merely because one local condition failed.

If repeated repairs do not improve the objective diagnostic count, stop and report the unresolved evidence instead of fabricating success.

### 4. Last-known-good preservation

A failed candidate must not replace a previously verified artifact.

Treat delivery as candidate promotion:

**candidate → validate → render/check → receipt → atomic promotion**

On failure, preserve the previous verified output and report the failing stage.

### 5. Receipts over claims

A successful handoff should report evidence, not vague confidence.

Where supported, record:

- diagram type;
- source/specification identity or digest;
- validation result;
- warnings/errors;
- artifact identity or digest;
- browser-evidence status;
- perceptual-review status;
- whether the artifact is canonical or a scoped reading/export variant.

Never claim visual inspection when no visual inspection occurred.

## Diagram router

Choose the narrowest matching form:

| Type | Use for |
|---|---|
| Architecture | components, services, infrastructure, storage, boundaries |
| Workflow | processes, approvals, agent/tool calls, CI/CD, runbooks |
| Sequence | request chains, API calls, cache fallback, async traces, returns |
| Data Flow | pipelines, lineage, ETL/ELT, PII movement, producers/consumers |
| Lifecycle | states, retries, waits, cancellation, success/failure terminals |
| Architecture Delta | validated Before / Delta / After architecture review |

If ambiguous, select the representation that communicates the user's primary question with the fewest invented semantics.

## Repository-grounded mode

When the map must represent a real repository:

1. Inspect repository evidence before asserting system facts.
2. Preserve exact product names, symbols, paths, protocols, environment names, and API identifiers.
3. Keep evidence scoped to the revision inspected whenever possible.
4. Separate verified source evidence from inferred architectural interpretation.
5. Prefer 8–12 high-value components for a high-level architecture unless the user explicitly requests a dense map.
6. Make the primary path readable before adding secondary edges.

Do not treat filenames alone as proof of runtime relationships.

## Architecture Delta mode

For change review:

1. Establish validated base and head snapshots.
2. Compare exact authored identities.
3. Report added, removed, changed, moved, and rerouted facts when available.
4. Do not infer risk, merge safety, runtime impact, or breakage from visual delta alone.
5. If deeper impact analysis is requested, route that to independent code/static/runtime analysis and keep its evidence separate from the map.

## Archify tool path

When the Archify package/CLI is available, use the installed upstream capability rather than recreating its renderer.

Canonical upstream repository:

`https://github.com/tt-a1i/archify`

Upstream installation pattern documented at review time:

`npx skills add tt-a1i/archify -g`

Upstream supports Cursor, Codex, Claude Code, and OpenCode skill workflows and produces self-contained HTML/SVG artifacts from typed JSON IR.

Follow the installed upstream `SKILL.md`, schemas, examples, validators, and CLI as the source of truth for exact current commands and fields. Do not freeze old CLI/schema details into this wrapper when the installed upstream package can be inspected directly.

## Fallback execution model

If Archify itself is unavailable, preserve the method:

1. Gather bounded evidence.
2. Define a typed or explicitly structured intermediate model.
3. Validate semantic completeness before rendering.
4. Render deterministically where possible.
5. Run structural checks.
6. Collect browser evidence separately if needed.
7. Perform perceptual review separately if available.
8. Promote only the passing artifact.
9. Return a receipt and unresolved limitations.

The fallback is not permission to fabricate Archify validation receipts or claim Archify compatibility.

## Interaction semantics

Interactive views may expose focus, route, upstream/downstream reach, semantic comparison, or guided stories only from authored/verified relationships.

Temporary viewer state must remain distinct from canonical artifact truth.

Scoped exports such as route/reach cards must identify themselves as scoped views rather than silently replacing the canonical map.

## Output contract

Return, as applicable:

1. diagram type;
2. concise system interpretation;
3. artifact or source path/reference;
4. validation status;
5. receipt/evidence summary;
6. browser evidence status;
7. perceptual review status;
8. unresolved facts or diagnostics;
9. smallest safe next step if the artifact is not fully accepted.

## Boundaries

This Skill is not:

- a generic WYSIWYG graph editor;
- a substitute for static analysis or runtime tracing;
- a proof of blast radius or dependency impact;
- permission to infer infrastructure that is not evidenced;
- a reason to rebuild a user's existing visualization stack when they only asked for review;
- a fork of Archify's implementation.

## Provenance

This reusable integration Skill was derived from a review of `tt-a1i/archify` on 2026-09-03. Archify identifies itself as MIT licensed and credits `Cocoon-AI/architecture-diagram-generator` as an upstream basis. Preserve upstream notices and license provenance when distributing Archify code or packaged assets.

The reusable execution pattern retained here is intentionally domain-neutral:

**LLM proposes → typed IR → deterministic validation → structured diagnostics → surgical repair → verified artifact → receipt → atomic promotion → last-known-good preservation.**

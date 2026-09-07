# Evidence-Locked Vertical Build

## Purpose

Build complex software systems through evidence-backed vertical slices instead of broad speculative implementation.

This Skill converts large product goals into a disciplined coding-agent workflow that prioritizes environment reality, canonical contracts, executable runtime evidence, local repair, and production truth.

The core rule is:

> Never expand horizontally while the current vertical slice is not executable.

## Invoke when

Use this Skill when:

- a coding agent is asked to build or extend a non-trivial full-stack product;
- the request contains several interdependent subsystems, runtimes, tools, data stores, integrations, or UI workspaces;
- a long-horizon implementation risks producing many disconnected modules before the core runtime works;
- the environment may constrain or conflict with requested technologies;
- production-readiness claims must be tied to actual executable evidence;
- the user explicitly wants autonomous implementation without repeated approval between safe phases.

## Do not invoke when

Do not invoke for:

- isolated copy edits;
- small one-file bug fixes;
- purely visual mockups where runtime truth is irrelevant;
- research-only tasks;
- architecture review where no implementation is requested.

## Canonical execution loop

The governing loop is:

**OBSERVE → CONSTRAIN → DECIDE → IMPLEMENT → VERIFY → FREEZE or REPAIR**

### OBSERVE

Inspect what actually exists before planning implementation details.

Establish:

- repository state;
- runtime and package manager;
- installed dependencies;
- available Skills and Tools;
- external services;
- credentials/configuration state;
- deployment constraints;
- existing tests and validation commands.

Do not infer capability from filenames, package names, or prior intent alone.

### CONSTRAIN

Extract the user's non-negotiable contract into four sets:

- **GOAL** — what must exist when done;
- **MUST** — technologies, behaviors, integrations, UX, runtime, or data requirements that are canonical;
- **MUST NOT** — mocks, substitutions, architectural contamination, forbidden design choices, unsafe behavior, or other explicit exclusions;
- **DONE WHEN** — observable acceptance criteria.

Preserve explicit user canonicals. Do not silently weaken or substitute them.

### DECIDE

For the current vertical slice, choose the smallest architecture decision that can satisfy the requirement correctly.

Record meaningful decisions as compact decision receipts:

- requirement;
- environment evidence;
- alternatives considered;
- selected approach;
- risk;
- mitigation;
- unresolved dependency, if any.

Avoid extended speculative design discussion once the decision can be made from available evidence.

### IMPLEMENT

Implement only enough to complete the current vertical slice and its supporting contracts.

Do not build many disconnected future modules merely because they appear in the total product scope.

### VERIFY

Run the smallest meaningful validation first, then broader validation as the slice matures.

Verification may include:

- runtime execution;
- tests;
- typecheck;
- lint;
- build;
- browser interaction;
- API calls;
- database reads/writes;
- trace evidence;
- integration health;
- visual inspection where appropriate.

Claims must match evidence. Do not call a feature working because its UI renders.

### FREEZE or REPAIR

If the slice passes its acceptance gate:

- freeze shared contracts that downstream work depends on;
- record the verified state;
- proceed to the next slice.

If it fails:

- diagnose the smallest failing subject;
- repair locally;
- re-run the relevant validation;
- do not rebuild unrelated working areas.

If repeated local repair does not improve objective evidence, surface the blocker instead of fabricating progress.

## Phase 1 — Intent Lock

Before architecture or implementation, extract:

### GOAL

A concise statement of the finished outcome.

### MUST

All explicit canonical requirements.

### MUST NOT

All explicit prohibitions and non-negotiable boundaries.

### DONE WHEN

Concrete, observable acceptance conditions.

Do not turn preferences into requirements unless the user made them canonical.

## Phase 2 — Environment Reality Pass

Inspect the actual execution environment before resolving architecture.

Produce a capability matrix such as:

| Requirement | Environment state | Evidence | Decision |
|---|---|---|---|
| Agent runtime | available / missing / partial | package, tool, service | use / install / block |
| Database | available / missing / partial | driver/runtime | use / adapt / block |
| External service | configured / offline | health/config | execute / isolate |

The matrix should distinguish:

- **verified available**;
- **available but unconfigured**;
- **missing but installable**;
- **blocked external dependency**;
- **unsupported**.

## Phase 3 — Gap Resolution

For every mismatch between user canonicals and environment reality:

1. Preserve the requested canonical.
2. Attempt the direct supported path.
3. Install or configure the required dependency when authorized and feasible.
4. If impossible, surface the dependency gap explicitly.
5. Only introduce an alternate adapter when it is clearly labeled as an alternate and does not falsely satisfy the canonical requirement.

### No silent substitution rule

Never replace a named required technology with a different implementation and claim the original requirement is satisfied.

Examples:

- a generic LLM loop is not automatically the OpenAI Agents SDK;
- JSON persistence is not SQL;
- simulated progress is not real streaming;
- a static graph is not an executable workflow;
- a UI card is not an implemented Tool.

## Phase 4 — Canonical Contracts

Define only the shared contracts necessary for multiple subsystems.

Typical contracts include:

- Agent definition;
- Tool definition;
- Skill definition;
- Workflow definition;
- Runtime event / trace event;
- Run record;
- Artifact record;
- Data/schema contract;
- approval/policy event.

Prefer typed, serializable contracts.

Do not predesign every future module.

Freeze a contract only after the first executable vertical slice proves it is adequate or after an explicit compatibility requirement demands stability.

## Phase 5 — Runtime Spine

Build the smallest real execution path through the system before advanced workspaces.

A generic runtime spine is:

**User input → primary runtime → execution unit → Tool/runtime action → streamed events → result → persisted trace**

The exact components depend on the product, but the principle is invariant.

Until the runtime spine executes successfully, defer secondary authoring surfaces that depend on it.

## Phase 6 — First Real Vertical Slice

Choose one representative user outcome that crosses the most important layers with the least unnecessary breadth.

A valid vertical slice should normally prove several of these together:

- UI input;
- real runtime execution;
- Tool invocation;
- data persistence;
- streaming/status;
- trace persistence;
- output/artifact creation;
- error handling;
- approval where required.

The slice must be demonstrably real.

Do not use mocks to cross an unimplemented layer and then call the slice complete.

## Phase 7 — Event-Driven Contextual UI

After runtime events are real, let UI surfaces react to them.

Examples:

- SQL Tool activity → open Database workspace;
- approval required → open Approval panel;
- workflow run started → open Execution view;
- artifact created → expose Files/Artifacts workspace;
- trace error → expose Trace inspector.

Prefer semantic runtime events over brittle client-side intent heuristics.

This allows the UI to remain contextual rather than permanently exposing every capability.

## Phase 8 — Executable Workflow IR

When the product needs workflows, define a canonical executable workflow representation.

The graph is not merely a picture.

It should encode real execution semantics such as:

- nodes;
- ports;
- edges;
- conditions;
- branches;
- retries;
- waits;
- approvals;
- Tool calls;
- Agent calls;
- outputs.

The runtime executor and visualizer should derive from the same canonical workflow definition.

## Phase 9 — Visualization Layer

Render canonical topology from the workflow/system IR.

Temporary runtime state may overlay the topology through:

- active node state;
- edge traversal signals;
- Tool-call status;
- handoffs;
- progress;
- failures;
- completion.

Do not mutate canonical topology merely to represent transient execution state.

When Archify or another validated system-map capability is available, use it according to its own Skill/runtime contract rather than recreating a weaker renderer.

## Phase 10 — Replay From Evidence

Replay should be derived from persisted runtime events, not separately authored animation logic.

Canonical pattern:

**Workflow/System IR + TraceEvent[] + replay clock → runtime overlay**

Reuse the same topology used for live execution whenever possible.

Replay must preserve event order and timing semantics available in the trace.

## Phase 11 — Capability Expansion

Only after the runtime spine and first vertical slice pass should the product expand into broader capability surfaces such as:

- persistent AI staff/agent management;
- reusable Skills;
- reusable Tools;
- external connectors;
- advanced data/schema tooling;
- rich workflow authoring;
- observability dashboards;
- search/indexing;
- secondary runtimes such as media generation.

Each new capability should plug into existing contracts rather than create a parallel execution model.

## Phase 12 — Specialized Quality Passes

Do not burden the principal implementation loop with every specialized concern at once.

After functional vertical slices exist, run focused passes for:

- UX topology;
- brand identity;
- visual hierarchy;
- motion;
- responsive behavior;
- accessibility;
- security;
- performance;
- runtime reliability;
- code quality;
- deployment readiness.

Use specialized Skills/Tools when available.

## Production Reality Gate

Before declaring completion, classify every requested major capability as one of:

- **verified executable**;
- **implemented but unverified**;
- **configured but externally blocked**;
- **not implemented**.

A feature is not verified executable merely because:

- its component renders;
- its route exists;
- its schema validates;
- its button is clickable;
- its placeholder service returns success;
- an adjacent test passes.

Completion claims require evidence proportional to the feature.

## Parallelism policy

Parallelize only after shared contracts are stable enough to avoid incompatible implementations.

Safe parallel candidates include:

- independent quality passes;
- isolated UI modules against frozen interfaces;
- independent tests;
- separate external adapters;
- documentation derived from verified contracts.

Avoid parallelizing tightly coupled foundational modules before their interfaces are proven.

## Autonomous continuation policy

When the user requests autonomous execution:

- continue sequentially across safe phases without repeatedly asking for approval;
- stop only for genuine external/manual dependencies, destructive actions requiring approval, ambiguous irreversible choices, or safety boundaries;
- if one scoped task is blocked, continue other work that remains inside the declared GOAL and does not depend on the blocker;
- preserve blocked evidence and return to it when dependencies become available.

## Decision discipline

Prefer compact decision receipts over long speculative internal debate.

A useful decision receipt is:

**Decision**: <choice>

**Requirement**: <canonical requirement>

**Evidence**: <environment/repository evidence>

**Alternatives**: <brief alternatives considered>

**Reason**: <why selected>

**Risk**: <main risk>

**Mitigation**: <control>

Do not manufacture evidence to justify an already preferred implementation.

## Failure behavior

When a phase fails:

1. preserve last-known-good behavior;
2. identify the exact failing contract, component, integration, or assertion;
3. gather direct evidence;
4. repair only the affected area where possible;
5. revalidate the narrow failure;
6. then rerun the broader gate if needed.

Do not restart the entire implementation because a local condition failed.

## Output contract

During or after execution, provide as appropriate:

- current vertical slice;
- verified completed slices;
- frozen contracts;
- decisions made;
- evidence/validation results;
- unresolved dependencies;
- blocked work that was safely bypassed;
- next smallest executable slice;
- production reality classification.

## Canonical mental model

**USER GOAL**
→ **Intent Lock**
→ **Environment Reality**
→ **Capability / Gap Matrix**
→ **Canonical Contracts**
→ **Runtime Spine**
→ **First Real Vertical Slice**
→ **Event-Driven Contextual UI**
→ **Executable Workflow IR**
→ **Visualization + Live Runtime Overlay**
→ **Replay From Evidence**
→ **Capability Expansion**
→ **Specialized Quality Passes**
→ **Production Reality Gate**

The reusable principle is:

> Build depth before breadth. Freeze only what runtime evidence has earned. Expand only from verified foundations.

## Provenance

This Skill was canonicalized from an audit of a long-horizon full-stack coding-agent planning workflow on 2026-09-03. The source workflow contained strong architecture reasoning around runtime events, executable workflows, SQL, agent loops, replay, approvals, Skills/Tools, contextual workspaces, and staged implementation, but also exposed failure modes including silent technology substitution, premature infrastructure, premature branding, overplanning, and early parallelization.

The Skill preserves the useful workflow while removing those failure modes. It is domain-neutral and does not inherit any project-specific product name, stack, branding, or architecture.

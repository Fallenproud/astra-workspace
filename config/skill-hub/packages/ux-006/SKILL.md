# Toptier Topology

## Purpose

Design the structural topology of a web interface before implementation sprawls. Determine the right hierarchy for routes, page regions, components, state, interactions, responsive transformations, and reusable primitives so the resulting frontend is coherent, efficient, and maintainable.

## Invoke when

Use this skill when:

- planning a new web application or major frontend surface;
- restructuring an existing frontend;
- translating screenshots or product requirements into implementation architecture;
- deciding component boundaries and placements;
- defining page/route topology;
- deciding where state should live;
- defining desktop-to-mobile structural transformations;
- scaffolding a design-system-aware application.

## Do not invoke when

Do not use this skill for:

- one isolated visual tweak;
- copy-only changes;
- backend-only tasks;
- a narrow bug fix whose solution does not affect interface structure.

## Evidence classes

Keep architectural claims separated:

- **Observed** — visible in supplied code, screenshots, or references.
- **Required** — explicitly requested by the user/specification.
- **Recommended** — topology decision produced by this skill.
- **Optional** — enhancement that is not necessary to satisfy the requirement.

Never convert a visual guess into an implementation requirement without labeling it as a recommendation.

## Method

### 1. Establish intent and constraints

Identify users, primary actions, route boundaries, framework constraints, design-system constraints, data dependencies, responsiveness requirements, and explicit non-goals.

### 2. Select page topology

Choose the simplest topology that satisfies the workflow, for example:

- single-pane;
- master-detail;
- two-pane chat/preview;
- three-pane IDE;
- dashboard/grid;
- canvas/workspace;
- wizard/onboarding;
- document/detail surface.

Do not select a layout because it is fashionable. Tie it to interaction needs.

### 3. Define hierarchy

Map:

`application -> route -> layout -> feature -> section -> component -> primitive`

Avoid both extremes: monolithic page components and premature abstraction of every small visual element.

### 4. Assign component ownership

A component belongs at the narrowest reusable boundary that owns its behavior. Promote it only when reuse is real or the domain boundary demands it.

Prefer domain/feature components over generic wrappers with unclear semantics.

### 5. Assign state ownership

Classify state as:

- local UI state;
- feature state;
- route/navigation state;
- server state;
- cross-application/global state.

Keep state as close as practical to the behavior it controls. Do not place local interaction state into global stores merely for convenience.

### 6. Define responsive transformations

Do not merely shrink desktop geometry. Specify structural transformations, for example:

- three panes -> tabbed single-pane;
- sidebar -> drawer/sheet;
- dense toolbar -> compact toolbar + overflow;
- grid -> stacked cards;
- secondary inspector -> modal/drawer;
- persistent navigation -> bottom or compact navigation where appropriate.

Preserve task state while changing responsive presentation.

### 7. Define loading, empty, error, disabled, and success states

A topology is incomplete if it only defines the ideal populated state.

### 8. Check interaction density

Prioritize primary actions. Remove duplicate controls that represent the same conceptual action in multiple places unless there is a clear contextual reason.

### 9. Check design-system fit

Prefer existing tokens, primitives, spacing scales, typography, and interaction patterns before introducing new ones. New patterns require a concrete gap.

### 10. Produce implementation order

Scaffold in dependency order:

1. routes and shell;
2. design tokens/primitives;
3. structural layouts;
4. domain components;
5. state/data bindings;
6. responsive transformations;
7. error/loading/empty states;
8. accessibility and interaction tests;
9. visual/performance refinement.

## Output contract

Return only sections justified by the requested scope. Potential sections are:

- Topology Assessment
- Route/Page Map
- Layout Regions
- Component Tree
- State Ownership
- Interaction Map
- Responsive Transformations
- Reusable Components
- Anti-patterns Found
- Scaffold Recommendation
- Implementation Order
- Quality Gates

## Quality gates

Before approving a topology, verify:

- clear information hierarchy;
- coherent route boundaries;
- explicit component ownership;
- minimal unnecessary coupling;
- appropriate state locality;
- responsive transformations are structural, not only scaled;
- loading/error/empty states exist where relevant;
- keyboard/accessibility impact is considered;
- design tokens and primitives are reused appropriately;
- repeated structures are abstracted only when justified;
- visible controls map to real behavior or an explicit unavailable state;
- implementation order respects dependencies.

## Failure behavior

If supplied references do not define enough behavior to make a structural claim, state the missing contract and keep the recommendation clearly labeled instead of inventing canonical behavior.

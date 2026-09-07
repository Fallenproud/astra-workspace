# Composer and landing polish verification

## Canonical interpretation
The supplied document is preserved verbatim in docs/WORKSPACE-COMPOSER-CANONICAL.source.md. Its adaptive workspace behavior is implemented under Astra's identity; it does not become an instruction to rename the product or replace host authority controls.

## Visual comparison
- Supplied overflow screenshot: footer text escapes the left panel and the entire application scrolls. Latest workspace-contained.png: footer bottom 667px inside panel bottom 684px at 1534×696; no outer scroll. Six viewport sizes pass the same bounds assertions.
- Header position: automatic conversation following now scrolls the conversation container, not scrollIntoView on the page. Runtime controls remain in their owned grid row.
- Navigation: all eight entries remain visible at tested heights of 600px and above. Smaller windows scroll the navigation region while retaining the footer.
- Landing spacing: removed the negative capability-card overlap; 56px preview/card separation, 20px card gaps, 28px card padding, 110px desktop narrative spacing, 44px trust-strip padding and 86px closing CTA padding. Mobile uses reduced spacing.
- Identity: tagline, folded mark, graphite/obsidian palette and green accents retained. Effects are landing-only; operational chrome remains calm.
- Motion: Three.js orbital geometry and particles, GSAP section entrances, silver card sheen. Full-page capture: landing-cinematic.png. The large renderer chunk is dynamically imported only for ambient motion; reduced-motion users allocate no canvas. Pixel ratio capped at 1.5, render loop capped at 30fps, hidden/offscreen loops paused, geometry/materials/renderer disposed on cleanup. Static orbital artwork remains as fallback.
- Controls: explicit ambient pause/resume; no fake media player, fabricated performance metric or model connection added.

## Functional evidence
13 runtime tests passed. Canonical browser flow passed with project context, simulator approval/artifact, composed views and explicit layout promotion, reusable workflow, legacy/direct routes, themes, and mobile checks. polish-qa.mjs verified actual WebGL state `playing`, canvas disposal on pause, at most one canvas on resume, no canvas in reduced motion and six viewport bounds. No browser page errors.

The host currently registers five read-only workspace primitives. Unsupported editors, privileged terminals, arbitrary UI and deployment authority are not fabricated. Runtime-side composition is exposed to Responses/compatible agents; Codex retains the existing protocol and host-side automatic layout selection.

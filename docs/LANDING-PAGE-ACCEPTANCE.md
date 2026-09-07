# Landing page acceptance — 2026-09-07

Status: local landing frontend checks passed. This is not a hosted production launch or registration rollout.

## Verified
- Production Vite build passes. Existing lazy Three.js chunk size warning remains (734 kB uncompressed / 189 kB gzip); no measured Core Web Vitals certification is claimed.
- Eight preview tabs switch locally, with semantic buttons and keyboard activation.
- Demo task, example attachment, run sequence, cancellation, artifact, skill/connection state, workflow, and reasoning controls use isolated React state. No real files, credentials, or workspace APIs are used.
- Automated task interaction recorded zero API requests. Demo navigation preserves the landing URL.
- Canonical fixture and sequence: `src/landing-demo-script.js`. The artifact is explicitly an example, independent of user input; state resets on reload.
- Ambient pause control removed. Old localStorage pause preferences no longer disable motion. OS reduced-motion and offscreen rendering optimizations remain.
- Closing headline types with green/cyan emphasis; complete static accessible copy is preserved.
- Responsive containment checked at 1440, 1087, 768, 390, and 320 pixels.
- Browser checks reported no page errors. Basic H1/description and local links checked; preview buttons do not redirect.
- Production dependency audit: zero known vulnerabilities at verification time.
- Screenshots reviewed at desktop and mobile sizes.

## Scope and deferred release decisions
- Canonical App, runtime adapters, API/server code, authentication, and stored workspace data were not changed.
- Public workspace CTAs retain their existing local destinations. Registration enforcement and the commercial offer remain deferred by request; this demo does not establish a signup gate.
- Early-access form remains a local preview, not a hosted signup or mailing-list service.
- Hosted domain/TLS, real-device performance, cross-browser validation, social sharing metadata, and a full accessibility audit remain release checks. Reduced-motion support and keyboard checks are not a WCAG conformance claim; continuous rotating content needs review in that audit.

Current frontend regression entry point: `node scripts/landing-final-qa.mjs`. Earlier polish scripts containing removed pause-control or old static-preview expectations describe historical UI and are superseded for landing acceptance.

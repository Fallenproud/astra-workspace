# Canonical acceptance — v1.2 implementation

The canonical source is a product specification. This checklist distinguishes the delivered local product from future expansion. It does not claim every future roadmap capability is available.

| Requirement | Implementation and evidence |
|---|---|
| Supplied identity precedence | v1.2 source and four untouched references preserved; v1.0 ZIP archived with SHA-256 provenance. |
| Green folded A and logo family | Reconstructed SVG mark, horizontal dark/light lockups, green/white/black, PNG 16–1024, Windows ICO, macOS ICNS and PWA icons. Original v1.2 vector master was not supplied. |
| Obsidian, graphite, green; polished glass controls | canonical.css, extracted explicit palette, shared page/workspace styling, subtle orbital SVG, silver hover and outlined product actions. |
| Typography | Local Geist 400/500/600, IBM Plex Mono for data, JetBrains Mono for code; font licenses bundled. |
| Dark and light mode | Persistent theme control on public and application surfaces. Browser captures verify both. |
| Real routes and page structure | /, /early-access, /signup, /workspace and seven module paths. Legacy hashes migrate; browser history works. |
| Landing and early access | Native HTML controls, workspace preview links, capabilities, workflow narrative, truthful trust strip, FAQ, local form persistence/removal. |
| Workspace shell | Runtime bar, eight-item hamburger navigation, main workspace, composer, contextual inspector. Home inspector and tabs default hidden, independently shown. Mobile inspector is a dismissible sheet. |
| Composer | Task type affects submitted prompt; files and project context enter execution; templates insert editable tasks; Advanced opens compute/tool settings; model and reasoning remain runtime controls; draft survives reload. |
| Persistent project context | Goal and decision notes persist in SQLite and enter the next run; each run stores a context snapshot. Project inspection shows related run/file/artifact/workflow counts. |
| Runs and artifacts | Real local lifecycle, duration/model/status/error/approval records, artifact inspection/download, audit and workspace exports. No simulated result is labeled AI-generated. |
| Skills | Pinned native compiled Skill Hub catalog with integrity, compatibility, inspect/enable/disable/invoke; only the qualified Archify binding executes. External inventories are not trusted installations. |
| Workflows | Persistent reusable templates and sequential delegated agent runs, separate conversation scopes, bounded handoff, human approval, stop/cancel/failure semantics, Archify visualization. |
| Execution architecture | Astra control plane owns state; independent Responses/compatible-provider/Codex app-server adapters. Codex version stays pinned. |
| Development secret boundary | Server rejects real provider credentials and external execution; separate development data and sanitized process environment. |
| Responsive and keyboard | Desktop 1672×941, mobile 390×844, no horizontal page overflow; visible focus, labeled controls, modal focus trap/Escape, reduced-motion handling. |
| Validation | 12 runtime tests passed; canonical browser checks exercised local signup persistence/removal, navigation, panel toggles, project-context save, approved artifact, artifact inspection, reusable template reload, themes and mobile widths. |

## Explicit limits and future layers

Live provider calls were not made with real credentials. Codex app-server handshake is verified; writable Windows coding sandbox setup remains a separate host requirement. Arbitrary binary/PDF/image attachment processing, generic DAG conditions/parallelism, team accounts, collaboration, OAuth connectors, hosted signup/waitlist delivery, deployment endpoints, marketplace, and visual workflow editing remain future layers. The Mermaid bridge supports acyclic flowcharts, not every Mermaid diagram grammar. PWA icons/manifest provide app metadata; offline runtime is not claimed. This local service is not an enterprise SaaS deployment.

Commands: node --test test/*.test.mjs; node node_modules/vite/bin/vite.js build; node scripts/canonical-qa.mjs. Browser test data is isolated from the user's workspace. Detailed captures are in ../../design/canonical.

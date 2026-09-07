# Glass restyle verification — 2026-09-06

Direction: `glass-concept.png`. Render: `glass-desktop-verified.png`, captured from the running in-app browser at 1600 × 1000. Mobile: `glass-mobile-verified.png`, 390 × 844. Concept and desktop render were opened with `view_image` in the same verification pass. Viewport override was reset afterward.

| Check | Evidence and result |
| --- | --- |
| Palette | Neutral black/charcoal surfaces replace navy; final computed root background is rgb(9,9,9). Emerald remains an accent. Removed the inherited outer green/navy shadow. |
| Borders | Separate rounded header, sidebar and main frame; softened inner borders, rounded 11–22px corners. |
| Buttons | Transparent button surfaces with silver hover borders and subtle glass highlights. Primary actions use an emerald outline rather than a filled green background. |
| Home visibility | Fresh Home has no inspector element. Show panel and Show tabs independently reveal their surfaces. Show requests explicitly reveals the applicable run approval. |
| Navigation | Desktop hamburger hides and restores the sidebar. New project/conversation preserves desktop navigation. Mobile uses the same hamburger as a drawer. Native icons now distinguish Home, Skills and Workflows. |
| Assets and motion | Existing Astra PNG branding preserved. New deterministic `public/astra-glass-overlay.svg` supplies restrained silver/green arcs; CSS animates the overlay and respects reduced motion. |
| Responsive behavior | 390px browser viewport: document width 375px including the browser's vertical-scrollbar allocation; no horizontal document overflow. Header controls scroll within their own row. |
| Runtime copy | Development banner explicitly identifies simulated generation and no keys/network model calls. Native Archify rendering is separately identified as real local execution. |

Copy comparison and intentional deviations: preserve the established Astra logo, working provider/model/reasoning/backend controls, project title, recent history and composer actions rather than the concept's invented avatar and welcome copy. The final live screenshot shows the user's current conversation, so its content differs from the empty-state concept. The concept is a visual direction, not a claim of pixel-identical reconstruction. Transparent surfaces sit on a neutral black page for readable contrast; the page itself is not fully transparent.

Browser paths verified: development entry → project creation → task → Show requests → approval → persisted artifact; Skills → canonical metadata → Enable → Invoke → actual Archify HTML and receipt; Workflows → create agent → delegate task → open child approval → completed workflow. Reload retained saved work and reset optional Home panels to hidden.

Backend evidence: eleven automated tests pass. A branching Mermaid example independently passed all 9 Archify showcase checks, 0 errors, 0 warnings. The browser showed the embedded Archify viewer and its diagram nodes. The receipt does not claim full native Archify browser/perceptual certification at every upstream target viewport.

Temporary QA server stopped. Automatic policy review rejected deletion of its isolated files under the top-level `work/` folder, so those files remain; no production or user data was removed.

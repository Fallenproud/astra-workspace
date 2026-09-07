# Frontend handoff

Site.jsx composes public pages. App.jsx owns workspace state. routes.js resolves canonical paths and legacy hashes. canonical.css applies v1.2 over preserved base modules. ThemeControl persists the selected theme. Fonts are bundled locally, with licenses in 05-TYPOGRAPHY.

Use node scripts/npm.mjs install for this Windows environment, then node scripts/development.mjs. Build with node node_modules/vite/bin/vite.js build. Browser checks: node scripts/canonical-qa.mjs. Runtime checks: node --test test/*.test.mjs.

The early-access form deliberately stores a removable local interest record; it creates no hosted account and sends no email. Public preview controls are links to the actual workspace, not fake model selectors.

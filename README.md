## Workspace Composer Canonical and landing polish

The supplied adaptive workspace contract is preserved in docs/WORKSPACE-COMPOSER-CANONICAL.source.md, with Astra implementation boundaries in docs/WORKSPACE-COMPOSER-CANONICAL.md. Registered read-only views adapt to task intent and artifact creation; Responses/compatible agents can compose them through a validated tool. Layout templates require explicit user promotion.

The landing page now uses dynamically loaded Three.js and GSAP. Pause/reduced-motion/visibility controls retain a static fallback. Sidebar containment is verified at six viewport sizes; design/polish/FIDELITY-AND-VERIFICATION.md records the changes and captures. The earlier v1.2 ZIP remains an unchanged historical delivery; these later source refinements supersede its spacing screenshots.

## Canonical v1.2 delivery

Open http://127.0.0.1:4317/ for the landing page, /early-access for the removable local interest form, and /workspace for the operational application. Direct module routes and legacy hashes work. No hosted signup, email delivery or team identity is implied.

The active identity comes from the supplied v1.2 breakdown and four references. The older v1.0 ZIP is preserved, unchanged, in astra-brand-pack/00-START-HERE/legacy. Start the design handoff at astra-brand-pack/00-START-HERE/README.md; acceptance and fidelity notes are in 14-HANDOFF. The folded A is a documented vector reconstruction from raster references.

New functionality: project goals and decisions with immutable run context snapshots; reusable workflow templates; contextual project/artifact/skill/workflow inspectors; persisted composer drafts; bundled fonts and a light/dark theme. Development still rejects real credentials and runs only the local simulator.

# Astra Workspace

A local AI workspace and multi-model control plane, built from the supplied Astra reference. React + Vite frontend, Node/Express API, SQLite persistence.

## Start

Requires Node 22.13 or later. Tested with Node 26.7.0 on Windows.

```powershell
.\Start-Astra.ps1
```

Or, from this directory:

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:4317. Development mode is the default: choose **Open workspace**, then **Open development workspace**. No password or API key is needed or accepted. Create a project and run a task to exercise the real approvals, artifact storage, history and continuation lifecycle with the clearly labeled, network-free simulator. Use test content only.

Development uses `.data-development/` and rejects provider/connector mutations and Codex execution at the server boundary. Its local access credential is a public fixed fixture, not a secret. No model output or token usage is fabricated as real.

For later live use, explicitly run `npm run start:production`, which uses the separate `.data/` directory. Only production presents passphrase and provider-key forms. Do not use real credentials during development. Data directories cannot be shared across modes.

The Windows launcher includes a project-local npm wrapper to tolerate the host's malformed PATH. It does not change system PATH.

## Working features

- Persistent projects, conversations, messages, run records, uploaded text/code files, artifacts and approvals.
- AES-256-GCM credential encryption with a passphrase-derived scrypt key. Keys are decrypted server-side; public API responses never include them.
- Direct OpenAI Responses API, compatible Chat Completions providers (including local Ollama), and a separately implemented Codex app-server adapter.
- Reasoning selection, context and output limits, tool-round and wall-clock limits, token usage, optional token-cost estimates and a monthly token guard.
- Approved artifact creation, Responses web search, approved isolated-browser actions, and anonymous public HTTPS MCP servers with approval required.
- Mid-run Codex questions with answer forms and redacted secret answers in audit records.
- Reusable agent instructions, execution timeline, per-run audit export, workspace data export, responsive navigation and compact recent transcript.
- A small Node SDK in `sdk/client.mjs`.

## Execution backends

**Responses API:** connects directly to the provider's `/responses` endpoint. The server supplies explicit conversation history with `store:false`, executes allowed function tools, records their outputs, and continues the request. It does not fabricate responses. Each completed provider response is persisted; this version does not stream Responses text tokens.

**Compatible providers:** use the Chat Completions protocol and a user-selected model ID. Function tools depend on that model/provider supporting tool calling. Reasoning and web search are not forwarded to this adapter because compatible providers do not share a portable contract for them.

**Codex local:** pinned `@openai/codex@0.107.0`, JSON-RPC over stdio. Uses initialize/initialized, thread/start or thread/resume, turn/start, streamed item events, approval responses and turn/interrupt. OpenAI credentials enter the child process through a named provider's environment key, not a persisted login file. Codex state is isolated under `.data/codex`. It does not use the desktop app's private account tokens or modify its settings.

The generated schema confirms `untrusted`, `workspace-write` and reasoning through `xhigh`. **This Windows host returned a readOnly sandbox in the real thread-start probe.** Astra records the effective sandbox and does not silently enable unrestricted execution. Writable coding execution needs compatible Codex Windows sandbox setup and live verification. The protocol probe is not evidence of a successful model run.

Codex owns its own tool loop and token generation: Astra's output-token/tool-round limits apply to Responses/compatible runs; the wall-clock cap applies to all backends. Monthly token guards are admission checks using recorded consumption and conservative reservations, not a provider billing ceiling.

## Browser and MCP

Browser actions run in a new headless Chromium context, with no user's browser cookies or profile. Open, read, click and fill require a visible approval decision. Network requests are checked for public destinations; loopback/private addresses and non-HTTP schemes are rejected. This is a local convenience boundary, not an OS-enforced egress firewall: use network isolation before deploying for untrusted tenants. A configured `ASTRA_CHROMIUM_PATH` takes priority; an installed Windows Playwright Chromium is reused if the matching bundled executable is absent. On another machine use `npx playwright install chromium`.

MCP connections currently support anonymous remote HTTPS endpoints through the Responses API. Add a server, then explicitly enable it. OAuth, remote connector credentials, Codex MCP configuration management and arbitrary computer desktop control are extension work, not claimed as working integrations.

## Persistence and recovery

Data is under `.data/` by default. Set `ASTRA_DATA_DIR` to an absolute path for a different disk. Back up the entire data directory **with the server stopped** to include the database, artifacts, project directories and Codex histories. Restore it in place and use the same passphrase. The passphrase cannot be recovered.

After restart, unfinished runs become **interrupted**, and pending approvals expire. Review the saved timeline and continue in the conversation explicitly. External side effects are not automatically replayed. All prior messages are kept; the UI initially shows the latest eight.

The JSON workspace export excludes credentials and includes project metadata, messages, runs, events, approval records, uploaded text files, agent instructions and settings. Artifact binaries and Codex histories require the full data-directory backup.

## Security and deployment boundary

Single user, loopback only. HTTP sessions use HttpOnly, SameSite=Strict cookies with a 12-hour lifetime. Origin and Host checks reject cross-origin browser access. The server uses a restrictive CSP, avoids rendering model text as HTML, and limits request sizes. Locking the workspace cancels active runs and clears vault keys from session memory. Provider credentials are encrypted; conversation and project content are stored as local plaintext.

Do not expose this server publicly. Team collaboration, organization RBAC/SSO, hosted deployment, separate tenant stores, hardened browser egress, secret-manager integration, backup scheduling and service-account authentication remain future layers. No fake collaboration, marketplace, deployment or billing controls are presented.

## SDK example

```js
import { AstraClient } from './sdk/client.mjs';
const astra = new AstraClient();
await astra.unlock(process.env.ASTRA_PASSPHRASE);
const state = await astra.state();
const run = await astra.run({
  projectId: state.projects[0].id,
  providerId: state.providers[0].id,
  prompt: 'Summarize the supplied project context.'
});
console.log(run.id);
```

Approvals remain explicit: inspect state.approvals, review the action, and call `astra.approve(id, true/false)` only after a human decision.

## Validation

```sh
npm test
npm run build
```

Eleven automated acceptance tests pass: credential encryption/persistence; authenticated API and approved artifact lifecycle; restart recovery; browser destination restrictions; actual pinned Codex protocol initialization/thread start; compatible-provider tool continuation; durable Codex question/answer handling with secret redaction; unsupported-request rejection; provider outcome and context-limit enforcement; development credential rejection, network-free artifact lifecycle and mode isolation; native skill integrity/qualification, Archify delivery, registry failure recovery, delegated workflow handoff/cancellation and persistence. Incomplete responses retain partial text but cannot execute truncated tool calls or report success. Context checks include instructions and tool definitions before sending a request.

Browser/IAB validation used a separate deterministic fixture (`test/ui-fixture.mjs`) to verify login, project creation, task submission, approval, completed artifacts, usage, reload persistence and history. It does not demonstrate live model output. Desktop reference dimensions (1672 × 941) and mobile (390 × 844) were inspected; no mobile document overflow was observed.

The actual isolated-browser backend was also smoke-tested against https://example.com: page title, text and controls were returned successfully.

**Live provider verification is deferred by user instruction.** Development acceptance uses test data and simulated generation; credentials are not required to continue product development. Live-provider and writable Codex validation will be handled separately after development.

See `design/FIDELITY.md` for the visual comparison and `ARCHITECTURE.md` for boundaries.

## Primary references

- [Codex app-server](https://learn.chatgpt.com/docs/app-server)
- [Responses tools](https://developers.openai.com/api/docs/guides/tools)
- [OpenAI model IDs](https://developers.openai.com/api/docs/models)

Wire enum compatibility is based on the schema generated from the installed pinned CLI, not solely the current documentation.

## Navigation and glass styling

Home hides the inspector panels and tabs until **Show panel**, **Show tabs**, or **Show requests** is clicked. The desktop/mobile hamburger controls navigation. Routes use browser history; expired sessions reopen development entry or production unlock. Styling uses neutral black, transparent surfaces, silver hover borders, emerald accents, and the local animated SVG overlay with reduced-motion support.

## Skill Hub and Archify

Astra reads the compiled native registry from **Fallenproud/skill-hub-registry**. The bundled revision and hash are in config/skill-hub/source.json and index.json. The Skills UI can refresh from a revision-pinned public fetch; all native packages are hash-verified before the cached catalog is atomically replaced. Failed refresh preserves the previous catalog. No credential or GitHub token is used, no remote repository is mutated, and external candidate inventories are excluded.

Inspect SKILL.md and metadata, resolve compatibility, then explicitly Enable/Disable/Invoke. Activation is tied to the exact content hash. The qualified local binding is **Archify System Maps**; other native skills are inspectable but blocked until their dependencies and runtime bindings are qualified. The local profiles/astra directory contains the consumer profile and proposed upstream files; it has not been pushed to Skill Hub.

Archify is vendored unchanged at the pinned revision documented in vendor/ARCHIFY-PROVENANCE.md, with MIT notices preserved. The Mermaid adapter supports acyclic flowcharts with 2–12 nodes, decisions and labeled arrows. Cycles, unsupported syntax and failed layout checks return errors rather than losing topology. The actual upstream deliver command validates and writes self-contained HTML, with specification/artifact digests and a receipt. Browser and perceptual review are separate evidence, never inferred from that receipt. Diagram previews use a sandboxed iframe with no same-origin privilege or network access. Saved diagrams remain available under Skills after reload.

## Agent delegation and workflow execution

Workflows creates 1–8 explicit sequential steps, each assigned to an existing reusable agent and its own run/conversation scope. Astra delegates through its existing engine, passes the prior text and artifact references as bounded context, records child-run relationships, and stops on failure or cancellation. Each child's tool approvals remain explicit. Restart marks unfinished workflows interrupted; work is not automatically replayed. Development exercises this real orchestration using simulated generation. Production uses the selected provider/backend without widening agent permissions. Visualize workflow calls the same actual Archify renderer.

The SDK exposes skills, activation, invocation, workflow and cancellation methods. Workspace export includes workflow records, diagram specifications/receipts, registry identity, activations and skill invocation audit. Full HTML artifacts still require the complete data-directory backup.

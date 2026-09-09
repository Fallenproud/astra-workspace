# G2 preflight — FAIL

2026-09-08. G0 PASS; G1 PASS; G2 FAIL. G3 not started.

The G1 harness verifies fresh disposable Sandboxie execution. It is not wired
into the actual `CodexClient`, which currently spawns host Node directly. Running
that path would violate G2's required isolation chain, so it was not launched.
The actual Engine.start admission path was exercised with an isolated development
store and rejected Codex as required by the existing development-mode policy.
No production credentials were accessed or enabled.

Additionally, Engine.execute currently marks completion after the backend returns;
the required independent G2 receipt gate is not wired into that lifecycle.

## Work completed

- Created `D:\AstraRuntimeCanary\g2-f16c4f6d\project` with README.md and exact
  `src/value.txt` contents `ASTRA_G2_BEFORE` (no added newline).
- Recorded baseline Git revision `9a3e40964a843dfeac352229c045e6ac12492bd5` and hashes.
- Added `server/g2-verification.mjs`: independent filesystem snapshot comparison,
  exact target content, changed-file checks, and rejection of symlink entries.
- Added seven automated tests covering exact success, wrong content/trailing newline,
  unexpected changed/untracked files, missing target, unchanged target/model-text
  rejection, and unexpected deletion. Unit fixtures are separate from the G2 fixture.
- Negative verification against `ASTRA_G2_EXPECTED` returned `verification_failed`.
- Complete suite passed: 13 existing + 7 new = 20 passing, zero failing/skipped.

## Not verified

No Codex thread/turn started. No G2 sandbox was created, no backend mutation occurred,
and no runtime boundary or G2 cleanup lifecycle was exercised. The fixture remains
unchanged and its diff is empty. Fresh-sandbox lifecycle and cleanup-after-success/
failure coverage for an integrated G2 runtime remains outstanding. G1 evidence must
not be substituted for those G2 requirements.

## Evidence

Local files under `work/runtime-readiness/`:

- `g2-f16c4f6d/receipt.json`: exact admission failure, source fingerprint and unchanged fixture.
- `g2-f16c4f6d/baseline.json`: revision and file hashes.
- `g2-f16c4f6d/diff.patch`: empty diff, not a successful mutation.
- `g2-f16c4f6d/negative-verification.json`: independent negative result.
- `g2-full-tests.txt`: full 20-test result.

## Smallest safe next step

Wire a fail-closed Sandboxie transport into the actual Codex adapter and add the
independent receipt gate to Astra's completion path, preserving approvals and
cancellation. Then use an explicitly configured production provider connection
through an approved network path; keep development credentials prohibited. Rerun
G2 in a fresh sandbox. Sandbox reuse remains unsupported/unverified. Do not start G3.

# G1: Sandboxie Plus Windows canary

Historical installation/first-canary report. The initial stderr artifact was not
a genuine stderr capture, and its PASS claim is superseded by the stricter rerun
and exit-code correction in [G1-EXIT-CODE-VERIFICATION.md](G1-EXIT-CODE-VERIFICATION.md).

Verified on 2026-09-08. **G1 PASS. G2 not run.**

This is a host installation and isolated writable execution canary. It does not
claim that Astra's RuntimeAdapter, writable Codex integration, or game execution
has been implemented. G0 previously passed its build and all 13 tests.

## Installation

- Official stable distribution: https://sandboxie-plus.com/downloads/
- Installer: https://github.com/sandboxie-plus/Sandboxie/releases/download/v1.18.2/Sandboxie-Plus-x64-v1.18.2.exe
- SHA-256: `1c19832c8bb84f5dcde1bf59b7f38b7cfe94989c09dd0acd0b7ce7485dde8987`
- Hash matches the official GitHub release asset digest; Authenticode status Valid.
- Installation: `C:\Program Files\Sandboxie-Plus`
- Plus UI version: 1.18.2; core/CLI version: 5.73.2.
- Installer exit code 0, no restart requested.
- `SbieSvc` and `SbieDrv` running after installation and after canary cleanup.
- `Start.exe`, `SbieIni.exe`, `SbieDll.dll`, service, driver and utility versions/hashes recorded.

## Successful canary

Run `g1-f0a68f331703`, box `AstraG1_f0a68f331703`.
Harness: `scripts/sandboxie-g1.ps1` (PowerShell 7, Windows x64, D: test storage).
The harness makes a new uniquely named sandbox; it never reuses a user sandbox.

| G1 requirement | Actual evidence |
| --- | --- |
| Read existing file | Fixed canary required exact original `console.log(41);` before modifying it |
| Modify file | Independent host verifier read `console.log(42);` from the physical sandbox overlay |
| Create file | Independent verifier read `ASTRA_CREATED_IN_SANDBOX` from `created.txt` in the overlay |
| Trivial build/check | Sandboxed `findstr.exe` checked the modified source, exit 0; output persisted |
| Verify outside process | Unsandboxed harness verified overlay files, original source, missing host-side created file, and sentinel hash |
| Reset/destroy | Box processes terminated, zero PIDs reported, content deleted, named profile removed |
| Protect host path | Write to closed sentinel path denied; host hash identical before execution and after cleanup |

The canary also confirmed `SbieDll.dll` was loaded. Normal writes were redirected;
no direct host-write exception or unrestricted-host fallback was configured.
Administrator rights were dropped, network devices blocked, and API credential
environment variables were not forwarded. No real API keys or model calls were used.

The official installation automatically populated compatibility templates.
Their definitions were recorded. The Astra-only profile closed the templates'
IPC and named-pipe exceptions; global settings were preserved during the final
canary. This is not a general network penetration test or proof against every
filesystem escape: those broader runtime boundaries remain future acceptance work.

## Retained evidence

Local evidence is under `work/runtime-readiness/` in the publishing checkout:

- `installation/download.json`: provenance, digest and signature.
- `installation/setup.log`, `install-result.json`, `probe.json`: actual install and components.
- `g1-f0a68f331703/receipt.json`: successful independent checks, commands, exit codes and evidence hashes.
- Same run directory: source, child result, stdout/stderr files, profile, template definitions and configuration snapshots.
- `g1-d158098052cc/receipt.json`: initial failed collector attempt; actual sandbox operations passed but empty global-section recording failed.
- `g1-ca21a74ccb9b/receipt.json`: preflight rejected inherited compatibility templates before execution; `cleanup-followup.json` records later removal of that unused Astra profile.

Failed attempts are preserved, not relabeled as successful. All Astra test sandbox
profiles and box contents are now removed. Harmless input/protected fixtures under
`D:\AstraRuntimeCanary` and evidence remain available for inspection.

## Scope boundary

No unrelated user sandbox was modified or reused. No Astra UI, database, execution
lifecycle, approval gate or model backend was changed. G2-G7 were not attempted.
The next gate requires actual Codex execution through Astra plus independent diff
and protected-file verification; this canary alone does not prove that capability.

CLI behavior follows the official [Start documentation](https://sandboxie-plus.github.io/sandboxie-docs/Content/StartCommandLine/)
and [SbieIni documentation](https://sandboxie-plus.github.io/sandboxie-docs/Content/SbieIniCommandLine/).

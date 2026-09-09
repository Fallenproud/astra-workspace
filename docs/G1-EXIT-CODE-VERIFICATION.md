# G1 exit-code correction and verification

2026-09-08: **G0 PASS (unchanged baseline), G1 PASS. G2 not started.**

## Root cause and actual execution chain

The old Windows PowerShell `Start-Process -Wait -PassThru` path returned an object
whose `ExitCode` was null. The canary compared that to zero and then replaced the
failure with its generic code 23. The regression probe reproduced the null value
for `cmd.exe /d /c exit 0` in `g1-1d20435d0d4c/exit0.result.json`.

There is no integrated RuntimeAdapter in Astra's server yet. The verified chain is:

```text
Astra G1 harness (unsandboxed controller/verifier)
  -> Sandboxie Start.exe /box:<dedicated box> /wait
    -> sandboxed PowerShell wrapper
      -> actual command process
```

`scripts/astra-child-process.ps1` starts the child with `System.Diagnostics.Process`,
acquires its handle before waiting, reads stdout/stderr through separate pipes,
and records the exact `ExitCode`. `scripts/sandboxie-command-wrapper.ps1` writes a
correlated structured result inside the sandbox and exits with the child code for
normal exits. The host reads the physical overlay independently. Launcher success
alone cannot pass a test. No output-text parsing determines an exit code.

Timeout/cancellation are explicit states. Their wrapper codes (124/130) remain
separate from the child termination code. Missing executable is `launch_failed`,
with null child PID/code and wrapper code 125. These sentinel codes never replace
a valid child code in the child/Astra-recorded fields.

## Deterministic integration matrix

Each case uses a new disposable sandbox with the same `astra-code-canary` policy.
Run with PowerShell 7:

```powershell
pwsh -NoProfile -File scripts/sandboxie-g1.ps1 -Mode exit-tests -ExitCase exit0
# Repeat for exit1, exit23, missing, timeout, cancelled.
```

| Case | Launcher / shell | Child / Astra recorded | Explicit result | Evidence run |
| --- | --- | --- | --- | --- |
| exit 0 | 0 / 0 | 0 / 0 | exited | g1-1d20435d0d4c |
| exit 1 | 1 / 1 | 1 / 1 | exited | g1-b7d4f8116f4d |
| exit 23 | 23 / 23 | 23 / 23 | exited | g1-6f057dc2572a |
| nonexistent executable | 125 / 125 | null / null | launch_failed | g1-54d93b60f219 |
| timeout | 124 / 124 | 1 / 1 | timeout | g1-7b705e9a4bb8 |
| cancellation token | 130 / 130 | 1 / 1 | cancelled | g1-38e147243fb6 |

Every receipt retains command, profile/box, launcher/shell/child PIDs where
available, timestamps, actual stdout/stderr, all exit-code fields, normalized
result and termination reason. Timeout and cancellation stop the child tree;
box-wide cleanup independently confirms zero remaining sandbox processes.

## Full G1 rerun

Run `g1-1278c326e910`, sandbox `AstraG1_1278c326e910`:

- Sandboxie Plus 1.18.2, core 5.73.2, `C:\Program Files\Sandboxie-Plus`.
- SbieSvc and SbieDrv Running.
- Existing input read, changed 41 to 42 in the overlay, new file created.
- Fixed `findstr` check executed through sandboxed cmd; launcher/shell/child/Astra codes all 0.
- Actual stdout `console.log(42);`; actual stderr `ASTRA_STDERR_CAPTURE_CANARY`.
- Prohibited write attempted and denied; original input and protected host file unchanged.
- Protected SHA-256 before and after: `6206c29f4c06a0bba6feb9356f830be488b87a3e7cf680d64191642f25f93bf9`.
- Evidence copied and hashed before sandbox content/profile destruction.
- Processes stopped, zero PIDs, sandbox content and profile removed.

No reinstall, no policy weakening, no unrestricted-host command fallback, and no
unrelated sandbox changes occurred. The G1 sequence and acceptance checks remain
the same; only child execution/capture and explicit result evidence were corrected.

## Failure evidence and remaining limitation

The first shared-box matrix passed exit 0 and 1, then its exit-23 launch timed out
without a structured child result. The user reported SBIE2206, SBIE2326, SBIE2309,
and SBIE2312 registry/startup errors. Their exact underlying cause is not proven.
Fresh disposable boxes passed all six cases. This does **not** establish reliable
repeated launch in one reused box, nor fix that separate Sandboxie issue.

`work/runtime-readiness/g1-e3cf80178738/` retains the failed receipt, user-reported
messages, registry hive evidence, and cleanup follow-up. The affected Astra box
was removed after evidence preservation. Earlier failures also remain intact.

All evidence paths above are under the publishing checkout's local
`work/runtime-readiness/` directory. `exit-matrix-summary.json` indexes the six
tests; `G1-summary.json` points to the current full receipt. G2 readiness means
the next gate may be attempted explicitly, not that writable Codex integration
or the remaining runtime plane has already been verified.

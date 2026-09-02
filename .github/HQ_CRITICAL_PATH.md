---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 18
updated_at: 2026-09-02T06:14:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.6.0-control-center
basis_sha: 126cf29d6aed336ca3c241c84aeb893bc88ec075
---

# HQ Critical Path

## 1. Current Release Contract

Release target: **ChatPulse 0.6.0 beta**.

Explicit owner scope: per-chat continuation/time limits, per-chat profiles, Control Center, expanded Telegram operational events, safe configuration export/import, and guarded “run until completion” mode.

RELEASED requires a canonical non-draft PR merged with exact-head guard, green five-cycle branch + merge-tree + post-merge `main` audits, deterministic package/security gates on all three refs, and identical final 0.6.0 product/source hashes.

Explicit exclusions: multiple stop phrases/regex, cloud sync/backend/accounts, Telegram token export, unrelated Draft PR #17.

## 2. Current Implementation

Canonical branch: `release/0.6.0-control-center`.
Released base beneath HQ state-only commits: 0.5.5 product SHA `bf4ee1aaf0802ff852f12392ed46aa6c8bec4e67`.

Implemented product surface:
- schema v4 per-chat profiles with inherited/custom command, interval and stop phrase;
- continuation/runtime limits and per-chat due scheduling;
- guarded task mode with progress/completion state;
- Control Center profile editor/status/progress UI;
- expanded privacy-safe Telegram operational events;
- configuration-only JSON export/import;
- 0.6.0 Manifest/package/reproducible release workflow;
- README/CHANGELOG/PRIVACY/SECURITY updates;
- legacy 0.5.4/0.5.5 safety tests remain mandatory.

## 3. Adversarial Findings and Repairs

Closed:
- runtime merge could resurrect stale state after manual/profile control — repaired with `controlRevision` ownership and runtime auto-stop handling;
- task start reset the global session/baseline instead of only the selected chat — repaired and regression-tested;
- `recordDispatch()` was only in memory until end-of-check, allowing a crash/network step to lose at-most-once evidence — repaired with a durable storage checkpoint before Telegram;
- profile/control edit during an already-started send could lose the actual dispatch fingerprint/count — repaired so fresh profile/control state wins while the same run still counts the real send; a genuinely newer run keeps a fresh counter but inherits the late dispatch fingerprint for duplicate protection.

Active exact one-shot repair:
- task start must not enable ordinary global monitoring or wake unrelated ordinary chats when global monitoring is off;
- STOP_MONITORING must pause ordinary monitoring while allowing explicitly active task runs to continue;
- task-aware alarm/loop/send authorization and Control Center status are being patched fail-closed.
- helper run: `33597809130`; trigger head `126cf29d6aed336ca3c241c84aeb893bc88ec075`; last observed queued. Helper removes itself after exact patch/commit.

Remaining hardening identified before final candidate:
1. portable import must reject duplicate normalized chat URLs; otherwise two state objects could manage the same conversation and violate at-most-once;
2. a global default command/interval/stop change must advance `controlRevision` for chats that inherit the changed field;
3. removing the only inherited global stop guard from an active task must fail closed unless another task guard remains;
4. `START_TASK` immediate check must target only the selected chat even when ordinary global monitoring is already enabled;
5. destructive chat-identity operations (remove/add/import) must not race an active check/dispatch;
6. compact popup/badge status must not report “stopped” while task-only execution is active.

## 4. Evidence So Far

Pre-hardening exact head `d60a463d4f1665e121f56c973d59b1904851ba2e` completed five independent audit cycles with 43/43 tests per cycle and static validation PASS. That evidence is historical only because adversarial repairs changed product code afterward.

Durable-checkpoint regression file `dispatch-checkpoint.test.mjs` now covers selected-chat baseline isolation, same-run dispatch counting across profile edits, newer-run counter isolation, storage-before-Telegram ordering and persisted task-start-before-Telegram ordering.

Any workflow/package result before all active adversarial repairs is stale for release purposes.

## 5. Release Gates

GATE-1 architecture/migration: SATISFIED.
GATE-2 core profiles/limits/tasks: VERIFYING after adversarial repairs.
GATE-3 Control Center/Telegram/portable config: VERIFYING.
GATE-4 final exact-head branch audit/package: PENDING final hardening head.
GATE-5 canonical PR merge-tree: PENDING GATE-4.
GATE-6 exact-head merge + post-merge `main`: PENDING GATE-5.

## 6. Current Critical Path

CP-1 ACTIVE — finish task-only scheduler isolation one-shot, then apply the six remaining fail-closed hardening items above and add regressions.
CP-2 PENDING — run five-cycle exact-head audit + deterministic 0.6.0 package/security and record hashes/artifact.
CP-3 PENDING — final adversarial diff review; open canonical non-draft PR.
CP-4 PENDING — independent PR merge-tree five-cycle/package hash equality.
CP-5 PENDING — exact-head merge and post-merge `main` equality, then DONE.

## 7. Active Execution Registry

HQ: architecture/integration/adversarial validation.
PROJECT_RUNNER: one-shot task-only helper run `33597809130` on trigger head `126cf29d...`.
Workers: NONE — state/service-worker/options surfaces overlap and require one canonical writer.
Codex: NONE.
Human gate: NONE.

## 8. Current Blockers

NONE. Runner queue is an active execution state, not a blocker. No owner action required.

## 9. Six Audits

Repository Coverage: PASS.
Evidence: PASS for current checkpoint; final release evidence pending final head.
Release Alignment: PASS — exactly selected ideas 1/2/3/4/7/8.
Dependency & Ordering: PASS.
Execution & Parallelism: PASS.
Adversarial: PASS as an active audit process — discovered race/identity/import/global-inheritance risks are being repaired before PR, not waived.

## 10. Next Action

Observe helper `33597809130`; after its self-clean product commit, apply duplicate-import/global-inheritance/targeted-task/identity-race/popup hardening in one bounded change, add regressions, and make that resulting head the only acceptable branch release candidate.

## 11. Chat Rotation Checkpoint

Safe to rotate: YES.
Last completed atomic action: revision 18 persisted with all material adversarial findings and active helper identity.
Active external execution: helper run `33597809130`.
Unpersisted material reasoning: NONE.
Recovery: re-read live master + this state, inspect helper run/branch, continue CP-1 without asking owner.

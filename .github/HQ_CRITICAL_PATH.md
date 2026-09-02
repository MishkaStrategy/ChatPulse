---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 19
updated_at: 2026-09-02T06:34:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.6.0-control-center
basis_sha: 66f54dc89a6b39733ca1c81861a45be13d0b04d8
---

# HQ Critical Path

## 1. Current Release Contract

Release target: **ChatPulse 0.6.0 beta**.

Explicit owner scope:
1. per-chat continuation/time limits;
2. per-chat profiles;
3. Control Center;
4. expanded Telegram operational events;
5. safe configuration export/import;
6. guarded “run task until completion” mode.

RELEASED requires:
- canonical non-draft PR merged to live `main` with exact-head guard;
- five independent branch audits + deterministic package/security PASS;
- independent PR merge-tree five-cycle/package PASS with identical product/source hashes;
- post-merge `main` five-cycle/package PASS with the same hashes.

Explicit exclusions: multi-stop/regex, cloud sync/backend/accounts, Telegram token export, unrelated Draft PR #17.

## 2. Final Branch Candidate

Canonical branch: `release/0.6.0-control-center`.
Final exact candidate head: `66f54dc89a6b39733ca1c81861a45be13d0b04d8`.
Final branch validation run: `33599369283` (`ChatPulse 0.6.0 beta release gate`, push event).
Last observed status: queued.

The final candidate includes a permanent `workflow_dispatch` trigger in `.github/workflows/extension-ci.yml` so a final RC can be revalidated explicitly without introducing temporary control workflows. This commit is part of the release candidate and created the current exact-head run.

## 3. Implemented Product Contract

### Schema / per-chat profiles
- schema v4 with global defaults and per-chat inheritance;
- per-chat command, interval, stop mode/value, max continuations, max runtime and Telegram policy;
- global inherited setting changes advance `controlRevision` only for affected chats;
- removing the last inherited guard from an active task is rejected fail-closed.

### Limits / task engine
- continuation count advances only after actual `recordDispatch()`;
- limit `N` cannot produce `N+1`;
- runtime guard is checked before a new send;
- task mode requires at least one effective guard;
- task start resets only the selected chat baseline/counter;
- task start from master-stop enters `taskOnly` mode, keeping unrelated ordinary chats dormant;
- task start while normal monitoring is already running preserves normal monitoring;
- immediate task-start check targets only the selected chat;
- top Stop is master-stop and closes active tasks;
- manual/global task stop increments `controlRevision`, invalidating stale in-flight task snapshots;
- Stop→Start uses a new global session and live send authorization requires the same session.

### Durable at-most-once
- actual dispatch fingerprint/outcome/count is persisted to local storage before Telegram/network notification work;
- concurrent profile/control edit keeps the fresh profile/control state while a same-run real dispatch still counts;
- genuinely newer run keeps a fresh counter while preserving a late old-run fingerprint for duplicate protection.

### Control Center
- global engine/chat/task/check metrics;
- per-chat state, progress, next check, completion/error status;
- per-chat profile editor and task controls;
- popup and full Control Center both distinguish task-only vs normal vs master-stop state.

### Telegram
- optional host permission only;
- continuation, task-start, stop-phrase, continuation-limit, runtime-limit and generic automation-error events;
- fixed event strings only; no response text, conversation URL, stop phrase, command or bot token;
- notification failure remains non-critical.

### Portable configuration
- exports defaults + normalized chat identity + enabled/profile settings only;
- excludes Telegram token, tab/session/internal IDs, fingerprints, dispatch history, logs/errors and task runtime;
- import rejects duplicate canonical ChatGPT URLs;
- import regenerates local IDs/baselines/counters, preserves separate local Telegram credentials and leaves global monitoring stopped;
- import/remove are blocked while a check is active so chat identity cannot disappear under an in-flight dispatch.

## 4. Regression / Audit Coverage

Existing released 0.5.4/0.5.5 tests remain mandatory.

New dedicated suites cover:
- schema migration and inheritance;
- exact continuation/runtime limits;
- guarded task start/fresh baseline;
- per-chat scheduling;
- secret/runtime-free portable config;
- stale controlRevision rejection;
- actual per-chat command dispatch;
- maxContinuations=1 => exactly one send;
- unguarded task rejection;
- runtime message export/import and Telegram credential isolation;
- selected-chat baseline isolation;
- durable dispatch checkpoint before Telegram;
- same-run counting across profile edits;
- newer-run counter isolation;
- taskOnly/master-stop/targeted task check contract;
- same-session send gate;
- destructive identity mutation lock;
- inherited global setting revisions;
- active-task last-guard removal rejection;
- duplicate canonical import rejection;
- task stop invalidates stale work.

Historical pre-hardening branch runs are evidence only and are not release evidence. The only acceptable branch release evidence is run `33599369283` on exact head `66f54dc8...` or an explicit rerun of that same head.

## 5. Release Gates

GATE-1 architecture/migration: SATISFIED.
GATE-2 core profile/limit/task implementation: SATISFIED by design/code; final runtime regression evidence pending current run.
GATE-3 Control Center/Telegram/portable config: SATISFIED by design/code; final regression evidence pending current run.
GATE-4 exact-head branch five-cycle/package/security: ACTIVE — run `33599369283`.
GATE-5 canonical PR merge-tree equality: PENDING GATE-4.
GATE-6 exact-head merge + post-merge `main` equality: PENDING GATE-5.

## 6. Current Critical Path

CP-1 ACTIVE — finish exact-head branch run `33599369283`; require 5/5 audits, all tests/static safety and deterministic package/security PASS; record final hashes/artifact.
CP-2 PENDING — final diff/adversarial review and open canonical non-draft PR.
CP-3 PENDING — PR merge-tree five-cycle/package equality and review/thread audit.
CP-4 PENDING — exact-head merge and post-merge `main` equality, then persist DONE.

## 7. Active Execution Registry

HQ: final validation/integration/release owner.
PROJECT_RUNNER: `33599369283` on `release/0.6.0-control-center@66f54dc89a6b39733ca1c81861a45be13d0b04d8`.
Workers: NONE — selected functionality overlaps shared state/service-worker/options surfaces.
Codex: NONE.
Human gate: NONE.

## 8. Current Blockers

NONE. Runner queue is active execution, not a blocker. No owner action is required.

## 9. Six Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS for final-candidate identity; branch release evidence currently executing.
Release Alignment Audit: PASS — exactly selected ideas 1/2/3/4/7/8.
Dependency & Ordering Audit: PASS.
Execution & Parallelism Audit: PASS.
Adversarial Audit: PASS — all discovered N+1, stale control/session, task isolation, durable dispatch, duplicate import, inherited-guard, identity mutation and UI-status risks have explicit code/test controls before PR.

## 10. Next Action

Inspect run `33599369283`; if green, freeze branch, record product/source hashes and artifact, then open canonical non-draft PR. Repair only concrete evidence-backed failures and restart exact-head validation if necessary.

## 11. Chat Rotation Checkpoint

Safe to rotate: YES.
Last completed atomic action: final candidate `66f54dc8...` created and exact-head run `33599369283` materialized; revision 19 persisted.
Active external execution: run `33599369283`.
Unpersisted material reasoning: NONE.
Recovery: live-read master + revision 19 + exact run/head, continue CP-1 without asking owner.

---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 17
updated_at: 2026-09-02T06:01:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.6.0-control-center
basis_sha: d60a463d4f1665e121f56c973d59b1904851ba2e
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

Definition of RELEASED:
- canonical implementation PR merged to live `main` with exact-head guard;
- exact branch and PR merge-tree five-cycle audits pass;
- post-merge `main` repeats five-cycle audit + deterministic package/security gate;
- canonical 0.6.0 ZIP and source-manifest hashes reproduce on branch, merge-tree and post-merge `main`.

Explicit exclusions:
- multiple stop phrases / regex rules;
- cloud sync/backend/accounts;
- Telegram token export;
- unrelated Draft PR #17 runner-selector work.

## 2. Repository Basis

Default branch: `main`.
Current main state-only HEAD at checkpoint start: `b14287ab753a31b34295a5cfe6df4d1f46ce25f3`.
Released product beneath state commits: ChatPulse 0.5.5 at `bf4ee1aaf0802ff852f12392ed46aa6c8bec4e67`.
Canonical 0.6.0 branch: `release/0.6.0-control-center`.
Current exact candidate head: `d60a463d4f1665e121f56c973d59b1904851ba2e`.

## 3. Idea / Adversarial Audit

All six selected ideas: PASS with enforced guardrails.

- Profiles inherit global command/interval/stop settings unless explicitly overridden.
- Empty per-chat stop phrase can explicitly disable an inherited global stop phrase.
- Profile writes advance `controlRevision`; stale in-flight checks cannot use old profile settings.
- Continuation count advances only after `recordDispatch()` fixes at-most-once outcome.
- Limit `N` is checked before send and after the Nth recorded dispatch; N+1 is forbidden.
- Runtime limit is checked before a new send.
- Task mode requires at least one effective guard: stop phrase, max continuations or max runtime.
- Control Center is a projection/editor of the same canonical local state, not a second scheduler.
- Telegram operational events use fixed event strings only and remain optional/non-critical.
- Portable export is configuration-only: no Telegram bot token, tab/session IDs, fingerprints, dispatch history, logs, errors or active task runtime.
- Import regenerates local IDs/runtime baseline/counters, preserves separate local Telegram credentials and leaves global monitoring stopped.

## 4. Implemented Candidate Surface

### Core/model
- schema v4;
- per-chat profile normalization/effective inheritance;
- run/task counters/timestamps/completion reason;
- exact continuation/runtime guards;
- per-chat next-eligible scheduling;
- portable config create/apply;
- stale `controlRevision` runtime merge protection;
- runtime auto-stop (`stop-phrase`, `continuation-limit`, `runtime-limit`) persists without resurrecting a manually disabled chat.

### Service worker
- `UPDATE_CHAT_PROFILE`, `START_TASK`, `STOP_TASK`, `EXPORT_CONFIG`, `IMPORT_CONFIG`;
- per-chat effective command/interval/stop phrase;
- guard checks before DOM send and after recorded dispatch;
- same-revision check before send;
- minimum enabled-chat interval drives the shared Chrome alarm while each chat has its own due time;
- import leaves global monitor stopped;
- task count exposed in extension badge.

### Telegram
- continuation, task-started, stop-phrase, continuation-limit, runtime-limit and generic automation-error events;
- no response text/URL/stop phrase/command/token fields;
- per-chat Telegram policy;
- notification failure remains warning-only.

### Control Center
- global metrics: status, active chats, active/completed tasks, last/next check;
- per-chat status/error/next-check/progress;
- profile editor for command, interval, stop mode/value, max continuations, max runtime, Telegram policy;
- guarded task start/stop;
- portable JSON export/import UX;
- unsaved per-chat drafts survive state repaint.

### Release surface
- Manifest/package set to `0.6.0 beta` / `0.6.0-beta.1`;
- reproducible package names moved to 0.6.0;
- static validator expanded for legacy safety + schema-v4/task/export/Telegram boundaries;
- release workflow moved to 0.6.0 and targets canonical release branch + `main`;
- README/CHANGELOG/PRIVACY/SECURITY updated.

Temporary one-shot merge-repair workflow/script were removed after an exact fail-closed patch. They are not part of the release candidate.

## 5. Test Coverage Added

`profile-task.test.mjs` covers:
- v3→v4 migration;
- profile inheritance and explicit stop disable;
- exact N continuation limit;
- runtime limit;
- task guard/fresh baseline;
- per-chat schedule;
- secret/runtime-free portable config;
- stale control-revision rejection.

`task-service-worker.test.mjs` covers:
- profile persistence/controlRevision;
- actual per-chat command dispatch;
- maxContinuations=1 => exactly one send then stop, never N+1;
- unguarded task rejection;
- runtime-message export/import isolation and preservation of separate local Telegram credentials.

All released 0.5.4/0.5.5 tests remain unchanged and mandatory.

## 6. Release Gates

GATE-1 Architecture/migration design: SATISFIED.
GATE-2 Core profile/task/limit implementation: VERIFYING.
GATE-3 Control Center/Telegram/portable config implementation: VERIFYING.
GATE-4 Exact-head branch regression/security/package: ACTIVE.
GATE-5 Canonical PR merge-tree: PENDING GATE-4.
GATE-6 Exact-head merge + post-merge `main`: PENDING GATE-5.

## 7. Current Critical Path

### CP-1 — Resolve exact-head branch validation
Status: ACTIVE.
Execution plane: PROJECT_RUNNER.
Run: `33596958024`.
Head: `d60a463d4f1665e121f56c973d59b1904851ba2e`.
Last observed: queued after intermediate runs were superseded by concurrency.
Acceptance: five audit cycles + deterministic package/security PASS on exact head.

### CP-2 — Adversarial final diff review and canonical non-draft PR
Status: PENDING CP-1.

### CP-3 — PR merge-tree five-cycle/package equality
Status: PENDING CP-2.

### CP-4 — Exact-head merge and post-merge `main` equality
Status: PENDING CP-3.

## 8. Active Execution Registry

HQ: validating/integrating 0.6.0 candidate.
PROJECT_RUNNER: run `33596958024` on `release/0.6.0-control-center@d60a463d...`.
Workers: NONE — overlapping state/service-worker/options surfaces require one canonical writer.
Codex: NONE.
Human gate: NONE.

## 9. Current Blockers

NONE. Runner is queued; no user action is required.

## 10. Six Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS for implementation checkpoint; release evidence still pending active gate.
Release Alignment Audit: PASS — exactly owner-selected ideas 1/2/3/4/7/8, no multi-stop/cloud-sync scope creep.
Dependency & Ordering Audit: PASS.
Execution & Parallelism Audit: PASS.
Adversarial Audit: PASS at implementation stage — N+1, stale-profile send, unguarded infinite task, runtime/secret export and Telegram retry/privacy coupling are explicitly guarded/tested.

## 11. Next Action

Inspect exact-head run `33596958024`; repair any real failure without weakening old regressions, then open canonical non-draft PR only after a green exact branch candidate.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: full 0.6.0 implementation/docs/release surface committed at exact head `d60a463d...`; revision 17 persisted.
Active external execution: run `33596958024`, queued at last observation.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-read revision 17, branch head and run `33596958024`.
Exact next action after recovery: inspect run outcome and fix only evidence-backed failures.
Rotation blockers: NONE.

---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 16
updated_at: 2026-09-02T05:40:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 94fc6839f7bd2dc2facc867d25ce676b02d4514f
---

# HQ Critical Path

## 1. Current Release Contract

Release target: **ChatPulse 0.6.0 beta**.

Owner scope, explicitly selected on 2026-09-02:
1. per-chat continuation/time limits;
2. per-chat profiles;
3. Control Center with useful runtime state/progress;
4. expanded Telegram operational events;
5. safe configuration export/import;
6. guarded “run task until completion” mode.

Release surface:
- Chrome MV3 extension on current 0.5.5 `main` product base;
- local state/schema and service-worker execution semantics;
- options/Control Center UI;
- Telegram event layer without widening permanent permissions;
- portable configuration JSON without secrets/runtime identity;
- deterministic beta ZIP + source manifest.

Definition of RELEASED:
- implementation merged to live default branch through a canonical non-draft PR;
- exact branch and PR merge-tree full audits pass;
- post-merge `main` repeats the same safety/test/package gates;
- final 0.6.0 product ZIP and source-manifest SHA-256 are reproduced on branch, merge-tree and `main`.

Mandatory release gates:
- [ ] state migration preserves existing 0.5.5 behavior when no per-chat override is configured;
- [ ] each chat can override command, interval, stop phrase, continuation limit, runtime limit and Telegram policy;
- [ ] continuation/runtime limits cannot cause an extra send and increment only after `recordDispatch()` fixes at-most-once state;
- [ ] task mode requires at least one completion guard and resets to a fresh safe baseline;
- [ ] Control Center derives status/progress from canonical local state, not a parallel execution system;
- [ ] Telegram operational events remain post-state/non-critical and never contain response text, conversation URL, stop phrase, command or bot token;
- [ ] export/import excludes Telegram bot token, runtime fingerprints, dispatch history, tab IDs, session IDs and logs; import regenerates safe runtime identity/baselines;
- [ ] all released 0.5.4/0.5.5 stop-phrase, controlRevision, stale-tab, draft/active-tab, at-most-once and Telegram permission/privacy regressions remain green;
- [ ] reproducible package/provenance passes on exact branch, PR merge-tree and post-merge `main`.

Known explicit exclusions:
- multiple stop phrases / regex rules are not part of this owner selection;
- cloud sync, backend accounts and remote storage remain out of scope;
- Telegram token export is forbidden;
- unrelated Draft PR #17 runner-selector work remains out of scope.

## 2. Repository Basis

Default branch: `main`.
Observed pre-state-write HEAD: `94fc6839f7bd2dc2facc867d25ce676b02d4514f` (state-only commit above released product SHA `bf4ee1aaf0802ff852f12392ed46aa6c8bec4e67`).
Current released product: ChatPulse 0.5.5 beta.
Relevant current architecture: `model-v2.js` schema v3 + MV3 service worker + content script + options UI + separate Telegram secret config in `chrome.storage.local`.
Current release convention: five independent exact-head audits + deterministic ZIP/source manifest + branch/merge-tree/post-merge equality.

## 3. Idea / Architecture Audit

### Selected idea 1 — continuation/time limits
PASS with guardrails. Counts must advance only after dispatch is recorded. Limit equality means exactly N successful/submitted dispatches maximum, never N+1. Runtime limit is per enabled/task run and must stop before a new send once expired.

### Selected idea 2 — per-chat profiles
PASS. Global 0.5.5 settings remain defaults for migration. Per-chat fields use explicit inheritance instead of copying globals, avoiding silent divergence and preserving existing users.

### Selected idea 3 — Control Center
PASS. It is a projection of canonical local state: enabled/task state, last decision/error, continuation count, next eligible check and completion reason. It must not create a second scheduler/state store.

### Selected idea 4 — Telegram operational events
PASS with privacy/non-critical constraints. Add stop/limit/task/error events, deduplicating persistent errors. Telegram remains optional host permission and notification failure never retries ChatGPT continuation.

### Selected idea 7 — export/import
PASS only as a portable **configuration** format. Include global defaults + chat URLs/titles/enabled/profile settings. Exclude credentials and runtime state. Import validates URLs/schema, regenerates chat IDs/baselines/counters and preserves existing local Telegram credentials.

### Selected idea 8 — run until completion
PASS as a profile/task preset, not a parallel automation engine. Starting a task requires at least one guard: stop phrase, max continuations or max runtime. Task completion disables that chat only and records a reason/progress.

## 4. Release Gates

### GATE-1 — Architecture and migration
Status: SATISFIED for design / pending implementation evidence.

### GATE-2 — Core state/profile/task engine
Status: UNSATISFIED.

### GATE-3 — Control Center, Telegram events and portable config
Status: UNSATISFIED.

### GATE-4 — Exact-head regression/security/package validation
Status: UNSATISFIED.

### GATE-5 — Canonical PR merge-tree validation
Status: UNSATISFIED.

### GATE-6 — Merge and post-merge release verification
Status: UNSATISFIED.

## 5. Current Critical Path

### CP-1 — Implement schema-v4 per-chat profiles, limits and guarded task engine
Status: ACTIVE.
Release gate: GATE-2.
Execution plane: HQ_DIRECT.
Acceptance: migration defaults preserve 0.5.5; limit/task transitions are pure/testable and at-most-once safe.

### CP-2 — Integrate scheduler/service worker + expanded Telegram events
Status: PENDING CP-1.
Release gates: GATE-2/GATE-3.

### CP-3 — Build Control Center + safe export/import UX
Status: PENDING CP-2.
Release gate: GATE-3.

### CP-4 — Version/package/docs/tests and exact-head validation
Status: PENDING CP-3.
Release gate: GATE-4.

### CP-5 — Canonical PR merge-tree audit and adversarial review
Status: PENDING CP-4.
Release gate: GATE-5.

### CP-6 — Exact-head merge then post-merge `main` validation/provenance
Status: PENDING CP-5.
Release gate: GATE-6.

## 6. Active Execution Registry

HQ: owner of architecture, implementation, integration and release decisions.
Workers: NONE — selected features overlap the same state/service-worker/options surfaces; multiple writers would create avoidable merge/race risk.
Codex: NONE.
Zero-model control: NONE active.
CI/runtime: NONE active at this checkpoint.

## 7. Safe Parallel Work

NONE — core profile/task schema determines the service-worker and UI contracts, so execution is intentionally sequential until that boundary is fixed.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — state/model, service worker, content inspection, Telegram module, options UI, validation/tests, package/release surfaces covered.
Evidence Audit: PASS — live `main` and released 0.5.5 guarantees were re-read before design.
Release Alignment Audit: PASS — all six selected ideas are included exactly once; unselected multi-stop/regex/cloud-sync work excluded.
Dependency & Ordering Audit: PASS — schema/engine → runtime integration → UI/config → validation → PR → merge/post-merge.
Execution & Parallelism Audit: PASS — single writer on overlapping product surfaces; independent CI remains read-only.
Adversarial Audit: PASS — secret export, N+1 sends, stale baseline resurrection, Telegram retry coupling, import of dispatch history and unguarded infinite task mode are explicitly rejected.

## 10. Next Action

Create canonical `release/0.6.0-control-center` from the persisted live `main` head, implement CP-1, then expand through CP-6 without user intervention.

## 11. Last Material Revision

Owner promoted ideas 1/2/3/4/7/8 into product scope. The previous terminal state was reopened as an explicit ChatPulse 0.6.0 beta release.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: owner scope audited and revision 16 persisted before product writes.
Active external executions: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-read revision 16 and current `main`; create/continue `release/0.6.0-control-center`.
Exact next action after recovery: implement CP-1 from current persisted main head.
Rotation blockers: NONE.

---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 10
updated_at: 2026-09-02T01:54:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: f4f4b4c9b405926fe3172accaed32d4b72146d17
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.5.4 beta rebuilt from the live `main` product state, with the owner-required per-chat stop-phrase behavior and without relying on the irrecoverable historical payload.

Owner decision on 2026-09-02: `пересобирай 0.5.4 с новыми хэшами`.

This explicitly supersedes the old release pins as current requirements. Historical hashes remain evidence only:
- old source archive SHA-256 `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5` — RETIRED;
- old beta ZIP SHA-256 `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3` — RETIRED.

New source identity:
- exact Git commit SHA of the rebuilt canonical release candidate;
- deterministic release file manifest/hash evidence produced by the release gate.

New release artifact:
- `ChatPulse-Chrome-v0.5.4-beta.zip`;
- new SHA-256 generated and verified only after the exact-head full release gate passes.

Definition of RELEASED:
- stop-phrase behavior is implemented on a fresh candidate derived from current `main`;
- a stop phrase detected in one tracked chat disables only that chat and prevents a continuation send for that response;
- existing at-most-once, tab-recovery, local-only and Chrome MV3 safety properties remain intact;
- full syntax/unit/static/package gate passes on the exact candidate head;
- deterministic beta ZIP is published with its new SHA-256;
- canonical rebuilt 0.5.4 PR is merge-ready and merged to live `main`;
- post-merge `main` and retained artifact satisfy the same gate.

Explicit exclusions:
- old Issue #14 payload is diagnostic/reference evidence only and is not a release source;
- old PR #15 is historical/superseded unless reused only as read-only semantic evidence;
- Telegram PR #18 remains VERIFIED/PARKED until 0.5.4 reaches `main`, then must be reconciled and revalidated;
- PR #17 runner-selector refactor remains non-critical unless proven prerequisite;
- Chrome Web Store, GitHub Release/tag, native/Safari packaging are not required for this beta release.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA: `f4f4b4c9b405926fe3172accaed32d4b72146d17`.
Current product version on `main`: 0.5.2 beta line; release workflow still reflects the abandoned Issue-payload integration path and must be replaced for the rebuilt candidate.

Historical PR #15:
- branch `feature/stop-phrase-0.5.4`;
- head `2e6d79971ccd58619acac28551ddcf6d457c71a1`;
- open/non-draft;
- only 2 changed files, no integrated product candidate; no longer canonical for the rebuilt contract.

Telegram PR #18:
- branch `feature/telegram-notifications`;
- exact verified head `308f8e362f3c93a607f6a2bbc21ea11a74523959`;
- open Draft and intentionally parked.

## 3. Release Gates

### GATE-1 — Rebuilt contract / fresh base
Status: SATISFIED.
Evidence: explicit owner authorization plus live `main` SHA.

### GATE-2 — Exact stop-phrase semantics and implementation
Status: UNSATISFIED.
Blocking items: derive the smallest safe semantics from product requirements plus read-only historical evidence, then implement on a fresh branch from current `main`.

### GATE-3 — Exact-head validation/package/security
Status: UNSATISFIED.
Requires syntax, unit/service-worker/model tests, static Manifest/security validation, deterministic packaging and secret/permission checks.

### GATE-4 — New release hashes/artifact
Status: UNSATISFIED.
Requires exact candidate commit SHA, deterministic release manifest/hash evidence, retained `ChatPulse-Chrome-v0.5.4-beta.zip` and its new SHA-256.

### GATE-5 — Merge/post-merge verification
Status: UNSATISFIED.
Requires rebuilt PR merge readiness, merge, and post-merge verification on `main`.

## 4. Current Critical Path

### CP-1 — Derive stop-phrase semantics without trusting old payload as source
Status: ACTIVE.
Release gate: GATE-2.
Execution plane: HQ_DIRECT + bounded PROJECT_RUNNER read-only diagnostic.
Exact scope: compare historical 12-file archive product-core text against current `main` only to identify stop-phrase semantics; do not execute archived code or copy unrelated historical regressions.
Acceptance: bounded semantic patch plan for current model/service-worker/UI/tests.

### CP-2 — Build fresh 0.5.4 candidate from current `main`
Status: PENDING.
Depends on: CP-1.
Execution plane: HQ_DIRECT on a new release branch.
Acceptance: product changes and release workflow/package scripts committed without unrelated cleanup.

### CP-3 — Run full exact-head release gate and publish artifact
Status: PENDING.
Depends on: CP-2.
Execution plane: PROJECT_RUNNER `[self-hosted, fast]`.
Acceptance: all tests/security/package checks PASS; new artifact SHA and source/candidate identity captured.

### CP-4 — Verify rebuilt PR and merge 0.5.4
Status: PENDING.
Depends on: CP-3.
Execution plane: HQ_DIRECT GitHub control.
Acceptance: exact head/base/diff/CI/reviews/mergeability verified, merged, then post-merge release evidence verified.

### CP-5 — Reconcile Telegram PR #18 with released 0.5.4
Status: PENDING FOLLOW-UP, not part of the 0.5.4 release gate.

## 5. Active Execution Registry

HQ:
- CP-1 semantic reconstruction / rebuilt release design.
- write surface currently limited to HQ control state and temporary read-only diagnostics on `main`.

Workers: NONE — current semantic reconstruction and candidate ownership overlap the single release slice; delegation would add coordination overhead.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: NONE active at this checkpoint.

## 6. Safe Parallel Work

NONE — Telegram is already verified/parked and must wait for the 0.5.4 base; release code and release workflow must share one exact candidate head.

## 7. Current Blockers

NONE. The prior integrity blocker was explicitly superseded by owner authority.

## 8. Critical Path Audits

Repository Coverage Audit: PASS — live `main`, persistent state, PR #15, PR #18, current release workflow/package scripts and prior integrity evidence are covered.
Evidence Audit: PASS — the new contract is grounded in explicit owner authorization and live GitHub state; old hashes are retained only as historical evidence.
Release Alignment Audit: PASS — work is limited to rebuilt 0.5.4 stop-phrase release; Telegram remains follow-up.
Dependency & Ordering Audit: PASS — semantics precede implementation; implementation precedes exact-head validation/package; hashes are captured only from the validated head; merge follows release evidence.
Execution & Parallelism Audit: PASS — one canonical rebuilt release branch avoids overlapping writes; project runner handles deterministic validation; no useful independent worker slice exists.
Adversarial Audit: PASS — rejected silently reusing the incomplete Issue payload, copying old product-core wholesale, reusing stale PASS evidence, merging Telegram early, or retaining old hashes as new release pins.

## 9. Next Action

Exact next action: run a bounded read-only comparison of the historical archive product-core against current `main` to recover only stop-phrase behavior, then create a fresh rebuilt release branch from current `main`.
Executor: HQ + PROJECT_RUNNER diagnostic.
Expected evidence: semantic diff limited to stop-phrase-related behavior and UI/state fields.
Acceptance: no archived code execution; no unrelated historical regressions imported.

## 10. Last Material Revision

What changed: owner explicitly authorized a rebuilt 0.5.4 with new hashes.
Why critical path changed: the prior human integrity gate is resolved; release can proceed from current `main` without the lost historical source archive.
Evidence causing the change: owner message `пересобирай 0.5.4 с новыми хэшами`.

## 11. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: persisted the explicit rebuilt 0.5.4 release contract and retired the historical source/artifact hashes as current pins.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-read revision 10 and current `main`; execute CP-1 read-only semantic reconstruction, then branch from the validated current main SHA.
Exact next action after recovery: derive stop-phrase semantics and create the rebuilt release candidate branch.
Rotation blockers: NONE.

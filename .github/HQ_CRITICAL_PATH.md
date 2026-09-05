---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 34
updated_at: 2026-09-05T15:01:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: NOT_READY
basis_ref: main
basis_sha: 32152d9b99c94f8137adda85cda8cb23c5549e45
---

# HQ Critical Path

## 1. Current Release Contract
Release target: ChatPulse 0.7.4 beta — independent GitHub Actions scheduling, per-chat GitHub-only resume mode, and lossless serialization of simultaneous scheduler triggers.
Definition of RELEASED: ordinary and GitHub alarms neither reset nor suppress each other; GitHub-only chats have no automatic ordinary interval check; concurrent triggers queue and execute with their own source/parameters; master Stop and existing fail-closed/at-most-once safety remain intact; final branch/PR/main gates pass.
Mandatory gates: independent alarms/GitHub-only [x]; >2 workflow episodes [x]; concurrent trigger queue [ ]; existing safety regression [ ]; final branch/PR/main release evidence [ ].
Required evidence: final SHAs, workflow IDs, simultaneous-trigger regression, test counts, Chromium E2E, reproducible hashes.
Exclusions: poll cadence/inactivity semantics, stuck-generation threshold, active-tab policy, token/fail-closed boundary, draft PR #17.

## 2. Repository Basis
Default branch: main.
Superseded product candidate: `32152d9b99c94f8137adda85cda8cb23c5549e45`.
Critical-path basis: main @ `32152d9b99c94f8137adda85cda8cb23c5549e45` (subsequent main commits are HQ state-only).
Canonical branch: `release/0.7.4-independent-actions-watchdog`.
Merged superseded PR: #27, head `9003a27306833e413badde929771ce1916818d6d`, merge-tree `4a51ce7fe093fbc037539a56ed3a7a1748a3336b`.
Post-fix PR: pending.
Superseded CI: main `33973400438`, dependency `33973400433`.
Release state: NOT DONE because `runCheck()` drops concurrent trigger identity.

## 3. Repository Scan Summary
Project: local Chrome MV3 ChatGPT task runner. Build: deterministic package + Node validation. Tests: 104 deterministic + Chromium E2E on superseded candidate.
Material finding: independent alarm synchronization fixed reset starvation, but `if (activeCheck) return activeCheck;` still makes a concurrent alarm lose its source/parameters. Phase-aligned ordinary/GitHub alarms can therefore starve the watchdog.

## 4. Release Gates
### GATE-1 — Independent alarms + GitHub-only
Status: SATISFIED
Evidence: `9003a273...` / PR #27 merge-tree `4a51ce7f...`, 5x104/104, independent alarm/GitHub-only/>2 episodes PASS.
Blocking: NONE.
### GATE-2 — Lossless trigger serialization
Status: UNSATISFIED
Evidence: `32152d9b...` contains drop-on-active behavior.
Blocking: promise-tail queue + rejection-safe continuation + simultaneous ordinary/GitHub dynamic regression + static no-drop guard.
### GATE-3 — Final frozen branch
Status: UNSATISFIED
Blocking: GATE-2.
### GATE-4 — Final PR merge-tree
Status: UNSATISFIED
Blocking: GATE-3/post-fix PR.
### GATE-5 — Final main
Status: UNSATISFIED
Blocking: GATE-4.

## 5. Current Critical Path
### CP-1 — Serialize concurrent scheduler triggers
Status: ACTIVE
Release gate: GATE-2
Execution: HQ_DIRECT + PROJECT_RUNNER.
Scope: `runCheck()` queue, simultaneous-alarm dynamic regression, static no-drop assertion.
Acceptance: both synchronous alarms execute serially; GitHub observation persists; later trigger survives earlier rejection; queued work preserves identity mutation guard.
### CP-2 — Final frozen branch validation
Status: PENDING
Depends: CP-1. Acceptance: full release gate on exact head.
### CP-3 — Final PR merge-tree validation
Status: PENDING
Depends: CP-2. Acceptance: exact merge-ref + dependency/reviews/threads/mergeability green.
### CP-4 — Merge + final main validation
Status: PENDING
Depends: CP-3. Acceptance: exact main fully green, hashes persisted.

## 6. Active Execution Registry
HQ: CP-1 canonical writer. Workers: NONE. Codex: NONE. Zero-model: NONE. CI: superseded run may finish but is noncanonical.

## 7. Safe Parallel Work
NONE — remaining code/test/static-validator surfaces are tightly coupled.

## 8. Current Blockers
NONE.

## 9. Critical Path Audits
Repository Coverage: PASS. Evidence: PASS. Release Alignment: PASS. Dependency & Ordering: PASS. Execution & Parallelism: PASS. Adversarial: PASS.
Resolution: cover both alarm-reset starvation and active-lock trigger loss; queue must survive prior rejection without weakening master Stop/fail-closed/at-most-once.

## 10. Next Action
Advance canonical branch to current state-only checkpoint, implement CP-1, validate exact branch head.

## 11. Last Material Revision
PR #27 merged, then final adversarial audit found concurrent-trigger loss in shared `activeCheck`; candidate `32152d9b...` is superseded pending fix.

## 12. Chat Rotation Checkpoint
Safe to rotate: NO. Last atomic action: persisted collision defect/revised path. Active external: superseded `33973400438` / `33973400433`. Unpersisted reasoning: CP-1 implementation pending. Recovery: live master + r34 + current main + canonical branch. Next: implement CP-1. Rotation blockers: active fix wave.
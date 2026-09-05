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
Release surface: scheduler/alarm lifecycle and serialization, profile/model, MV3 worker routing, Control Center, portable config, deterministic/browser tests, release workflow/package metadata.
Definition of RELEASED: ordinary and GitHub alarms neither reset nor suppress each other; GitHub-only chats have no automatic ordinary interval check; concurrent triggers queue and execute with their own source/parameters; master Stop and all existing fail-closed/at-most-once safety rules remain intact; final branch/PR/main gates pass.

Mandatory release gates:
- [x] Independent alarm lifecycle and GitHub-only mode implemented/regression-tested.
- [x] More than two independent workflow-run inactivity episodes can restart.
- [ ] Concurrent ordinary/watchdog triggers are queued serially and never discarded by an occupied/failed earlier check.
- [ ] Existing watchdog/tab/dispatch safety remains green after serialization fix.
- [ ] Final branch, PR merge-tree and main each pass 5 deterministic audits, Chromium E2E and reproducible package; applicable dependency policy passes.

Required release evidence: exact final branch/PR/main SHAs and workflow IDs; simultaneous-trigger regression; test counts; browser E2E; package/source-manifest SHA-256.
Known exclusions: poll cadence/inactivity semantics, stuck-generation threshold, active-tab policy, token/fail-closed boundary, draft PR #17.

## 2. Repository Basis
Default branch: main.
Superseded product candidate: `32152d9b99c94f8137adda85cda8cb23c5549e45`.
Critical-path basis ref: main.
Critical-path basis SHA: `32152d9b99c94f8137adda85cda8cb23c5549e45`.
Canonical branch: `release/0.7.4-independent-actions-watchdog`.
Merged superseded PR: #27; head `9003a27306833e413badde929771ce1916818d6d`; merge-tree `4a51ce7fe093fbc037539a56ed3a7a1748a3336b`.
Post-fix PR: pending.
Relevant CI: superseded main `33973400438`, dependency `33973400433`.
Release state: NOT DONE; final adversarial audit found shared `runCheck()` trigger loss.

## 3. Repository Scan Summary
Project: local Chrome MV3 ChatGPT task runner.
Architecture: UI, MV3 service worker, pure model helpers, content script, optional Telegram/GitHub integrations.
Build/tests: deterministic package, Node validation, 104 deterministic tests plus Chromium E2E on superseded candidate.
Material finding: independent alarm synchronization fixed reset starvation, but `runCheck()` still does `if (activeCheck) return activeCheck;`. A concurrent alarm therefore loses its own semantic trigger; phase-aligned alarms can still starve the watchdog.

## 4. Release Gates
### GATE-1 — Independent alarms + GitHub-only
Status: SATISFIED
Evidence: branch `9003a273...` and PR #27 merge-tree `4a51ce7f...`: 5x104/104, `independent_alarm_lifecycle` PASS, `github_only_scheduler` PASS, >2 episode regression PASS.
Blocking items: NONE.

### GATE-2 — Lossless trigger serialization
Status: UNSATISFIED
Evidence: `32152d9b...` contains `if (activeCheck) return activeCheck;`.
Blocking items: promise-tail queue, continue after prior rejection, simultaneous ordinary+GitHub dynamic regression, static no-drop guard.

### GATE-3 — Final frozen branch
Status: UNSATISFIED
Blocking items: GATE-2.

### GATE-4 — Final PR merge-tree
Status: UNSATISFIED
Blocking items: GATE-3 + post-fix PR.

### GATE-5 — Final main
Status: UNSATISFIED
Blocking items: GATE-4.

## 5. Current Critical Path
### CP-1 — Serialize concurrent scheduler triggers
Status: ACTIVE
Release gate: GATE-2
Why critical: independently correct alarms can still starve each other via shared lock.
Depends on: `32152d9b...`.
Blocks: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: `runCheck()` queue + simultaneous-alarm dynamic regression + static no-drop assertion.
Acceptance: both synchronous alarms execute serially; GitHub observation persists; later trigger survives previous rejection; identity mutation guard stays active while queue has work.

### CP-2 — Final frozen branch validation
Status: PENDING
Depends on: CP-1
Blocks: CP-3
Execution plane: PROJECT_RUNNER
Acceptance: exact head passes full release gate.

### CP-3 — Final PR merge-tree validation
Status: PENDING
Depends on: CP-2
Blocks: CP-4
Execution plane: PROJECT_RUNNER
Acceptance: exact merge-ref + dependency/reviews/threads/mergeability green.

### CP-4 — Merge and final main validation
Status: PENDING
Depends on: CP-3
Blocks: DONE
Execution plane: HQ_DIRECT + PROJECT_RUNNER
Acceptance: exact final main fully green; hashes persisted.

## 6. Active Execution Registry
HQ: CP-1 canonical writer/integrator.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: superseded main run `33973400438` may finish but cannot close release.

## 7. Safe Parallel Work
NONE — remaining fix/test/static-validator surfaces are tightly coupled.

## 8. Current Blockers
NONE — bounded fix executable.

## 9. Critical Path Audits
Repository Coverage Audit: PASS — shared `runCheck` serialization point added to scope.
Evidence Audit: PASS — live source proves drop behavior; prior evidence retained as superseded.
Release Alignment Audit: PASS — queue correctness is required for the reported watchdog reliability bug.
Dependency & Ordering Audit: PASS — fix -> branch -> PR merge-tree -> main.
Execution & Parallelism Audit: PASS — one canonical writer.
Adversarial Audit: PASS — both alarm-reset starvation and active-lock trigger loss are now covered; prior rejection/master Stop/fail-closed/at-most-once are explicit constraints.

## 10. Next Action
Advance canonical branch to the state-only checkpoint, implement CP-1, validate exact branch head.
Executor: HQ_DIRECT + PROJECT_RUNNER.
Expected evidence: simultaneous-trigger PASS + full audit.

## 11. Last Material Revision
PR #27 merged, then final adversarial audit found concurrent-trigger loss in shared `activeCheck`. Candidate `32152d9b...` is superseded until fixed.

## 12. Chat Rotation Checkpoint
Safe to rotate chat: NO.
Last completed atomic action: persisted bounded collision defect/revised path.
Active external executions: superseded `33973400438` / `33973400433`.
Unpersisted material reasoning: CP-1 implementation pending.
Recovery entrypoint: live master + r34 + current main + canonical branch.
Exact next action: implement CP-1 and freeze final branch.
Rotation blockers: active product fix wave.
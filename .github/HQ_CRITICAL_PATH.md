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

Release target: ChatPulse 0.7.4 beta — make the GitHub Actions watchdog scheduler durable and independent from the ordinary chat interval, add a per-chat GitHub-only resume mode, and guarantee that simultaneous scheduler triggers are serialized rather than dropped.

Release surface: scheduler/alarm lifecycle and serialization, per-chat profile/model, MV3 service-worker routing, Control Center GitHub watchdog UI, portable config, deterministic scheduler/watchdog tests, loaded-Chromium regression gate, version/package/workflow metadata and reproducible packaging.

Definition of RELEASED: ordinary monitoring and the GitHub Actions watchdog neither reset/postpone each other's Chrome alarms nor drop each other's trigger when both fire concurrently; a watched chat can opt into GitHub-only mode so automatic ordinary interval checks are disabled while the watchdog remains active; manual Check Now remains explicit/manual; global Stop remains master stop; existing watchdog inactivity, active-run blocking, fail-closed API errors, token isolation and at-most-once restart semantics remain unchanged; final frozen branch, canonical PR merge-tree and post-merge main evidence all pass.

Mandatory release gates:
- [x] Independent alarm lifecycle and GitHub-only mode are implemented and regression-tested.
- [x] More than two independent workflow-run inactivity episodes can restart; there is no hard-coded restart-count cap.
- [ ] Concurrent ordinary/watchdog triggers are queued serially and a later trigger is never suppressed by an active or failed earlier check.
- [ ] Existing watchdog and tab/dispatch safety invariants remain green after the serialization fix.
- [ ] Final five deterministic audit cycles, Chromium E2E, reproducible package/provenance and dependency policy pass on post-fix branch, PR merge-tree and main.

Required release evidence: exact final branch/PR/main SHAs, workflow IDs, alarm-preservation and simultaneous-trigger regression assertions, deterministic test counts, browser E2E result, package/source-manifest SHA-256.
Known explicit exclusions: GitHub poll cadence/inactivity semantics, stuck-generation threshold, active-tab policy, fail-closed/token boundaries, unrelated draft PR #17.

## 2. Repository Basis
Default branch: main.
Validated-but-superseded 0.7.4 candidate SHA: `32152d9b99c94f8137adda85cda8cb23c5549e45`.
Critical-path basis ref: main.
Critical-path basis SHA: `32152d9b99c94f8137adda85cda8cb23c5549e45`.
Canonical integration branch: `release/0.7.4-independent-actions-watchdog`.
Merged superseded PR: #27; head `9003a27306833e413badde929771ce1916818d6d`; merge-tree `4a51ce7fe093fbc037539a56ed3a7a1748a3336b`.
Canonical post-fix PR / RC: pending.
Relevant open PRs: #17 draft excluded.
Relevant CI: superseded main run `33973400438`; dependency run `33973400433`.
Relevant release state: 0.7.4 is NOT DONE because final adversarial audit found shared `runCheck()` trigger loss.

## 3. Repository Scan Summary
Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture: popup/options UI, MV3 service worker, pure model helpers, ChatGPT content script, optional Telegram/GitHub integrations.
Build/package: deterministic Python ZIP/source manifest plus Node validation.
Tests/CI: 104 deterministic tests plus loaded-Chromium E2E on the superseded candidate; five audit cycles and dependency policy.
Material findings: independent alarms and `githubWatchOnly` fixed the first starvation mechanism. A second mechanism remains: `runCheck()` returns the current `activeCheck` when occupied, silently discarding a concurrent trigger's source/parameters. Phase-aligned ordinary and GitHub alarms can therefore still starve the watchdog.

## 4. Release Gates
### GATE-1 — Independent alarm lifecycle and GitHub-only mode
Status: SATISFIED
Evidence: branch `9003a273...` and PR #27 merge-tree `4a51ce7f...` passed 5x104/104; `independent_alarm_lifecycle`, `github_only_scheduler`, and >2 watchdog episode regressions PASS.
Blocking items: NONE.

### GATE-2 — Lossless scheduler trigger serialization
Status: UNSATISFIED
Evidence: product main candidate `32152d9b...` contains `if (activeCheck) return activeCheck;`.
Blocking items: serialize each trigger behind the active promise, continue after prior rejection, add simultaneous ordinary+GitHub alarm integration regression and static no-drop guard.

### GATE-3 — Final frozen branch
Status: UNSATISFIED
Evidence: pre-fix branch evidence is superseded.
Blocking items: GATE-2.

### GATE-4 — Final PR merge-tree
Status: UNSATISFIED
Evidence: PR #27 is superseded as final RC.
Blocking items: GATE-3 plus post-fix PR.

### GATE-5 — Final main
Status: UNSATISFIED
Evidence: current candidate is known incomplete.
Blocking items: GATE-4.

## 5. Current Critical Path
### CP-1 — Serialize concurrent scheduler triggers
Status: ACTIVE
Release gate: GATE-2
Why critical: two correct independent alarms can still starve each other via the shared check lock.
Depends on: merged `32152d9b...` candidate.
Blocks: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: `runCheck()` promise-tail serialization, simultaneous-alarm dynamic regression, static no-drop assertion.
Acceptance condition: synchronous ordinary/GitHub alarms both execute serially; GitHub observation persists; later trigger survives earlier rejection; queued work keeps identity mutation guard active.
Evidence: pending.

### CP-2 — Validate final frozen branch
Status: PENDING
Release gate: GATE-3
Depends on: CP-1
Blocks: CP-3
Execution plane: PROJECT_RUNNER
Acceptance: exact branch head passes five audits, Chromium E2E and reproducible package.

### CP-3 — Validate final PR merge-tree
Status: PENDING
Release gate: GATE-4
Depends on: CP-2
Blocks: CP-4
Execution plane: PROJECT_RUNNER
Acceptance: exact merge-ref + dependency/review/thread/mergeability evidence green.

### CP-4 — Merge exact head and validate final main
Status: PENDING
Release gate: GATE-5
Depends on: CP-3
Blocks: DONE
Execution plane: HQ_DIRECT + PROJECT_RUNNER
Acceptance: final main gates green and hashes recorded.

## 6. Active Execution Registry
HQ: CP-1 canonical writer/integrator.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: superseded main run `33973400438` may finish but is noncanonical.

## 7. Safe Parallel Work
NONE — remaining code/test/static-validator surfaces are tightly coupled.

## 8. Current Blockers
NONE — bounded fix is executable.

## 9. Critical Path Audits
Repository Coverage Audit: PASS — shared `runCheck` serialization point is now included.
Evidence Audit: PASS — live source proves trigger drop; earlier exact evidence is retained as superseded.
Release Alignment Audit: PASS — serialization is necessary to truly fix the reported watchdog reliability bug.
Dependency & Ordering Audit: PASS — fix -> frozen branch -> PR merge-tree -> final main.
Execution & Parallelism Audit: PASS — one canonical writer avoids overlapping scheduler changes.
Adversarial Audit: PASS — path covers both alarm-reset starvation and active-lock trigger loss; queue must survive prior rejection without weakening master Stop/fail-closed/at-most-once guarantees.

## 10. Next Action
Exact next action: advance canonical release branch to the current state-only checkpoint, implement CP-1, and validate exact branch head.
Executor: HQ_DIRECT + PROJECT_RUNNER.
Expected evidence: simultaneous-trigger PASS + full audit.
Acceptance condition: GATE-2 satisfied.

## 11. Last Material Revision
What changed: PR #27 merged, then adversarial audit found concurrent trigger loss in shared `activeCheck` serialization.
Why path changed: phase-aligned alarms can still suppress GitHub watchdog on the merged candidate.
Evidence: exact `runCheck()` at `32152d9b99c94f8137adda85cda8cb23c5549e45`.

## 12. Chat Rotation Checkpoint
Safe to rotate chat: NO.
Last completed atomic action: persisted bounded collision defect and revised release path.
Active external executions: superseded main run `33973400438` / dependency `33973400433`; no final candidate yet.
Unpersisted material reasoning: CP-1 implementation pending.
Recovery entrypoint: live master + this r34 + current main + canonical release branch.
Exact next action after recovery: implement CP-1 and freeze final branch head.
Rotation blockers: active product fix wave.
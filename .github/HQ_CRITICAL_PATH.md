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
- [x] Independent alarm lifecycle: unchanged normal/watchdog checks preserve the opposite alarm when its desired period is unchanged.
- [x] Per-chat `githubWatchOnly` mode excludes the chat from automatic ordinary start/interval checks while keeping it watchdog-eligible; all-GitHub-only configuration schedules no ordinary alarm.
- [x] Manual Check Now remains available; global Start does not automatically ordinary-check a GitHub-only chat; global Stop remains master stop.
- [x] More than two independent workflow-run inactivity episodes can restart; there is no hard-coded restart-count cap.
- [ ] Concurrent ordinary/watchdog triggers are queued serially; the later trigger still executes even when another check is active, and a failure of the earlier trigger cannot suppress the later one.
- [ ] Existing active-run blocking, active->idle fresh countdown, API fail-closed behavior, private-token isolation, draft/active-tab safety, stuck-tab recovery and continuation at-most-once remain green after the serialization fix.
- [ ] Final five deterministic audit cycles, Chromium E2E and reproducible package/provenance pass on the post-fix frozen branch, PR merge-tree and main; dependency policy passes on applicable PR/main triggers.

Required release evidence: exact final branch/PR/main SHAs, workflow IDs, alarm-preservation and simultaneous-trigger regression assertions, deterministic test counts, browser E2E result, package/source-manifest SHA-256.
Known explicit exclusions: changing the GitHub 10-minute poll cadence; changing inactivity-N semantics; changing the 20-minute stuck-generation threshold; closing active tabs; weakening fail-closed GitHub/token behavior; unrelated draft PR #17.

## 2. Repository Basis

Default branch: main.
Default branch validated-but-superseded 0.7.4 candidate SHA: `32152d9b99c94f8137adda85cda8cb23c5549e45`.
Critical-path basis ref: main.
Critical-path basis SHA: `32152d9b99c94f8137adda85cda8cb23c5549e45`.
Canonical integration branch: `release/0.7.4-independent-actions-watchdog` (advance from merged head with the trigger-serialization fix).
Merged superseded PR: #27, final head `9003a27306833e413badde929771ce1916818d6d`, validated merge-tree `4a51ce7fe093fbc037539a56ed3a7a1748a3336b`.
Canonical post-fix PR / RC: pending.
Relevant open PRs: #17 draft remains separate/excluded.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.
Relevant release/deployment state: PR #27 was merged but 0.7.4 is NOT DONE because final adversarial audit found a shared `runCheck()` trigger-loss defect before release closure.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture / major components: popup/options UI, MV3 service worker, pure state/model helpers, ChatGPT content script, optional Telegram and GitHub Actions integrations.
Build / packaging: deterministic Python ZIP/source-manifest packaging plus Node validation.
Tests / validation: 104 deterministic extension tests plus loaded-Chromium E2E on the superseded candidate.
CI: five deterministic audit cycles, Chromium E2E, reproducible package/provenance and dependency runner policy.
Material findings: the original starvation bug was fixed by independent alarm synchronization and GitHub-only mode is implemented. Final adversarial inspection found a second starvation path: `runCheck()` returns the current `activeCheck` whenever any check is active, so a second alarm trigger is silently discarded rather than executed after the first. Since independent 10-minute alarms can remain phase-aligned, a simultaneous ordinary alarm can repeatedly suppress the GitHub watchdog.

## 4. Release Gates

### GATE-1 — Independent alarm lifecycle and GitHub-only mode
Status: SATISFIED
Evidence: frozen branch `9003a273...` and PR #27 merge-tree `4a51ce7f...` passed 5x104/104; tests report `independent_alarm_lifecycle: PASS`, `github_only_scheduler: PASS`, and >2 watchdog episodes PASS.
Blocking items: NONE.

### GATE-2 — Lossless scheduler trigger serialization
Status: UNSATISFIED
Evidence: product main `32152d9b...` still contains `if (activeCheck) return activeCheck;`, which discards the semantic identity of every concurrent trigger.
Blocking items: serialize queued triggers behind the active check, continue the queue after a previous rejection, and add a simultaneous ordinary+GitHub alarm integration regression.

### GATE-3 — Final frozen branch validation
Status: UNSATISFIED
Evidence: pre-fix branch evidence is superseded by GATE-2 finding.
Blocking items: GATE-2.

### GATE-4 — Final canonical PR merge-tree
Status: UNSATISFIED
Evidence: PR #27 is merged but superseded as final RC by GATE-2 finding.
Blocking items: GATE-3 and a post-fix PR.

### GATE-5 — Final post-merge main
Status: UNSATISFIED
Evidence: current main candidate is known incomplete despite partial green CI.
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1 — Serialize concurrent scheduler triggers without dropping source semantics
Status: ACTIVE
Release gate: GATE-2
Why critical: otherwise two independently correct alarms can still starve each other whenever they fire while the shared check lock is occupied.
Depends on: merged `32152d9b...` candidate.
Blocks: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: `runCheck()` serialization, simultaneous-alarm dynamic regression, static guard against reintroducing drop-on-active behavior. No product scope expansion.
Acceptance condition: two synchronous ordinary/GitHub alarm events execute in serial order; GitHub observation is persisted after the ordinary check; later trigger executes even if the previous promise rejects; `assertIdentityMutationSafe` remains active while queued work exists.
Evidence: pending post-fix branch SHA/run.

### CP-2 — Validate final frozen 0.7.4 branch
Status: PENDING
Release gate: GATE-3
Depends on: CP-1
Blocks: CP-3
Execution plane: PROJECT_RUNNER
Exact scope: five deterministic audits, Chromium E2E, reproducible package/provenance.
Acceptance condition: exact post-fix branch head fully green.
Evidence: pending.

### CP-3 — Validate post-fix canonical PR merge-tree
Status: PENDING
Release gate: GATE-4
Depends on: CP-2
Blocks: CP-4
Execution plane: PROJECT_RUNNER
Exact scope: exact PR merge ref plus dependency policy/review/thread/mergeability checks.
Acceptance condition: exact merge-tree fully green with no unresolved blocker.
Evidence: pending.

### CP-4 — Merge exact post-fix head and validate final main
Status: PENDING
Release gate: GATE-5
Depends on: CP-3
Blocks: DONE
Execution plane: HQ_DIRECT + PROJECT_RUNNER
Exact scope: merge only validated head, validate exact final main product commit, persist DONE state.
Acceptance condition: all main gates green and final 0.7.4 hashes recorded.
Evidence: pending.

## 6. Active Execution Registry
HQ: CP-1 canonical writer/integrator.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: superseded main run `33973400438` and dependency run `33973400433` on `32152d9b...`; they cannot close 0.7.4.

## 7. Safe Parallel Work
NONE — the remaining fix is a tightly coupled shared serialization point plus its exact regression; parallel writers provide no material benefit.

## 8. Current Blockers
NONE — the defect has a bounded executable fix.

## 9. Critical Path Audits
Repository Coverage Audit: PASS — the additional shared serialization point between the two scheduler surfaces is now explicitly included alongside alarm/model/UI/tests/release surfaces.
Evidence Audit: PASS — live main source directly proves concurrent triggers are dropped; branch/PR/main candidate evidence is exact but correctly classified as superseded for final release.
Release Alignment Audit: PASS — lossless trigger serialization is required to truly fix the owner's reported watchdog stoppage; no unrelated feature was added.
Dependency & Ordering Audit: PASS — serialization fix must precede a new frozen branch gate, new PR merge-tree and final main validation.
Execution & Parallelism Audit: PASS — one canonical writer remains correct for the tightly coupled fix/test/static-validation files.
Adversarial Audit: PASS — plan now covers both starvation mechanisms: alarm rescheduling and active-check trigger loss; queue must survive previous rejection, master Stop and all fail-closed/watchdog safety rules remain unchanged.
Material findings and resolutions: PR #27/main `32152d9b...` solved alarm reset starvation but is not sufficient for release closure. The correct second fix is a promise-tail serial queue that preserves each trigger's own `source` and parameters rather than returning the active promise.

## 10. Next Action
Exact next action: advance `release/0.7.4-independent-actions-watchdog` to this state checkpoint, patch lossless `runCheck()` serialization plus simultaneous-alarm regression, then validate the exact final branch head.
Executor: HQ_DIRECT + PROJECT_RUNNER.
Expected evidence: dynamic simultaneous-trigger PASS, static no-drop assertion, full extension audit.
Acceptance condition: GATE-2 satisfied and final branch gate green.

## 11. Last Material Revision
What changed: PR #27 was fully validated and merged, but final adversarial audit before DONE found that the shared `activeCheck` lock drops concurrent scheduler triggers.
Why the critical path changed: the original release contract requires the GitHub watchdog to remain independently reliable; a phase-aligned ordinary alarm can still suppress it on the merged candidate.
Evidence causing the change: exact `runCheck()` implementation on product main `32152d9b99c94f8137adda85cda8cb23c5549e45` plus independent alarm behavior already proven on the candidate.

## 12. Chat Rotation Checkpoint
Safe to rotate chat: NO.
Last completed atomic action: PR #27 exact-head merge completed; post-merge adversarial audit identified and bounded the remaining trigger-loss defect.
Active external executions and exact refs: superseded main release run `33973400438` and dependency run `33973400433` on `32152d9b...`; no final candidate execution yet.
Unpersisted material reasoning: implementation of CP-1 pending.
Recovery entrypoint: live-read organizational master, this revision, current main and `release/0.7.4-independent-actions-watchdog`.
Exact next action after recovery: implement CP-1 and freeze final branch head.
Rotation blockers: active product fix wave.
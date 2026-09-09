---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 67
updated_at: 2026-09-09T16:39:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 69228325afb5beb7c247c23eec5f5285aae2311c
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.9 beta — GitHub Actions watchdog must keep recovering the same stalled chat instead of allowing only one restart forever, and watchdog polling must be visible in logs.

Release surface:
- preserve the independent GitHub Actions polling alarm and 10-minute API polling throttle;
- when a workflow marker remains stalled after a successful watchdog restart, allow another restart after a cooldown equal to that chat's configured `githubIdleMinutes`;
- a successful restart must not permanently suppress recovery merely because `githubLastRestartKey` still matches the same workflow run;
- active workflow runs continue to suppress restart;
- a new workflow run / renewed Actions activity continues to establish a fresh inactivity episode and clear stale restart suppression;
- GitHub API failures never create restart eligibility;
- emit one compact aggregate info log for each real watchdog poll cycle so continued checks are observable without per-repository log spam;
- preserve continuation counters, task guards, draftless continuation, `go` default, GitHub credential isolation/read-only API behavior, Telegram and chat URL rebind semantics;
- advance exact release metadata to 0.7.9 beta, freeze candidate, validate PR and exact merged main.

Definition of RELEASED:
- same stalled workflow can trigger restart #1, then after the configured idle cooldown trigger restart #2 and later retries while no Actions activity resumes;
- before the cooldown expires the same marker cannot cause a duplicate restart;
- real watchdog API poll cycles leave a compact heartbeat log;
- no rapid restart loop, no GitHub write API/workflow dispatch, and no reset of task/continuation safety counters;
- exact candidate/PR/main pass established release gates and reproducible package proof.

Mandatory release gates:
- [ ] repeated same-stall restart behavior passes focused/full tests;
- [ ] watchdog heartbeat logging passes runtime/static validation;
- [ ] exact frozen 0.7.9 candidate passes 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and canonical inner hashes reproduce frozen candidate.

Required release evidence: exact SHAs, focused/full tests, release/dependency workflow runs, artifact ID, inner ZIP/source-manifest SHA-256.

Known explicit exclusions: no GitHub write/dispatch support, no change to PAT precedence/storage, no stop/task guard changes, no draft-policy rollback, no Telegram/auth-grace/chat-URL changes, and unrelated draft PR #17 remains excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA before opening 0.7.9: `69228325afb5beb7c247c23eec5f5285aae2311c`.
Previous product basis: 0.7.8 merge `cfca9058f27e1ba960e4713f906bebec12f9dbc4`; the later `69228325...` commit is HQ state-only.
Critical-path basis ref: `main`.
Critical-path basis SHA: `69228325afb5beb7c247c23eec5f5285aae2311c`.
Canonical integration branch: `release/0.7.9-repeat-watchdog-restart` (to be created from the new HQ checkpoint).
Canonical PR / RC: NONE yet.
Relevant open PRs: draft #17 only, unrelated/excluded.
Relevant Issues: #14 is old temporary 0.5.4 payload evidence and not part of this release.
Relevant CI / workflows: `.github/workflows/extension-ci.yml` and `.github/workflows/docker-runner-policy.yml`.
Relevant release/deployment state: 0.7.8 terminal release evidence remains valid for its product basis; owner supplied new runtime evidence reopening development as 0.7.9.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 continuation/watchdog control for configured ChatGPT chats.

Architecture / major components relevant to this defect:
- `chrome-extension/background/service-worker-v2.js` owns the dedicated `chatpulse-github-actions-watchdog` alarm, serialized poll execution and restart dispatch;
- `chrome-extension/lib/model-v2.js` owns GitHub polling throttle/runtime and `githubWatchdogDecision`;
- `tests/chrome-extension/github-watchdog.test.mjs` encodes watchdog policy;
- `tests/chrome-extension/github-watchdog-runtime.test.mjs` statically audits service-worker watchdog guarantees.

Material live findings:
- the dedicated GitHub alarm is correctly configured as a periodic alarm at `GITHUB_POLL_INTERVAL_MINUTES = 10` when watched repositories exist;
- `shouldPollGithubRepository` throttles using `githubLastAttemptAt` and therefore should continue permitting real API polls every 10 minutes;
- successful poll cycles currently do not emit a heartbeat log, explaining why continued checking is invisible in the Control Center log;
- root cause of the one-restart bug is explicit: `githubWatchdogDecision` returns `already-restarted` whenever `githubLastRestartKey === restartKey`, with no expiry/cooldown check;
- `recordGithubRestart` already persists `githubLastRestartAt`, so the missing safe retry window can be implemented without schema migration;
- the existing test explicitly asserts `one inactivity marker can produce at most one successful restart`, confirming this was old policy rather than an intermittent alarm failure.

Build / packaging: deterministic Chrome MV3 ZIP.
Tests / validation: Node syntax/unit/integration/static audits, five audit cycles, loaded-extension Chromium E2E, reproducible package/provenance.
CI: release gate plus dependency runner policy.
Governance: live organizational HQ master v1.2; this file is the canonical project checkpoint.

## 4. Release Gates

### GATE-1 — Repeat recovery for the same stalled workflow
Status: UNSATISFIED
Evidence: root cause proven in live `githubWatchdogDecision` and current policy test.
Blocking items: implement cooldown-based retry and focused/full verification.

### GATE-2 — Observable watchdog polling
Status: UNSATISFIED
Evidence: current `performGithubWatchdog` logs errors/restarts but has no compact successful-poll heartbeat.
Blocking items: add aggregate heartbeat and runtime validation.

### GATE-3 — Frozen 0.7.9 candidate
Status: UNSATISFIED
Blocking items: GATE-1/2, 0.7.9 metadata, exact branch release proof.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Blocking items: GATE-3.

### GATE-5 — Exact post-merge main proof
Status: UNSATISFIED
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1 — Implement repeat watchdog recovery + poll heartbeat
Status: ACTIVE
Release gate: GATE-1, GATE-2.
Why critical: directly matches the owner's runtime evidence and proven one-shot policy defect.
Depends on: NONE.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: `model-v2.js`, `service-worker-v2.js`, focused watchdog tests only.
Acceptance condition: same `restartKey` is suppressed only for `githubIdleMinutes` after the last successful restart, becomes eligible again after that cooldown if still stalled, active/new-run/error protections remain intact, and each real watchdog poll cycle emits one aggregate heartbeat.
Evidence: owner report plus live source/test findings above.

### CP-2 — Advance 0.7.9 metadata and freeze candidate
Status: PENDING
Release gate: GATE-3.
Depends on: CP-1 accepted.
Blocks: CP-3.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance condition: exact branch candidate passes 5/5 audits, Chromium E2E, reproducible package/provenance and dependency policy where established.

### CP-3 — Canonical PR integration
Status: PENDING
Release gate: GATE-4.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance condition: exact validated head, green PR-context checks, no blocking reviews/threads, mergeable, expected-head merge.

### CP-4 — Exact post-merge main proof
Status: PENDING
Release gate: GATE-5.
Depends on: CP-3.
Execution plane: PROJECT_RUNNER.
Acceptance condition: exact-main release/dependency gates green and inner ZIP/source-manifest hashes exactly match frozen candidate.

## 6. Active Execution Registry

HQ: owns CP-1 patch, focused validation, metadata, release gates, PR/merge and exact-main proof.
Workers: NONE — current product patch is compact and overlapping; no useful independent write slice.
Codex: NONE — current defect and patch are fully bounded and directly understood.
Zero-model control: NONE.
CI/runtime: no 0.7.9 execution started yet.

## 7. Safe Parallel Work

NONE — product decision/test/service-worker edits overlap one release branch and should be serialized until CP-1 is stable.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — live main, critical path, open PR/Issue state, watchdog model/service-worker/tests and release surfaces identified.
Evidence Audit: PASS — owner runtime report is directly corroborated by the permanent `githubLastRestartKey === restartKey` suppression and its explicit unit test.
Release Alignment Audit: PASS — scope is limited to repeated watchdog recovery, poll observability and mandatory 0.7.9 release evidence.
Dependency & Ordering Audit: PASS — policy/runtime patch before metadata/freeze; freeze before PR; PR before exact-main proof.
Execution & Parallelism Audit: PASS — one HQ writer is sufficient; no duplicate worker/Codex task.
Adversarial Audit: PASS — covers same stale run, cooldown boundary, active run, new run, API failure, persisted 0.7.8 one-shot runtime upgrading in place, restart counter/task guard preservation, and heartbeat log volume.
Material findings and resolutions: retry cadence will use the existing configured `githubIdleMinutes`, not the 10-minute poll interval, preventing a tight restart loop while ensuring the same stall is retried.

## 10. Next Action

Exact next action: create `release/0.7.9-repeat-watchdog-restart` from this checkpoint, patch model/service-worker/tests, run focused/full validation, then advance release metadata only after CP-1 passes.
Executor: HQ.
Expected evidence: branch SHA/diff plus focused watchdog/full test results.
Acceptance condition: no GATE-1/2 satisfaction claim until live diff and tests prove retry cooldown + heartbeat semantics.

## 11. Last Material Revision

What changed: owner reported that 0.7.8 still performs only one workflow-stall restart and then appears silent; live source/test inspection proved the exact permanent one-shot suppression policy.
Why the critical path changed: 0.7.8 remains a completed historical release, but the new runtime evidence creates a new 0.7.9 defect-fix release.
Evidence causing the change: owner runtime observation, `githubWatchdogDecision`, `recordGithubRestart`, `shouldPollGithubRepository`, and current one-shot unit test.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: 0.7.9 release contract/root cause/audits prepared for persistence.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r67 + main at the resulting state commit; then create `release/0.7.9-repeat-watchdog-restart`.
Exact next action after recovery: implement CP-1 and validate focused/full tests.
Rotation blockers: NONE.

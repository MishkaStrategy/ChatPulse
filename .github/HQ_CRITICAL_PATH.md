---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 68
updated_at: 2026-09-09T16:50:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.9-repeat-watchdog-restart
basis_sha: 17d714b5f3a4e44fc8f45dccf8df98435ced7f59
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.9 beta — GitHub Actions watchdog must keep recovering the same stalled chat instead of allowing only one restart forever, and real watchdog polling must be visible in logs.

Release surface:
- keep the dedicated GitHub Actions alarm and 10-minute API polling throttle;
- for the same stalled workflow marker, successful restart starts a cooldown equal to configured `githubIdleMinutes`; if no Actions activity resumes, allow another restart at/after that cooldown and further retries on later cooldowns;
- no duplicate restart before cooldown expiry;
- active workflow runs suppress restart; new run/activity resets the inactivity episode; API failures never create restart eligibility;
- one compact aggregate info heartbeat per real due watchdog poll cycle, not per repository;
- preserve continuation/task counters and all 0.7.8 draftless/`go`/credential/Telegram/auth-grace/chat-URL behavior;
- release 0.7.9 with frozen candidate, canonical PR and exact-main proof.

Definition of RELEASED:
- same stale `restartKey` can cause restart #1 and later restart #2+ after `githubIdleMinutes` cooldown while still inactive;
- cooldown prevents a tight restart loop;
- due poll cycles are observable in logs;
- exact candidate/PR/main pass established release/provenance gates.

Mandatory release gates:
- [ ] repeated same-stall restart behavior passes focused/full validation;
- [ ] watchdog heartbeat logging passes runtime/static validation;
- [ ] exact frozen 0.7.9 candidate passes 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and canonical inner hashes reproduce frozen candidate.

Required release evidence: exact SHAs, focused/full tests, release/dependency runs, artifact ID and canonical inner hashes.
Known explicit exclusions: GitHub write/dispatch, PAT semantics, task/stop guards, draft-policy rollback, Telegram/auth-grace/chat-URL changes and unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
0.7.9 release branch: `release/0.7.9-repeat-watchdog-restart`.
Exact active source SHA: `17d714b5f3a4e44fc8f45dccf8df98435ced7f59`.
Previous product basis: 0.7.8 merge `cfca9058f27e1ba960e4713f906bebec12f9dbc4`; `69228325...` and 0.7.9 HQ commits are state-only outside product behavior.
Canonical PR / RC: NONE yet.
Relevant open PRs: draft #17 only, unrelated/excluded.
Relevant Issues: #14 old temporary 0.5.4 evidence, unrelated.
Relevant CI/workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 continuation/watchdog control for configured ChatGPT chats.

Material live findings:
- `service-worker-v2.js` has a distinct periodic `chatpulse-github-actions-watchdog` alarm and lossless shared serialization;
- `GITHUB_POLL_INTERVAL_MINUTES` is 10 and `shouldPollGithubRepository` throttles by `githubLastAttemptAt`, so the alarm/poll path itself is not intentionally one-shot;
- successful due polls currently leave no compact heartbeat log;
- proven root cause: `githubWatchdogDecision` permanently returns `already-restarted` whenever `githubLastRestartKey === restartKey`, with no expiry based on `githubLastRestartAt`;
- current unit test explicitly requires one inactivity marker to produce at most one successful restart;
- `recordGithubRestart` already stores `githubLastRestartAt`, so cooldown retry needs no schema migration.

Build/package/tests/CI: deterministic Chrome MV3 ZIP; Node focused/full/static audits; 5 audit cycles; loaded-extension Chromium E2E; reproducible package/provenance; dependency runner policy.

## 4. Release Gates

### GATE-1 — Repeat recovery for the same stalled workflow
Status: UNSATISFIED
Evidence: permanent restart-key suppression and old one-shot test proven live.
Blocking items: active bounded code patch + independent verification.

### GATE-2 — Observable watchdog polling
Status: UNSATISFIED
Evidence: due successful poll path has no aggregate heartbeat.
Blocking items: active bounded code patch + runtime/static verification.

### GATE-3 — Frozen 0.7.9 candidate
Status: UNSATISFIED
Blocking items: GATE-1/2 then metadata + exact release proof.

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
Why critical: directly matches owner runtime evidence and proven one-shot policy defect.
Depends on: NONE.
Blocks: CP-2.
Execution plane: CODEX.
Exact scope: `chrome-extension/lib/model-v2.js`, `chrome-extension/background/service-worker-v2.js`, `tests/chrome-extension/github-watchdog.test.mjs`, `tests/chrome-extension/github-watchdog-runtime.test.mjs` only.
Acceptance condition: same restart key is suppressed only for configured idle cooldown after last successful restart, becomes eligible again at/after cooldown if still stalled, active/new-run/error protections remain, one aggregate heartbeat is emitted for each due poll, all focused/full/static tests pass.
Evidence: exact Codex task `chatpulse-0-7-9-repeat-watchdog-restart-20260909T1648Z`.

### CP-2 — Advance 0.7.9 metadata and freeze candidate
Status: PENDING
Release gate: GATE-3.
Depends on: CP-1 independently accepted.
Blocks: CP-3.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact known metadata surfaces from live branch: manifest `0.7.8`, package `0.7.8-beta.1`, package script filenames `0.7.8`, release validator `0.7.8`, extension CI workflow name/concurrency/branch/artifact paths `0.7.8`.
Acceptance condition: exact candidate passes 5/5 audits, Chromium E2E, reproducible package/provenance and established dependency policy.

### CP-3 — Canonical PR integration
Status: PENDING
Release gate: GATE-4.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance condition: exact candidate PR, PR-context gates green, no blocking review/thread, mergeable, expected-head merge.

### CP-4 — Exact post-merge main proof
Status: PENDING
Release gate: GATE-5.
Depends on: CP-3.
Execution plane: PROJECT_RUNNER.
Acceptance condition: exact-main release/dependency gates green and canonical inner hashes equal frozen candidate.

## 6. Active Execution Registry

HQ: owns root-cause/release contract, terminal verification, metadata, CI, PR/merge and release proof.
Workers: NONE.
Codex:
- task `chatpulse-0-7-9-repeat-watchdog-restart-20260909T1648Z`;
- ai-control run `34378921418`;
- executor job `102558808068` IN_PROGRESS;
- exact source `release/0.7.9-repeat-watchdog-restart@17d714b5f3a4e44fc8f45dccf8df98435ced7f59`;
- delivery `existing_ref`; limits 4 files / 140 changed lines; no dependency/workflow/runner changes.
Zero-model control: coordinator job `102558624687` SUCCESS and exact claim persisted.
CI/runtime: model executor active; no 0.7.9 product CI yet.

## 7. Safe Parallel Work

Read-only CP-2 preparation completed: exact 0.7.8 metadata surfaces identified. No release-branch writes are safe while Codex owns the exact source ref.

## 8. Current Blockers

NONE. Active model execution is not BLOCKED.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — live repo/default branch, state, PR/Issue surface, watchdog model/service worker/tests and release metadata/workflows checked.
Evidence Audit: PASS — owner report is directly corroborated by permanent same-key suppression and explicit one-shot test.
Release Alignment Audit: PASS — only repeated recovery, poll observability and mandatory 0.7.9 release evidence.
Dependency & Ordering Audit: PASS — patch → independent acceptance → metadata/freeze → PR → exact-main proof.
Execution & Parallelism Audit: PASS — normal HQ local patch path is concretely unsupported/unavailable; one exact Codex writer owns the branch, no duplicate worker/task.
Adversarial Audit: PASS — same stale run, cooldown boundary, active run, new run, API failure, upgrade from persisted 0.7.8 state, counter/guard preservation, and log-spam bound covered.
Material finding: retry cadence is configured `githubIdleMinutes`, not 10-minute poll cadence, preventing rapid repeated sends.

## 10. Next Action

Exact next action: reconcile terminal state of executor job `102558808068`, task running/done/blocked path and release branch head. On DONE, independently inspect exact diff and verification evidence before satisfying GATE-1/2; on failure, repair only the evidence-proven cause without duplicate execution.
Executor: HQ.
Expected evidence: terminal task YAML/result, exact new branch SHA, bounded diff and test output.
Acceptance condition: do not mutate the release branch or advance metadata until CP-1 result is terminal and independently accepted.

## 11. Last Material Revision

What changed: after proving root cause, HQ created the 0.7.9 release branch and routed a bounded patch to Codex because safe partial local source editing is unavailable on the normal connector/runtime path.
Why the critical path changed: CP-1 is now actively executing rather than awaiting implementation.
Evidence causing the change: ai-control allowlist/schema, queued task commit `84218c7a64645e4ef44cf6804627ed2d4ba92663`, coordinator SUCCESS, executor job `102558808068` active.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: exact Codex claim started on immutable source SHA and CP-2 read-only metadata preparation completed.
Active external executions and exact refs: run `34378921418`, job `102558808068`, task ID above, source branch/SHA above.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r68 + task/run/job IDs + exact release branch SHA.
Exact next action after recovery: reconcile executor terminal state, then independently accept/reject CP-1 before any metadata write.
Rotation blockers: NONE.

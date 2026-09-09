---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 69
updated_at: 2026-09-09T17:12:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.9-repeat-watchdog-restart
basis_sha: 17d714b5f3a4e44fc8f45dccf8df98435ced7f59
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.9 beta — GitHub Actions watchdog must repeatedly recover the same stalled chat after a configured cooldown, and each real due watchdog poll cycle must be visible in logs.

Release surface:
- retain dedicated GitHub Actions alarm and 10-minute API polling throttle;
- same stalled workflow marker: first restart after inactivity threshold, later restarts after cooldown equal to `githubIdleMinutes` from the most recent successful restart;
- no duplicate restart before cooldown expiry;
- active runs suppress restart; new run/activity resets the inactivity episode; API failures never create restart eligibility;
- one compact aggregate info heartbeat per real due watchdog poll cycle, not one heartbeat per repository;
- preserve continuation/task counters and existing 0.7.8 draftless `go`, credentials, Telegram, auth-grace and chat-URL behavior;
- release through frozen candidate, canonical PR and exact-main proof.

Definition of RELEASED:
- same stale restartKey can produce restart #1 and restart #2+ at cooldown boundaries while inactivity continues;
- cooldown prevents tight loops;
- real due polls are observable;
- exact candidate/PR/main pass established release/provenance gates.

Mandatory release gates:
- [ ] repeated same-stall restart behavior passes focused/full validation;
- [ ] watchdog heartbeat logging passes runtime/static validation;
- [ ] frozen 0.7.9 candidate passes 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and canonical inner hashes reproduce frozen candidate.

Required release evidence: exact SHAs, focused/full tests, release/dependency runs, artifact ID and canonical inner hashes.
Known explicit exclusions: GitHub write/dispatch, PAT semantics, task/stop guards, draft-policy rollback, Telegram/auth-grace/chat-URL changes and unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
0.7.9 release branch: `release/0.7.9-repeat-watchdog-restart`.
Exact product source SHA: `17d714b5f3a4e44fc8f45dccf8df98435ced7f59`.
Previous product basis: 0.7.8 merge `cfca9058f27e1ba960e4713f906bebec12f9dbc4`; later HQ commits on main are state-only.
Canonical PR / RC: NONE yet.
Relevant open PRs: draft #17 only, unrelated/excluded.
Relevant CI/workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 continuation/watchdog control for configured ChatGPT chats.

Material live findings:
- dedicated periodic GitHub watchdog alarm exists and polling itself is not intentionally one-shot;
- `githubWatchdogDecision` permanently suppresses a restart when `githubLastRestartKey === restartKey`, ignoring `githubLastRestartAt`;
- existing unit test explicitly encodes that defective one-shot policy;
- `recordGithubRestart` already persists both restart key and timestamp, so cooldown retry requires no schema migration;
- due successful poll cycles currently have no compact aggregate heartbeat.

Execution recovery finding:
- original four-file Codex task `chatpulse-0-7-9-repeat-watchdog-restart-20260909T1648Z`, run `34378921418`, job `102558808068`, did not clone/edit/commit ChatPulse; decoded logs show repeated task rereads, context compactions and unsupported tool calls;
- step 9 wrapper reported success but terminal persistence failed because the model produced no done/blocked destination;
- release branch remained exactly `17d714b5...`, proving zero product mutation;
- HQ recovered the orphan as BLOCKED with reason `CODEX_EXECUTOR_TOOL_LOOP_NO_PRODUCT_MUTATION` and removed its running claim.

Build/package/tests/CI: deterministic Chrome MV3 ZIP; Node focused/full/static audits; 5 audit cycles; loaded-extension Chromium E2E; reproducible package/provenance; dependency runner policy.

## 4. Release Gates

### GATE-1 — Repeat recovery for the same stalled workflow
Status: UNSATISFIED
Evidence: root cause proven; reduced two-file cooldown patch queued.
Blocking items: exact patch + independent verification.

### GATE-2 — Observable watchdog polling
Status: UNSATISFIED
Evidence: current due poll path lacks aggregate heartbeat.
Blocking items: cooldown slice must land first, then separate heartbeat slice on its exact resulting SHA.

### GATE-3 — Frozen 0.7.9 candidate
Status: UNSATISFIED
Blocking items: GATE-1/2 then metadata + release proof.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Blocking items: GATE-3.

### GATE-5 — Exact post-merge main proof
Status: UNSATISFIED
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1A — Implement same-stall restart cooldown
Status: ACTIVE
Release gate: GATE-1.
Execution plane: CODEX.
Exact scope: `chrome-extension/lib/model-v2.js` and `tests/chrome-extension/github-watchdog.test.mjs` only.
Task: `chatpulse-0-7-9-watchdog-cooldown-20260909T1702Z`.
Exact formula: same restartKey is `already-restarted` only while `now - githubLastRestartAt < thresholdMs`; at/after threshold it is restart-eligible again. Boundary and repeated-retry tests required.
Acceptance condition: exact two-file bounded diff, focused/full tests green, no unrelated changes.

### CP-1B — Add one aggregate heartbeat per real due GitHub poll
Status: PENDING
Release gate: GATE-2.
Depends on: CP-1A exact accepted commit.
Execution plane: CODEX or deterministic HQ fallback based on CP-1A evidence.
Exact scope: service-worker runtime + focused runtime test only.
Acceptance condition: exactly one compact heartbeat per touched/due poll cycle; skipped not-due cycles do not log; no secret/write semantics.

### CP-2 — Advance 0.7.9 metadata and freeze candidate
Status: PENDING
Release gate: GATE-3.
Depends on: CP-1A/1B accepted.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Known metadata surfaces: manifest, package.json, package script filenames, release validator, extension CI workflow release strings/branch/artifact paths.
Acceptance condition: 5/5 audits, Chromium E2E, reproducible package/provenance and established dependency policy all green on exact frozen head.

### CP-3 — Canonical PR integration
Status: PENDING
Release gate: GATE-4.
Depends on: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance condition: exact candidate PR, PR-context gates green, no blocking review/thread, mergeable, expected-head merge.

### CP-4 — Exact post-merge main proof
Status: PENDING
Release gate: GATE-5.
Depends on: CP-3.
Execution plane: PROJECT_RUNNER.
Acceptance condition: exact-main release/dependency gates green and canonical inner hashes equal frozen candidate.

## 6. Active Execution Registry

HQ: owns terminal verification, heartbeat follow-up, metadata, CI, PR/merge and release proof.
Workers: NONE.
Codex:
- queued task `chatpulse-0-7-9-watchdog-cooldown-20260909T1702Z`;
- exact source `release/0.7.9-repeat-watchdog-restart@17d714b5f3a4e44fc8f45dccf8df98435ced7f59`;
- limits 2 files / 80 changed lines; explicit implementation formula; no repository search/workflow/dependency changes;
- ai-control run `34381409177` coordinator active at checkpoint time.
Recovered prior Codex attempt: BLOCKED, zero product mutation.
Zero-model control: coordinator for reduced task active.
CI/runtime: no product CI yet.

## 7. Safe Parallel Work

NONE — CP-1B must use the exact accepted CP-1A resulting SHA; release metadata must wait for both behavior slices.

## 8. Current Blockers

NONE. A reduced execution route is active; prior model/tool-loop is recovered evidence, not a project blocker.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — owner runtime report, source policy, old test and failed-executor logs align.
Release Alignment Audit: PASS — only repeated recovery, poll observability and mandatory release proof.
Dependency & Ordering Audit: PASS — cooldown slice → heartbeat slice → metadata/freeze → PR → exact-main.
Execution & Parallelism Audit: PASS — broad failed attempt terminalized; reduced exact writer only; no duplicate execution.
Adversarial Audit: PASS — cooldown boundary, repeated retries, active run, new run/activity, API error, persisted 0.7.8 state, log-spam bound and safety-state preservation are explicitly covered.

## 10. Next Action

Exact next action: reconcile coordinator/executor for task `chatpulse-0-7-9-watchdog-cooldown-20260909T1702Z`; on DONE independently inspect exact branch diff and tests before creating CP-1B against the resulting SHA.
Executor: HQ.
Expected evidence: terminal task result, exact branch commit and two-file diff/test output.
Acceptance condition: no CP-1B or metadata write before CP-1A exact product result is independently accepted.

## 11. Last Material Revision

What changed: original broad Codex execution was proven to have zero product mutation, recovered as BLOCKED, and replaced with a two-file deterministic cooldown slice.
Why the critical path changed: reduced scope and explicit implementation formula materially change execution route/evidence and avoid repeating the failed broad task.
Evidence causing the change: job `102558808068` decoded logs, unchanged release SHA, ai-control recovery commits `3952b1773a787014d131a66285173893e89b0d7b` and `af83f23bc2399aa2519fe8819ec2fa4a7da14523`, reduced task queue commit `2be1bc37951da3ef6e7b203c88d8cdaa9581a4c8`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: failed broad claim recovered and reduced cooldown task queued on exact unchanged product SHA.
Active external executions and exact refs: ai-control run `34381409177`; task `chatpulse-0-7-9-watchdog-cooldown-20260909T1702Z`; release branch exact source `17d714b5...`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r69 + reduced task/run ID + exact release branch SHA.
Exact next action after recovery: reconcile reduced task terminal state, independently inspect result, then route CP-1B on the accepted new SHA.
Rotation blockers: NONE.

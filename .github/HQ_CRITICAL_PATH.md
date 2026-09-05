---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 35
updated_at: 2026-09-05T15:28:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: NOT_READY
basis_ref: main
basis_sha: 651e83dc2ea6f210494516276aa424d45a42a878
---

# HQ Critical Path

## 1. Current Release Contract
Release target: ChatPulse 0.7.4 beta — independent GitHub Actions scheduling, per-chat GitHub-only resume mode, lossless serialization of simultaneous scheduler triggers, and a safe post-open ChatGPT authentication warm-up grace.

Definition of RELEASED: ordinary and GitHub alarms neither reset nor suppress each other; GitHub-only chats have no automatic ordinary interval check; concurrent triggers queue and execute with their own source/parameters; after ChatPulse creates/replaces/reloads a ChatGPT document, a transient unauthenticated snapshot during the first 60 seconds is treated as page warm-up rather than a durable logout; watchdog retry after the grace must revalidate the current GitHub Actions state before any send; master Stop, active-run blocking, fail-closed API behavior, token isolation, draft/active-tab safety and at-most-once dispatch remain intact; final frozen branch, PR merge-tree and main gates pass.

Mandatory gates:
- [x] independent ordinary/GitHub alarm lifecycle + per-chat GitHub-only mode;
- [x] more than two independent workflow inactivity episodes can restart;
- [x] concurrent scheduler triggers are serialized without losing source/parameters on current branch candidate;
- [ ] 60-second post-open authentication grace with bounded retry and fresh GitHub revalidation;
- [ ] existing safety regressions remain green;
- [ ] final branch/PR/main release evidence all green on the new exact candidate.

Required evidence: final branch/PR/main SHAs, workflow IDs, alarm-starvation and simultaneous-trigger regressions, post-open auth-grace regression, test counts, Chromium E2E, reproducible package/source-manifest SHA-256.

Known exclusions: normal GitHub polling remains approximately 10 minutes; one bounded extra GitHub read is permitted only for the explicit post-open grace retry so a restart is never sent from stale Actions state. Inactivity N semantics, 20-minute stuck-generation threshold, active-tab destructive-recovery policy, credential boundary and unrelated draft PR #17 remain unchanged.

## 2. Repository Basis
Default branch: main.
Default branch observed SHA: `651e83dc2ea6f210494516276aa424d45a42a878` before this r35 state commit.
Superseded product candidate on main: `32152d9b99c94f8137adda85cda8cb23c5549e45`.
Canonical branch: `release/0.7.4-independent-actions-watchdog`.
Current branch head before auth-grace change: `b2c66ec80b70001894008508f2a7e8f45e1408e9` — superseded as final release candidate by this owner scope.
Canonical PR: #28, open; current head `b2c66ec80b70001894008508f2a7e8f45e1408e9`; must be updated and fully revalidated after auth-grace patch.
Relevant previous merged PR: #27 is superseded intermediate 0.7.4 evidence.
Relevant workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.

## 3. Repository Scan Summary
Project: local Chrome MV3 ChatGPT task runner. Build: deterministic package + Node validation. Tests: deterministic extension suite plus loaded Chromium E2E.

Material findings:
1. Original watchdog stoppage had two scheduler starvation paths: dual-alarm recreation and drop-on-active trigger identity. Both are addressed on the current 0.7.4 branch.
2. `content-script.js` reports `authenticated: false` until composer/messages/profile navigation elements hydrate. A fresh ChatGPT document can therefore be temporarily classified as `not-authenticated` even when the Chrome profile is actually signed in.
3. `waitForHydratedSnapshot()` currently accepts an unauthenticated page as hydrated immediately, so a newly created/replaced tab can reach watchdog `decide()` too early and log `restart отложен: в профиле Chrome не выполнен вход`.

## 4. Release Gates
### GATE-1 — Independent alarms + GitHub-only
Status: SATISFIED
Evidence: implemented and regression-covered in the 0.7.4 branch lineage.
Blocking: NONE.

### GATE-2 — Lossless trigger serialization
Status: SATISFIED
Evidence: branch head `b2c66ec8...` contains rejection-safe promise-tail serialization plus simultaneous-trigger regression.
Blocking: final combined revalidation only.

### GATE-3 — Post-open authentication grace
Status: UNSATISFIED
Evidence: fresh unauthenticated snapshot currently becomes `not-authenticated` immediately; hydration helper explicitly permits `!authenticated` as ready.
Blocking: 60-second warm-up classification, one-shot retry scheduling, fresh GitHub state revalidation before send, deterministic regression.

### GATE-4 — Final frozen branch
Status: UNSATISFIED
Blocking: GATE-3 plus combined full release gate.

### GATE-5 — Final PR merge-tree
Status: UNSATISFIED
Blocking: GATE-4 and updated PR #28 exact merge-ref evidence.

### GATE-6 — Final main
Status: UNSATISFIED
Blocking: GATE-5.

## 5. Current Critical Path
### CP-1 — Add safe 60-second post-open auth grace
Status: ACTIVE
Release gate: GATE-3
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: service-worker restart flow, hydration/auth warm-up detection, one-shot retry alarm/routing, current-Actions revalidation, deterministic tests/static guard, changelog/PR description if needed.
Acceptance: transient unauthenticated snapshots from a document younger than 60 seconds never produce the durable logout path; retry occurs no earlier than the 60-second document-age boundary; the retry re-fetches the watched repository before restart eligibility is evaluated; truly unauthenticated pages older than the grace still fail safely; no repeated grace loop for the same restart episode.

### CP-2 — Final frozen branch validation
Status: PENDING
Depends: CP-1.
Acceptance: exact branch head passes five deterministic audit cycles, Chromium E2E, reproducible package/provenance; prior scheduler/credential/recovery safety remains green.

### CP-3 — Update and validate PR #28 merge-tree
Status: PENDING
Depends: CP-2.
Acceptance: exact PR merge-ref + dependency policy + reviews/threads + mergeability green; package hashes match branch.

### CP-4 — Merge exact head + final main validation
Status: PENDING
Depends: CP-3.
Acceptance: exact main product SHA fully green; package hashes match branch/PR; final HQ checkpoint persisted.

## 6. Active Execution Registry
HQ: CP-1 canonical writer/integrator.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: current PR #28 evidence is superseded until new head is produced.

## 7. Safe Parallel Work
NONE — grace timing, watchdog revalidation, alarm routing and restart idempotency are tightly coupled to the same service-worker state contract.

## 8. Current Blockers
NONE.

## 9. Critical Path Audits
Repository Coverage Audit: PASS — content authentication snapshot, hydration/recovery, watchdog restart, alarm routing, tests and release surfaces are in scope.
Evidence Audit: PASS — exact false-auth path is visible in live source and matches the owner-observed log string.
Release Alignment Audit: PASS — addition is limited to the reported post-open race and required safe retry behavior.
Dependency & Ordering Audit: PASS — grace implementation precedes combined branch validation, then PR merge-tree, then main.
Execution & Parallelism Audit: PASS — one canonical writer avoids race/conflict on service-worker logic.
Adversarial Audit: PASS — no blind send after waiting; fresh GitHub revalidation is mandatory so new active Actions cannot be missed during the grace; truly logged-out pages still fail closed; master Stop/controlRevision/session guards remain authoritative.

## 10. Next Action
Implement CP-1 on `release/0.7.4-independent-actions-watchdog`, update PR #28 head, then freeze and validate the new exact candidate.

## 11. Last Material Revision
Owner reported frequent false `restart отложен: в профиле Chrome не выполнен вход` immediately after ChatPulse opens a new ChatGPT tab and requested at least one minute of post-open timing. Live inspection confirmed a hydration race: unauthenticated young documents are accepted as hydrated and passed to restart decision too early. The 0.7.4 contract now includes a 60-second warm-up grace and fresh GitHub revalidation before any delayed retry send.

## 12. Chat Rotation Checkpoint
Safe to rotate: NO.
Last completed atomic action: persisted owner-auth-grace scope and verified exact race in content/service-worker source.
Active external executions and exact refs: PR #28 open; head `b2c66ec80b70001894008508f2a7e8f45e1408e9` is superseded as final candidate.
Unpersisted material reasoning: CP-1 implementation pending.
Recovery entrypoint: live master + r35 + current main + PR #28 + canonical branch.
Exact next action after recovery: implement CP-1 and run deterministic regression/full branch gate.
Rotation blockers: active 0.7.4 release fix wave.

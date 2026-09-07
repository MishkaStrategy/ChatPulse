---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 59
updated_at: 2026-09-07T12:26:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.7-edit-chat-url
basis_sha: 0fcb78f1149257bb7ea390e6d28e9d85a59e179c
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.7 beta — edit/rebind the concrete ChatGPT conversation URL of an already configured ChatPulse chat after recreation without configuring that ChatPulse chat again.

Release surface: safe chat-URL identity mutation, service-worker persistence, Control Center editor, focused safety tests, 0.7.7 release metadata, CI and reproducible package/provenance.

Definition of RELEASED: an existing configured chat can replace its concrete ChatGPT conversation URL while preserving ChatPulse chat ID, profile/configuration, task guards/counters and GitHub-watch state. Actual URL change clears only stale page-bound runtime state. Invalid/non-chat and duplicate URLs are rejected. Persistence is background-mediated.

Mandatory release gates:
- [ ] safe atomic URL mutation + runtime reset implemented/tested;
- [ ] Control Center URL editing preserves existing configuration;
- [ ] frozen 0.7.7 branch passes 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and hashes reproduce frozen candidate.

Required release evidence: exact refs/SHAs, focused tests, audits, Chromium E2E, reproducible hashes/artifact, PR/merge and exact-main proof.

Known explicit exclusions: no content migration/cloning; no task-limit reset; no GitHub credential semantic changes unless owner explicitly folds the newly reported credential-selection issue into this release; no GitHub write/workflow dispatch; no unrelated watchdog/Telegram/auth-grace changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA before this state write: `8c9b2ed6cde3cda4d019de785d4babad8ee953c2`.
Current release basis ref: `release/0.7.7-edit-chat-url`.
Current release basis SHA: `0fcb78f1149257bb7ea390e6d28e9d85a59e179c`.
Canonical integration branch: `release/0.7.7-edit-chat-url`.
Canonical PR: NONE yet.
Relevant CI/control execution: ai-control run `34117489614` attempt 2; prior executor job `101732751791` is terminal/unproductive and left target branch unchanged.
Relevant release state: 0.7.6 DONE; 0.7.7 CP-1 remains unimplemented on the release branch.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 local ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.
Architecture: `lib/model-v2.js` chat state; `background/service-worker-v2.js` mutations/persistence; `background/github-actions.js` GitHub credential resolution/fetching; `options/github-token-ui.js` credential UI; `options/options.html` and `options.js` Control Center.
Build/package: Node validation plus deterministic Python ZIP/source manifest.
Tests/CI: extension tests, static validator, five audit cycles, Chromium E2E, reproducible packaging and dependency policy.
Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` is WORKING_REPOSITORY; `.github`/`ai-control` are control exceptions.

Material findings:
- Owner explicitly rejected the prior HQ conclusion that the repository link itself was wrong. That earlier diagnosis is withdrawn.
- The target private repository Actions endpoint is live and returns workflow runs under authenticated access, so the repository/Actions service itself is healthy.
- In shipped 0.7.6 credential resolution, `loadGithubToken(repository)` returns `store.tokens[key] || store.globalToken || null`. Therefore any repository-specific token saved now or retained from legacy v1 overrides the shared/global PAT.
- The global-PAT test path is different: `verifyGlobalGithubTokenAccess` calls `loadGlobalGithubToken()` directly, while repository-row tests and watchdog fetching can resolve through the repository-specific override first. Thus a valid global PAT can coexist with a watchdog HTTP 404 if an obsolete or under-scoped repo-specific token shadows it.
- GitHub intentionally uses HTTP 404 for private resources when authentication lacks access, so a 404 with a correct private repository does not distinguish nonexistent repo from wrong credential source/repository authorization.
- HQ cannot inspect the user's extension-local credential store from GitHub. Exact confirmation requires local UI evidence: whether the row reports an individual token override, or whether the global-PAT test succeeds for the exact same repository while row/watchdog access fails.
- 0.7.7 executor job `101732751791` did not mutate the target release branch. The release branch remains exactly `0fcb78f...`.

## 4. Release Gates

### GATE-1 — Safe chat URL identity mutation
Status: UNSATISFIED
Evidence: failed prior executor left release branch unchanged.
Blocking items: implementation + independent tests.

### GATE-2 — Control Center URL editing
Status: UNSATISFIED
Evidence: no product diff yet.
Blocking items: GATE-1 implementation.

### GATE-3 — Frozen 0.7.7 candidate
Status: UNSATISFIED
Blocking items: GATE-1/GATE-2 + metadata/branch CI.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Blocking items: GATE-3.

### GATE-5 — Post-merge main proof
Status: UNSATISFIED
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1 — Implement editable chat URL with safe identity mutation
Status: ACTIVE
Release gate: GATE-1 + GATE-2.
Why critical: requested feature and identity-safety boundary.
Depends on: none.
Blocks: CP-2.
Execution plane: reroute required; prior CODEX attempt is terminal/unproductive.
Exact scope: model, service worker, options UI and focused tests; no credential/watchdog semantic changes unless release contract is explicitly amended.
Acceptance condition: same chat identity/configuration; safe page-runtime reset only on actual URL change; invalid/duplicate rejection; active-check fail closed; unchanged URL no reset; background-only persistence; tests green.
Evidence: release branch unchanged at `0fcb78f...`; failed executor run/job `34117489614`/`101732751791`.

### CP-2 — Advance 0.7.7 release metadata and validate frozen branch
Status: PENDING
Depends on: CP-1.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance: exact branch 5/5 audits + Chromium E2E + reproducible artifact/provenance.

### CP-3 — Validate and merge canonical PR
Status: PENDING
Depends on: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance: exact validated head merge after checks/reviews/mergeability pass.

### CP-4 — Validate exact post-merge main
Status: PENDING
Depends on: CP-3.
Execution plane: PROJECT_RUNNER.
Acceptance: exact-main release/dependency gates green and package hashes match frozen candidate.

## 6. Active Execution Registry

HQ: release owner; CP-1 rerouting plus diagnosis of owner-reported 0.7.6 credential-selection behavior.
Workers: NONE.
Codex: prior task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z` remains orphaned-running in ai-control after terminal failed executor; it is not an active product writer.
Zero-model control: no current product mutation.
CI/runtime: no ChatPulse product CI active.

## 7. Safe Parallel Work

Credential-source diagnosis is read-only and independent. Product write work remains serialized on CP-1 until the orphaned claim is safely terminalized/superseded.

## 8. Current Blockers

No project-level blocker. Exact root cause of the owner's local 404 cannot be proven remotely because extension-local credential state is intentionally inaccessible; likely causes are repository-specific override shadowing the shared PAT or the shared PAT lacking authorization to the exact private repository.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — shipped credential resolution, UI paths, private Actions endpoint and owner correction live-reviewed.
Release Alignment Audit: PASS — 0.7.7 remains URL-edit release unless owner explicitly broadens credential semantics.
Dependency & Ordering Audit: PASS.
Execution & Parallelism Audit: PASS — no active ChatPulse product writer.
Adversarial Audit: PASS — prior false repo-slug inference is removed; correct private repo + HTTP 404 is treated as authentication/credential-source ambiguous until local evidence resolves it.

## 10. Next Action

Exact next action: for the owner-reported 404, use the existing global-PAT test against the exact repository and compare it to the per-chat row/watchdog result. If global test succeeds while row/watchdog fails, remove the stored repository-specific override or patch 0.7.7 to make credential source explicit. Separately, safely reroute CP-1 implementation.
Executor: HQ + owner only for extension-local credential-state observation.
Expected evidence: global-test result and row credential-source status; exact product commit/diff for CP-1.
Acceptance: no further 404 diagnosis claim without credential-source evidence.

## 11. Last Material Revision

What changed: withdrew the incorrect repository-link diagnosis and replaced it with code-backed credential-resolution analysis.
Why the critical path changed: owner feedback invalidated prior inference; shipped 0.7.6 code shows repo-specific credentials silently outrank the shared PAT.
Evidence: owner correction; `github-actions.js` credential precedence; `github-token-ui.js` separate global-vs-row test paths; live private Actions endpoint.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: corrected the PAT 404 diagnosis and persisted r59.
Active external executions and exact refs: NONE for ChatPulse product code; orphaned ai-control task remains persisted under running.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r59 + release branch `release/0.7.7-edit-chat-url@0fcb78f...` + shipped 0.7.6 credential code.
Exact next action after recovery: reconcile local credential-source evidence for 404 and reroute CP-1 safely.
Rotation blockers: NONE.

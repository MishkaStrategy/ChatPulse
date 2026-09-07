---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 62
updated_at: 2026-09-07T12:59:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.7-edit-chat-url
basis_sha: e73d698924bcdae76995593f38183e91a4c98cab
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.7 beta — editable/rebindable saved ChatGPT conversation URL plus transparent shared-GitHub-PAT verification across every configured watchdog repository.

Release surface: safe URL identity mutation/background persistence/Control Center editor; shared PAT multi-repository verification and credential-source diagnostics; 0.7.7 metadata; full audits; Chromium E2E; reproducible package/provenance; canonical PR/merge; exact-main proof.

Definition of RELEASED:
- an existing ChatPulse chat may replace its concrete ChatGPT URL while preserving identity/profile/task guards/counters/GitHub-watch state and clearing only stale page-bound runtime;
- invalid/duplicate URLs are rejected and unchanged normalized URLs are no-op;
- shared PAT remains one protected extension-local credential and can be tested against every unique configured watchdog repository; UI reports per-repository shared-PAT result and actual watchdog source (shared vs repository override);
- no secrets enter state/export/runtime messages/logs and GitHub access remains read-only;
- exact frozen candidate and exact merged main pass all mandatory release evidence.

Mandatory release gates:
- [ ] URL mutation/editor implementation independently passes focused/full validation;
- [ ] shared PAT multi-repository diagnostics independently pass focused/full validation;
- [ ] exact frozen 0.7.7 head passes 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and inner package hashes reproduce frozen candidate.

Known exclusions: no content migration/cloning; no task-limit reset; no GitHub write/workflow dispatch; no automatic credential generation/escalation; no unrelated Telegram/auth-grace changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: main.
Critical-path basis ref: `release/0.7.7-edit-chat-url`.
Frozen-candidate validation head: `e73d698924bcdae76995593f38183e91a4c98cab`.
Canonical integration branch: `release/0.7.7-edit-chat-url`.
Canonical PR: NONE yet.
Relevant release run: `34124761845`, event push, exact head `e73d698...`, IN_PROGRESS.
Relevant jobs: five `Full extension audit` matrix jobs plus `Chromium MV3 browser E2E — GitHub watchdog` currently executing; package job waits on them.

## 3. Repository Scan Summary

Relevant product architecture: `lib/chat-url-mutation.js`; `background/service-worker-v2.js`; `options/chat-url-ui.js`; `options/github-token-ui.js`; existing read-only per-repository GitHub watchdog.

Material findings:
- both Codex attempts were terminal/unproductive tool-loop failures and produced zero target mutation; both claims were safely terminalized in ai-control. No Codex execution remains active.
- HQ deterministic fallback wired `UPDATE_CHAT_URL` into the service worker from exact blob `3563dbe...`; resulting commit `027eab1d...` was independently compared and changed exactly one file, +15/-1.
- release metadata is now 0.7.7: manifest `0.7.7 beta`; package `0.7.7-beta.1`; syntax gate covers new modules; release validator/package names/workflow are all 0.7.7.
- workflow branch filter now includes `release/0.7.7-edit-chat-url`, producing exact run `34124761845` at head `e73d698...`.

## 4. Release Gates

### GATE-1 — Safe chat URL rebind
Status: UNSATISFIED
Evidence: implementation complete through `027eab1d...`; pure helper/UI/focused tests present.
Blocking items: independent exact-candidate CI validation.

### GATE-2 — Shared PAT multi-repository verification/diagnostics
Status: UNSATISFIED
Evidence: implementation/test changes present on exact candidate; UI enumerates unique enabled watchdog repos and reports shared-PAT result/runtime credential source.
Blocking items: independent exact-candidate CI validation.

### GATE-3 — Frozen 0.7.7 candidate
Status: UNSATISFIED
Evidence: exact candidate `e73d698...`; release run `34124761845` IN_PROGRESS.
Blocking items: 5/5 audit + Chromium E2E + reproducible package/provenance success and hashes/artifact evidence.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Blocking items: GATE-3.

### GATE-5 — Post-merge exact-main proof
Status: UNSATISFIED
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1A — Editable chat URL
Status: VERIFYING
Release gate: GATE-1.
Execution plane: HQ_DIRECT implementation; PROJECT_RUNNER validation.
Acceptance: focused/full tests prove preserve/reset/no-op/duplicate/invalid/active-check/background-only semantics.
Evidence: deterministic service-worker commit `027eab1d...` exact one-file +15/-1; current CI run `34124761845`.

### CP-1B — Shared PAT all-repository verification
Status: VERIFYING
Release gate: GATE-2.
Execution plane: HQ_DIRECT implementation; PROJECT_RUNNER validation.
Acceptance: all configured unique repos tested; per-repo result/runtime source visible; no credential leakage; override compatibility retained.
Evidence: exact implementation/test commits included in candidate `e73d698...`; current CI run `34124761845`.

### CP-2 — Validate/freeze 0.7.7 candidate
Status: ACTIVE
Release gate: GATE-3.
Depends on: CP-1A + CP-1B validation.
Execution plane: PROJECT_RUNNER.
Acceptance: 5/5 audits + Chromium E2E + reproducible artifact/provenance all SUCCESS on exact `e73d698...`.

### CP-3 — Canonical PR integration
Status: PENDING
Depends on: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance: exact validated head PR, checks/reviews/threads/mergeability pass, expected-head merge.

### CP-4 — Exact post-merge main proof
Status: PENDING
Depends on: CP-3.
Execution plane: PROJECT_RUNNER.
Acceptance: exact-main release/dependency gates green and canonical inner hashes match frozen candidate.

## 6. Active Execution Registry

HQ: release owner; no product write while frozen-candidate run is active.
Workers: NONE.
Codex: NONE — both failed claims terminalized; no active writer.
Zero-model control: NONE active for ChatPulse.
CI/runtime: ChatPulse release run `34124761845` on exact `e73d698...` IN_PROGRESS.

## 7. Safe Parallel Work

NONE — candidate is frozen for validation. Any product write would invalidate exact CI evidence.

## 8. Current Blockers

NONE. Active CI is external execution, not a blocker.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — exact product diff, metadata refs, workflow/head/run/jobs live-verified.
Release Alignment Audit: PASS — only owner-requested URL-rebind and shared-PAT diagnostics are in scope.
Dependency & Ordering Audit: PASS — validation precedes PR/merge/main proof.
Execution & Parallelism Audit: PASS — candidate frozen, no competing writer.
Adversarial Audit: PASS — stale page state, duplicate URL, active-check race, override shadowing, misleading single-repo PAT verification and secret leakage are covered by implementation/tests/release gates.

## 10. Next Action

Exact next action: reconcile terminal jobs of run `34124761845`. On any failure inspect exact job log and repair only evidence-proven cause, producing a new candidate SHA. On all green, capture artifact ID, canonical inner ZIP/source-manifest hashes and freeze `e73d698...`, then open canonical PR.
Executor: HQ.
Expected evidence: terminal 5/5 audits, Chromium E2E, package/provenance artifact/hashes.
Acceptance: no GATE-1/2/3 satisfaction claim until exact run evidence is green.

## 11. Last Material Revision

What changed: completed deterministic URL service-worker wiring, terminalized failed Codex retry, advanced all release metadata to 0.7.7 and started exact frozen-candidate validation run.
Why: implementation is now complete; release evidence is the critical path.
Evidence: `027eab1d...`, metadata commits through `e73d698...`, run `34124761845`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: exact candidate `e73d698...` launched release validation and r62 persisted.
Active external executions and exact refs: ChatPulse run `34124761845` at `e73d698...`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r62 + branch `release/0.7.7-edit-chat-url@e73d698...` + run `34124761845`.
Exact next action after recovery: reconcile terminal run/jobs/artifact, repair only exact failures or freeze candidate and proceed PR.
Rotation blockers: NONE.

---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 58
updated_at: 2026-09-07T12:10:00Z
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

Known explicit exclusions: no content migration/cloning; no task-limit reset; no GitHub credential semantic changes; no GitHub write/workflow dispatch; no unrelated watchdog/Telegram/auth-grace changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Current release basis ref: `release/0.7.7-edit-chat-url`.
Current release basis SHA: `0fcb78f1149257bb7ea390e6d28e9d85a59e179c`.
Canonical integration branch: `release/0.7.7-edit-chat-url`.
Canonical PR: NONE yet.
Relevant CI/control execution: ai-control run `34117489614` attempt 2; coordinator succeeded; executor job `101732751791` completed with model step success but terminal persistence failure.
Relevant release state: 0.7.6 DONE; 0.7.7 CP-1 remains unimplemented on the release branch.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 local ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.
Architecture: `lib/model-v2.js` chat state; `background/service-worker-v2.js` mutations/persistence; `options/options.html` and `options.js` Control Center.
Build/package: Node validation plus deterministic Python ZIP/source manifest.
Tests/CI: extension tests, static validator, five audit cycles, Chromium E2E, reproducible packaging and dependency policy.
Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` is WORKING_REPOSITORY; `.github`/`ai-control` are control exceptions.

Material findings:
- Owner runtime report `MishkaStrategy/ModuleStrategy` returning HTTP 404 is configuration data, not evidence of a shared-PAT defect. Live GitHub proves `MishkaStrategy/ModuleStrategy` does not exist, while private repository `MishkaStrategy/Module-Strategy` exists. Correct repository slug includes the hyphen.
- 0.7.7 executor job `101732751791` did not mutate the target release branch. Logs show repeated Codex runtime/tool-routing/context compaction failures; model never checked out/edited ChatPulse and terminal persistence then failed with `Exactly one exact done/blocked destination is required`.
- Live release branch remains exactly `0fcb78f...`, proving zero product drift from the failed executor attempt.
- The ai-control task is still orphaned under `tasks/running`; it is no longer an active writer because the exact Actions job is terminal.

## 4. Release Gates

### GATE-1 — Safe chat URL identity mutation
Status: UNSATISFIED
Evidence: failed executor left release branch unchanged.
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
Exact scope: model, service worker, options UI and focused tests; no credential/watchdog semantic changes.
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

HQ: release owner; diagnosing/rerouting CP-1.
Workers: NONE.
Codex: prior task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z` is orphaned-running in ai-control after terminal failed executor; it is not an active writer.
Zero-model control: coordinator completed; terminal persistence failed.
CI/runtime: no ChatPulse product CI active.

## 7. Safe Parallel Work

NONE — CP-1 implementation is the single current release node; do not start metadata/CI before a verified product patch.

## 8. Current Blockers

NONE at project level. The prior Codex execution route failed, but alternate implementation routing remains available. The orphaned ai-control claim must be terminalized or superseded safely before any new Codex retry.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — exact repo slugs, release branch, executor steps/logs and unchanged product SHA live-verified.
Release Alignment Audit: PASS — PAT/repository-name runtime report does not expand 0.7.7 credential semantics.
Dependency & Ordering Audit: PASS — implementation still precedes release metadata/CI/PR/main proof.
Execution & Parallelism Audit: PASS — failed executor is terminal; no competing ChatPulse product writer exists.
Adversarial Audit: PASS — do not misdiagnose GitHub 404 as PAT failure when repository slug is wrong; do not treat executor step success as product success without branch mutation.

## 10. Next Action

Exact next action: safely terminalize/supersede the orphaned ai-control ChatPulse claim, then reroute CP-1 through a bounded implementation path that can actually patch the exact release ref; independently verify diff/tests before CP-2.
Executor: HQ.
Expected evidence: exact product commit/diff and passing focused/full validation.
Acceptance: CP-1 does not complete until live branch mutation and independent test evidence both exist.

## 11. Last Material Revision

What changed: runtime 404 report was diagnosed as a repository slug typo; the prior 0.7.7 Codex executor became terminal and was proven to have produced zero target-repository mutation.
Why critical path changed: CP-1 needs rerouting rather than waiting on a dead executor.
Evidence: live `ModuleStrategy` 404 vs live private `Module-Strategy`; executor job `101732751791`; release branch still `0fcb78f...`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: diagnosed repository slug issue, reconciled terminal executor and unchanged release branch, persisted r58.
Active external executions and exact refs: NONE for ChatPulse product code; orphaned ai-control task remains persisted under running.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r58 + release branch `release/0.7.7-edit-chat-url@0fcb78f...` + failed job `101732751791`.
Exact next action after recovery: terminalize/supersede orphan claim and reroute CP-1 without duplicate product writers.
Rotation blockers: NONE.

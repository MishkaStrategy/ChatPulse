---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 54
updated_at: 2026-09-07T11:39:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.7-edit-chat-url
basis_sha: 0fcb78f1149257bb7ea390e6d28e9d85a59e179c
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.7 beta — allow an already configured ChatPulse chat to be rebound to a new concrete ChatGPT conversation URL after chat recreation, without configuring that chat again.

Release surface: chat identity mutation in local model/state, service-worker background mutation, Control Center per-chat URL editor, focused safety tests, 0.7.7 beta metadata, release CI and reproducible package/provenance.

Definition of RELEASED: the user can edit the existing configured chat URL in Control Center and save another valid concrete ChatGPT conversation URL while preserving the same ChatPulse chat ID, profile/configuration, task guards/counters and GitHub-watch state. An actual URL change clears stale page-bound tab/fingerprint/dispatch/observation/recovery/error runtime, increments control revision and becomes eligible for the new conversation. Invalid/non-chat URLs and a target URL already owned by another configured chat are rejected. Existing add/remove/open/watchdog/Telegram behavior remains compatible.

Mandatory release gates:
- [ ] atomic URL replacement semantics and runtime-reset safety are implemented and tested;
- [ ] Control Center exposes an editable per-chat URL and save preserves existing profile/configuration;
- [ ] 0.7.7 beta metadata/package/workflow are coherent and frozen release branch passes 5/5 audits, Chromium MV3 E2E and finalized reproducible package/provenance;
- [ ] canonical 0.7.7 PR is validated and exact validated head is merged;
- [ ] exact post-merge main release gate/dependency policy pass and package/provenance reproduce frozen hashes.

Required release evidence: exact refs/SHAs/run IDs, focused URL mutation tests, UI/background/static assertions, 5 audit cycles, Chromium MV3 E2E, reproducible artifact hashes, PR/merge state and exact-main proof.

Known explicit exclusions: no automatic ChatGPT content migration; no conversation cloning; no profile recreation; no GitHub write API/workflow dispatch; no credential changes; no unrelated watchdog/Telegram/auth-grace changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch state checkpoint before r54: `0fcb78f1149257bb7ea390e6d28e9d85a59e179c`; later HQ commits are state-only and do not alter release branch source.
Critical-path basis ref: `release/0.7.7-edit-chat-url`.
Critical-path basis SHA: `0fcb78f1149257bb7ea390e6d28e9d85a59e179c`.
Canonical integration branch: `release/0.7.7-edit-chat-url`.
Canonical PR / RC: NONE yet.
Relevant open PRs: draft #17 only; unrelated/excluded.
Relevant Issues: none required.
Relevant CI / workflows: no 0.7.7 release run yet; current 0.7.6 workflow is the release template.
Relevant release/deployment state: 0.7.6 DONE; 0.7.7 implementation active.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.
Architecture / major components: `lib/model-v2.js` owns normalized chat state; `background/service-worker-v2.js` owns identity mutations/persistence; `options/options.html` and `options/options.js` own Control Center editing.
Build / packaging: Node tests/static validator + deterministic Python ZIP/source-manifest.
Tests / validation: model/service-worker/profile/configuration suites, static validator, loaded Chromium MV3 E2E.
CI: five audit cycles + Chromium E2E + reproducible package/provenance; dependency runner policy separately.
Release / deployment: frozen release branch -> canonical PR -> merge -> exact-main validation.
Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` sole working repository.
External release dependencies: GitHub Actions runners/artifact service and current bounded Codex code execution task.
Material findings: URL is currently normalized/stored on chat while profile is separate. Existing UI only displays `.chat-url`; existing profile save calls background `UPDATE_CHAT_PROFILE`. Remove/import already fail closed during `activeCheck`. The correct mutation is same chat identity/config plus page-runtime reset only; task counters and GitHub-watch state must survive.

## 4. Release Gates

### GATE-1 — Safe chat URL identity mutation
Status: UNSATISFIED
Evidence: bounded implementation task queued; no resulting product commit yet.
Blocking items: verified Codex implementation/tests.

### GATE-2 — Control Center URL editing
Status: UNSATISFIED
Evidence: same bounded task covers UI wiring; no resulting product commit yet.
Blocking items: verified Codex implementation/tests.

### GATE-3 — Frozen 0.7.7 candidate
Status: UNSATISFIED
Evidence: release branch exists at pre-implementation SHA `0fcb78f...`; no 0.7.7 metadata/run yet.
Blocking items: GATE-1/GATE-2, release metadata and release CI.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Evidence: no 0.7.7 PR yet.
Blocking items: GATE-3.

### GATE-5 — Post-merge main proof
Status: UNSATISFIED
Evidence: no 0.7.7 merge yet.
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1 — Implement editable chat URL with safe identity mutation
Status: ACTIVE
Release gate: GATE-1 + GATE-2.
Why critical: requested feature and identity safety boundary.
Depends on: none.
Blocks: CP-2.
Execution plane: CODEX, bounded existing-ref local code patch after passed placement gate.
Exact scope: `model-v2.js`, `service-worker-v2.js`, `options.html`, `options.js`, focused `chat-url-update.test.mjs`; max 5 files/220 lines; no workflows/dependencies.
Acceptance condition: same ID/profile/task/GitHub state preserved; invalid/duplicate targets rejected; actual URL change resets only page-bound runtime and increments revision; unchanged URL does not reset; UI uses background mutation path; tests and full extension audit pass.
Evidence: task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z` queued in `MishkaStrategy/ai-control` at exact source SHA `0fcb78f...`.

### CP-2 — Advance metadata and validate frozen branch
Status: PENDING
Release gate: GATE-3.
Why critical: exact 0.7.7 release artifact/provenance required.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: deterministic 0.7.7 manifest/package/validator/package/workflow metadata, then exact branch CI.
Acceptance condition: 5/5 audits + Chromium E2E + reproducible finalized 0.7.7 artifact.
Evidence: pending.

### CP-3 — Validate and merge canonical 0.7.7 PR
Status: PENDING
Release gate: GATE-4.
Why critical: integration proof required.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: changed files/head/base, PR release CI/dependency policy, reviews/threads/mergeability and expected-head merge.
Acceptance condition: exact validated head merged after all evidence green.
Evidence: pending.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-5.
Why critical: merge alone is not release proof.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact-main release gate, dependency policy and reproducible provenance.
Acceptance condition: all jobs green and inner artifact hashes equal frozen candidate.
Evidence: pending.

## 6. Active Execution Registry

HQ: release contract/routing/integration owner; no write to release branch while Codex source freshness is active.
Workers: NONE.
Codex: `chatpulse-0-7-7-edit-chat-url-20260907T1137Z` — QUEUED; source `release/0.7.7-edit-chat-url@0fcb78f...`; write surface exactly five CP-1 files; delivery existing_ref; expected evidence commit + tests.
Zero-model control: NONE.
CI/runtime: ai-control event-driven executor expected to claim the queued task; no project CI yet.

## 7. Safe Parallel Work

NONE — ALL_USEFUL_SLICES_ALREADY_ACTIVE: changing release branch before the exact-source Codex task completes would make its freshness precondition stale. Release metadata can safely follow immediately after CP-1 verification.

## 8. Current Blockers

NONE. Queued event-driven execution is active external work, not a blocker.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — model/background/UI/tests/release metadata/CI/PR/main proof covered.
Evidence Audit: PASS — live master, main/release refs, r53, source surfaces, allowlist/schema and exact queued task verified.
Release Alignment Audit: PASS — no unrelated work on the release path.
Dependency & Ordering Audit: PASS — CP-1 branch source must remain immutable while claimed/queued; metadata and release CI follow feature verification.
Execution & Parallelism Audit: PASS — HQ connector patch-level capability is unsupported for large code files; runner is validation-only; one bounded Codex task owns all overlapping implementation writes.
Adversarial Audit: PASS — page-runtime leakage, duplicate URL ownership, task-limit bypass, direct storage mutation and concurrent identity mutation are explicit acceptance/fail-closed constraints.
Material findings and resolutions: ChatPulse was absent from ai-control lazy allowlist and was safely added as `enabled: true` with live default branch `main`; canonical microtask schema was read before enqueue.

## 10. Next Action

Exact next action: live-reconcile Codex task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z`; if DONE, live-verify release-branch diff/tests and integrate CP-1; if BLOCKED/STALE, diagnose exact cause before any retry; if still active, do not duplicate execution.
Executor: HQ.
Expected evidence: task terminal state and exact branch SHA/commit/test result.
Acceptance condition: only a verified bounded five-file implementation can advance GATE-1/GATE-2.

## 11. Last Material Revision

What changed: created exact release branch, registered ChatPulse in ai-control lazy allowlist, passed Codex placement gate and queued one bounded existing-ref implementation task.
Why critical path changed: CP-1 is now executing externally on an immutable exact branch source.
Evidence causing the change: release branch `0fcb78f...`; ai-control repos entry; schema `codex-microtask/v1`; queued task file.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: queued the bounded Codex CP-1 task and verified its exact persisted YAML/source SHA.
Active external executions and exact refs: Codex task `chatpulse-0-7-7-edit-chat-url-20260907T1137Z`, known state QUEUED, source `release/0.7.7-edit-chat-url@0fcb78f1149257bb7ea390e6d28e9d85a59e179c`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r54 + task ID above + exact release branch source.
Exact next action after recovery: reconcile queued/running/done/blocked task and branch head; do not mutate release branch until task state is resolved.
Rotation blockers: NONE.

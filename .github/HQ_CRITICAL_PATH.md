---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 53
updated_at: 2026-09-07T11:34:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: d32fd2f6699d8af26edcc8fd2096393503116101
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.7 beta — allow an already configured ChatPulse chat to be rebound to a new concrete ChatGPT conversation URL after chat recreation, without configuring that chat again.

Release surface: chat identity mutation in the local state/model, service-worker message path, Control Center per-chat URL editor, focused URL-mutation safety tests, 0.7.7 beta metadata, repository-native release CI and reproducible package/provenance.

Definition of RELEASED: from the existing chat profile in Control Center the user can replace its ChatGPT conversation URL with another valid concrete chat URL and save it. The same ChatPulse chat ID and its user configuration/profile remain intact; task/guard counters and GitHub-watch state are not silently reset. Stale page identity/runtime state (tab binding, page fingerprints/dispatch checkpoint, observation/recovery/error state) is cleared so the new conversation cannot inherit unsafe old-page dedup state. Invalid/non-chat URLs and a URL already owned by another configured ChatPulse chat are rejected. Existing add/remove/open/watchdog/Telegram behavior remains compatible.

Mandatory release gates:
- [ ] atomic URL replacement semantics and runtime-reset safety are implemented and tested;
- [ ] Control Center exposes an editable per-chat URL and saving preserves the existing profile/configuration;
- [ ] 0.7.7 beta metadata/package/workflow are coherent and the exact frozen release branch passes 5/5 audits, Chromium MV3 E2E and finalized reproducible package/provenance;
- [ ] canonical 0.7.7 PR is validated and exact validated head is merged;
- [ ] exact post-merge main release gate/dependency policy pass and package/provenance reproduce frozen candidate hashes.

Required release evidence: exact SHAs/run IDs, focused URL mutation tests, static/UI/service-worker assertions, five audit cycles, Chromium MV3 E2E, reproducible package hashes/artifact, canonical PR state and exact-main validation.

Known explicit exclusions: no automatic ChatGPT conversation cloning/migration; no content transfer between old/new conversations; no profile recreation; no GitHub write API/workflow dispatch; no credential changes; no unrelated watchdog polling/Telegram/auth-grace changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA before this state write: `d32fd2f6699d8af26edcc8fd2096393503116101`.
Critical-path basis ref: `main`.
Critical-path basis SHA: `d32fd2f6699d8af26edcc8fd2096393503116101`.
Canonical integration branch: planned `release/0.7.7-edit-chat-url`.
Canonical PR / RC: NONE yet.
Relevant open PRs: draft #17 only; unrelated/excluded.
Relevant Issues: none required for this explicit owner release objective.
Relevant CI / workflows: current 0.7.6 release workflow is the established template and will be advanced to 0.7.7 on the release branch.
Relevant release/deployment state: 0.7.6 is terminal DONE; 0.7.7 is a new explicit patch-release objective.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.
Architecture / major components: `chrome-extension/lib/model-v2.js` owns normalized chat identity/state; `background/service-worker-v2.js` owns mutations and persisted state; `options/options.html` + `options/options.js` own Control Center chat profile editing.
Build / packaging: Node test/static audit plus deterministic Python ZIP/source-manifest packaging.
Tests / validation: model/service-worker/profile/configuration tests, static validator, loaded Chromium MV3 E2E.
CI: five audit cycles + Chromium E2E + reproducible package/provenance; separate dependency runner policy.
Release / deployment: frozen release branch -> canonical PR -> merge -> exact-main validation.
Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` is the sole WORKING_REPOSITORY.
External release dependencies: GitHub Actions runners and artifact service.
Material findings: chat URL is already normalized by `normalizeChatURL` and stored separately from `profile`. Existing profile save uses `UPDATE_CHAT_PROFILE`. Identity mutations such as remove/import are prohibited while an active check is running. URL replacement therefore can preserve the existing chat/profile while atomically changing `url`, incrementing `controlRevision`, clearing `tabId` and stale page fingerprints/dispatch/observation/recovery/error state, and leaving task/profile/GitHub-watch configuration intact. Duplicate normalized URL ownership must be rejected.

## 4. Release Gates

### GATE-1 — Safe chat URL identity mutation
Status: UNSATISFIED
Evidence: model normalization and existing state shape inspected; no URL mutation exists yet.
Blocking items: implement atomic validated replacement, duplicate guard and stale page-runtime reset.

### GATE-2 — Control Center URL editing
Status: UNSATISFIED
Evidence: current UI displays `.chat-url` as read-only text and profile save only submits profile fields.
Blocking items: editable URL field integrated into existing profile save path with clear validation feedback.

### GATE-3 — Frozen 0.7.7 candidate
Status: UNSATISFIED
Evidence: no 0.7.7 release branch/candidate yet.
Blocking items: GATE-1 and GATE-2 plus coherent release metadata and exact release CI.

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
Why critical: this is the requested feature and safety boundary.
Depends on: none.
Blocks: CP-2.
Execution plane: CODEX for bounded multi-file local code patch after placement gate; HQ owns exact semantics and verification.
Exact scope: model URL-rebind helper/reset semantics, service-worker atomic mutation path, Control Center URL input/save integration, focused tests. Preserve chat ID/profile/task guards/counters/GitHub-watch state; reset only stale page-bound runtime; reject invalid/duplicate URLs; no unrelated refactor.
Acceptance condition: focused tests prove normalization, preservation, reset and duplicate rejection; UI submits the edited URL through background mutation, never writes storage directly.
Evidence: pending implementation.

### CP-2 — Advance release metadata and validate frozen branch
Status: PENDING
Release gate: GATE-3.
Why critical: exact release artifact/provenance is required.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: HQ_DIRECT for deterministic metadata changes + PROJECT_RUNNER for validation.
Exact scope: 0.7.7 manifest/package/validator/package/workflow metadata; exact release branch CI.
Acceptance condition: 5/5 audits + Chromium E2E + reproducible finalized 0.7.7 artifact.
Evidence: pending.

### CP-3 — Validate and merge canonical 0.7.7 PR
Status: PENDING
Release gate: GATE-4.
Why critical: integration into current main must be independently validated.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: exact changed-file scope/head/base, PR release CI, dependency policy, reviews/threads, mergeability and expected-head merge.
Acceptance condition: only exact validated release head is merged after all PR evidence is green.
Evidence: pending.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-5.
Why critical: merge alone is not release proof.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact-main release gate, dependency policy and reproducible provenance.
Acceptance condition: exact product merge passes all jobs and reproduces frozen candidate inner hashes.
Evidence: pending.

## 6. Active Execution Registry

HQ: owner of 0.7.7 release contract, release branch, metadata, integration and verification.
Workers: NONE.
Codex: NONE at this persisted checkpoint; placement preparation follows immediately.
Zero-model control: NONE.
CI/runtime: NONE release-critical active yet.

## 7. Safe Parallel Work

NONE — CP-1 is a compact identity/UI mutation sharing model/service-worker/UI semantics; splitting writes would increase conflict and safety risk. Release metadata follows once feature behavior is frozen.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — model/state identity, background mutation, Control Center, tests, release metadata, CI/package and PR/main validation surfaces are covered.

Evidence Audit: PASS — live main, r52, current model/service-worker/options source, current 0.7.6 metadata and open PR set were checked; no feature claim is treated as implemented yet.

Release Alignment Audit: PASS — every CP node is necessary to deliver and prove the requested editable-link patch release; unrelated PR #17 remains excluded.

Dependency & Ordering Audit: PASS — safe identity semantics/UI must be frozen before release metadata/candidate validation; branch validation precedes PR; exact-main proof follows merge.

Execution & Parallelism Audit: PASS — implementation is bounded but spans large code files where exact local patching is safer than connector whole-file replacement; normal project runner only validates and cannot author the patch. No useful non-overlapping worker slice currently shortens the critical path.

Adversarial Audit: PASS — strongest failure hypotheses are stale old-page dispatch state causing skipped/duplicate commands, duplicate URL ownership, bypass of task limits by resetting task runtime, or direct UI storage mutation. Contract explicitly requires page-runtime-only reset, duplicate rejection, task/guard/GitHub runtime preservation and background-owned atomic mutation.

Material findings and resolutions: URL change is treated as identity mutation and must fail while a background check is active, just like remove/import, preventing concurrent check/write races.

## 10. Next Action

Exact next action: create `release/0.7.7-edit-chat-url` from the persisted-main head, pass Codex placement gate for the bounded multi-file implementation slice, enqueue exact existing-ref code task, then continue HQ with deterministic release metadata preparation only after the feature patch is verified.
Executor: HQ + CODEX bounded code plane.
Expected evidence: exact branch SHA, ai-control task identity/placement evidence, then bounded commit and focused tests.
Acceptance condition: CP-1 advances only after HQ live-verifies diff/test evidence against the preserved/reset semantics above.

## 11. Last Material Revision

What changed: owner opened a new explicit release objective after terminal 0.7.6 — editable chat URL/rebinding without reconfiguring that ChatPulse chat.
Why the critical path changed: previous release is complete; the new request creates a new 0.7.7 patch-release contract and four-node implementation/integration/proof chain.
Evidence causing the change: explicit owner request plus live source inspection showing URL is currently read-only in Control Center and no mutation path exists.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: established and audited the new 0.7.7 release contract/critical path before code writes.
Active external executions and exact refs: NONE yet.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r53 + main basis `d32fd2f6699d8af26edcc8fd2096393503116101` and owner objective editable chat URL.
Exact next action after recovery: verify r53 persistence/current main, create exact release branch, then perform Codex placement/enqueue for CP-1 without changing semantics.
Rotation blockers: NONE.

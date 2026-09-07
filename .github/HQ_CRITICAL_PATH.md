---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 60
updated_at: 2026-09-07T12:33:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.7-edit-chat-url
basis_sha: 0fcb78f1149257bb7ea390e6d28e9d85a59e179c
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.7 beta — (1) edit/rebind the concrete ChatGPT conversation URL of an already configured ChatPulse chat without reconfiguration, and (2) close the owner-reported shared-PAT verification gap so one saved shared PAT can be verified transparently against all configured GitHub-watch repositories rather than only one manually selected test repository.

Release surface: safe chat-URL identity mutation; service-worker persistence; Control Center URL editor; shared GitHub PAT verification/diagnostics UI; focused safety tests; 0.7.7 release metadata; CI; reproducible package/provenance.

Definition of RELEASED:
- an existing configured chat can replace its concrete ChatGPT conversation URL while preserving ChatPulse identity/configuration/task guards/GitHub-watch state and clearing only page-bound runtime state;
- the shared/global PAT remains one extension-local credential, not bound to a chat;
- saving/testing the shared PAT can validate every unique configured GitHub-watch repository and report per-repository success/failure;
- the UI makes credential source explicit enough to distinguish shared-PAT use from a repository-specific override without exposing secrets;
- watchdog runtime continues polling each unique configured repository independently;
- invalid/duplicate chat URLs are rejected and credential secrets never enter state/export/messages/logs.

Mandatory release gates:
- [ ] safe atomic URL mutation + runtime reset implemented/tested;
- [ ] Control Center URL editing preserves existing configuration;
- [ ] shared PAT multi-repository verification/diagnostics implemented/tested without changing read-only GitHub API semantics;
- [ ] frozen 0.7.7 branch passes 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and hashes reproduce frozen candidate.

Required release evidence: exact refs/SHAs; URL mutation tests; shared-PAT per-repository verification tests; credential-source diagnostics tests; audits; Chromium E2E; reproducible hashes/artifact; PR/merge and exact-main proof.

Known explicit exclusions: no content migration/cloning; no task-limit reset; no GitHub write/workflow dispatch; no automatic token generation or permission escalation; no unrelated Telegram/auth-grace changes; draft PR #17 excluded.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA before this state write: `f32d6706fd92bfb70820b773b428277e5ff6a080`.
Current release basis ref: `release/0.7.7-edit-chat-url`.
Current release basis SHA: `0fcb78f1149257bb7ea390e6d28e9d85a59e179c`.
Canonical integration branch: `release/0.7.7-edit-chat-url`.
Canonical PR: NONE yet.
Relevant CI/control execution: prior ai-control executor `34117489614`/`101732751791` is terminal/unproductive and left target branch unchanged.
Relevant release state: 0.7.6 DONE; 0.7.7 implementation pending.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 local ChatGPT task runner with optional GitHub Actions watchdog and Telegram notifications.
Architecture: `lib/model-v2.js` chat/profile state; `background/service-worker-v2.js` chat/watchdog orchestration; `background/github-actions.js` GitHub credential resolution/fetching; `options/github-token-ui.js` credential UI; `options/options.html` and `options.js` Control Center.
Build/package: Node validation plus deterministic Python ZIP/source manifest.
Tests/CI: extension tests, static validator, five audit cycles, Chromium E2E, reproducible packaging and dependency policy.
Governance: live HQ master v1.2; `MishkaStrategy/ChatPulse` is WORKING_REPOSITORY; `.github`/`ai-control` are control exceptions.

Material findings:
- Owner clarified the observed behavior: one shared PAT was saved/tested successfully against another configured repository; that chat proceeded, while the Module-Strategy chat hit HTTP 404.
- Shipped 0.7.6 stores exactly one shared/global PAT. The global test UI, however, accepts exactly one explicit repository (`#githubGlobalTestRepository`) and calls `verifyGlobalGithubTokenAccess` only for that repository. Therefore successful global-PAT verification proves access only to the repository chosen for that test, not to all repositories used by all chats.
- Watchdog runtime independently groups eligible chats by `profile.githubRepository` and calls `fetchLatestGithubWorkflowRun(repository)` once for each unique repository. Thus repo A can succeed while repo B fails under the same shared credential.
- `loadGithubToken(repository)` still resolves `repository-specific override -> shared/global PAT -> null`, so an old repository-specific override can also make one repository fail while others use the global PAT successfully.
- The correct product fix is not to bind the shared PAT to a chat. It is to preserve one shared credential while adding multi-repository verification and explicit per-repository credential-source diagnostics.
- Exact local cause of the Module-Strategy 404 is still either shared PAT authorization missing for that private repo or a repository-specific override shadowing the shared PAT; current UI does not expose enough evidence to distinguish these cleanly.
- Release branch remains exactly `0fcb78f...`; no product mutation from prior failed executor.

## 4. Release Gates

### GATE-1 — Safe chat URL identity mutation
Status: UNSATISFIED
Evidence: no product diff yet.
Blocking items: implementation + tests.

### GATE-2 — Shared PAT multi-repository verification and diagnostics
Status: UNSATISFIED
Evidence: 0.7.6 global PAT test validates only one manually selected repository; watchdog polls repositories independently.
Blocking items: implement per-repository verification results and credential-source visibility without exposing secrets.

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

### CP-1A — Implement editable chat URL with safe identity mutation
Status: ACTIVE
Release gate: GATE-1.
Why critical: explicit owner feature request.
Depends on: none.
Blocks: CP-2.
Execution plane: reroute required after failed Codex attempt.
Exact scope: model, service worker, options URL UI and focused tests.
Acceptance condition: same chat identity/configuration; page-runtime reset only on actual URL change; invalid/duplicate rejection; active-check fail closed; unchanged URL no reset; background-only persistence; tests green.
Evidence: release branch unchanged at `0fcb78f...`.

### CP-1B — Make shared PAT verification cover all configured repositories
Status: ACTIVE
Release gate: GATE-2.
Why critical: owner runtime report exposed misleading global-verification semantics.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT/implementation route to be selected after exact patch scope inspection.
Exact scope: `background/github-actions.js`, `options/github-token-ui.js`, focused tests; service-worker behavior remains per-repository read-only polling.
Acceptance condition: one shared PAT is saved once; verification enumerates unique configured GitHub-watch repositories or offers an equivalent all-repositories check; result is shown per repo; repo-specific override presence/source is explicit; no secret exposure; existing per-repo override compatibility retained.
Evidence: shipped global test accepts one repository only; runtime groups/polls repositories independently.

### CP-2 — Advance 0.7.7 release metadata and validate frozen branch
Status: PENDING
Depends on: CP-1A + CP-1B.
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

HQ: release owner; CP-1A rerouting and CP-1B exact-scope implementation planning.
Workers: NONE.
Codex: NONE active; prior task remains orphaned-running in ai-control after terminal failed executor but is not an active product writer.
Zero-model control: no current product mutation.
CI/runtime: no ChatPulse product CI active.

## 7. Safe Parallel Work

CP-1A and CP-1B are logically independent but both touch Control Center surfaces; execute in serialized commits on the same release branch unless exact file-level separation is proven before parallel dispatch.

## 8. Current Blockers

NONE at project level. Prior Codex route failed, but alternate implementation routing remains available.

## 9. Critical Path Audits

Repository Coverage Audit: PASS.
Evidence Audit: PASS — global test path, credential precedence and per-repository watchdog grouping live-reviewed.
Release Alignment Audit: PASS — owner-reported shared-PAT behavior is now explicitly part of 0.7.7.
Dependency & Ordering Audit: PASS — both feature fixes precede release metadata/CI/PR/main proof.
Execution & Parallelism Audit: PASS — no active product writer; potentially overlapping Control Center writes will be serialized unless proven disjoint.
Adversarial Audit: PASS — release must not misrepresent one-repository PAT success as organization-wide/repository-wide authorization; repo-specific override shadowing must remain visible; no credential leakage or write API expansion.

## 10. Next Action

Exact next action: implement CP-1A and CP-1B on the exact release branch, independently verify focused/full tests, then freeze the candidate for CP-2.
Executor: HQ-selected bounded implementation route.
Expected evidence: exact product commits/diffs and passing URL + shared-PAT multi-repository tests.
Acceptance: both GATE-1 and GATE-2 satisfied before release metadata freeze.

## 11. Last Material Revision

What changed: 0.7.7 release contract expanded to include shared PAT multi-repository verification/diagnostics.
Why the critical path changed: owner runtime evidence showed the shared credential is global but its verification is currently single-repository, allowing one chat/repo to pass while another fails without clear diagnosis.
Evidence causing the change: owner report; global PAT test code; watchdog repository-group polling code; credential precedence code.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: reconciled owner runtime observation with shipped credential/watchdog code and persisted r60.
Active external executions and exact refs: NONE for ChatPulse product code.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r60 + release branch `release/0.7.7-edit-chat-url@0fcb78f...`.
Exact next action after recovery: implement CP-1A + CP-1B, verify, then advance release.
Rotation blockers: NONE.

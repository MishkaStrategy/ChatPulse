---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 29
updated_at: 2026-09-05T10:25:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: NOT_READY
basis_ref: main
basis_sha: 5593bc3894ba2404adad87a97fc103d0a61f1e6a
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.2 beta — private GitHub repository support through a locally stored read-only GitHub token, plus an explicit token-permission verification control in the per-chat GitHub Actions settings.

Release surface: GitHub Actions client/auth storage, Control Center GitHub integration UI, security/privacy documentation, deterministic tests, loaded-Chromium regression gate, release versioning and reproducible packaging.

Definition of RELEASED: public repositories continue to work without credentials; a private repository can be watched when a GitHub token with repository access and Actions read permission is stored; a pasted token can be checked against the exact configured `owner/repo` Actions endpoint before it is saved; credentials remain local-only, hidden from content scripts, excluded from portable export/logs/runtime state, and never grant or perform GitHub writes; existing active-run, idle-reset, fail-closed and at-most-once restart semantics remain intact; frozen branch, canonical PR merge-tree and post-merge main evidence all pass.

Mandatory release gates:

- [ ] Fine-grained PAT with repository access + `Actions: Read-only` can authenticate `GET /repos/{owner}/{repo}/actions/runs` for private repositories.
- [ ] Public repositories remain token-optional and unauthenticated by default.
- [ ] Token verification button checks the exact repository Actions read path and gives actionable 401/403/404/rate-limit feedback without logging or echoing the token.
- [ ] Token is stored only in `chrome.storage.local` under a dedicated credential key and storage access is restricted to trusted extension contexts when supported by Chrome.
- [ ] Token never enters `chatpulseState`, portable export, logs, ChatGPT content messages, package provenance or UI state returned by the worker.
- [ ] Background watchdog automatically uses the stored token for the matching repository while preserving `credentials: omit`, bounded read-only GETs and no GitHub writes/dispatch.
- [ ] Existing unfinished-run blocking, active->idle fresh baseline, API fail-closed and one-restart-per-marker semantics remain green.
- [ ] UI documents the least-privilege fine-grained token requirement and that classic PAT `repo` scope is broader and not recommended.
- [ ] Five deterministic audit cycles, Chromium E2E, dependency policy and reproducible package/provenance pass on branch, PR merge-tree and main.

Required release evidence: exact branch/PR/main SHAs, workflow IDs, test counts, token-auth protocol assertions, secret-leak/export assertions, browser E2E result, dependency-policy result, package/source-manifest SHA-256.

Known explicit exclusions: GitHub write permissions; workflow dispatch; storing GitHub credentials in cloud/backend/sync storage; OAuth device flow; GitHub App installation flow; private repository support without a user-provided credential; unrelated draft PR #17.

## 2. Repository Basis

Default branch: main.
Default branch observed SHA before this revision: `5593bc3894ba2404adad87a97fc103d0a61f1e6a`.
Validated previous product commit: `eb009837505c570cc1646485244b8fbc4563a6ea` (0.7.1 beta).
Critical-path basis ref: main.
Critical-path basis SHA: `5593bc3894ba2404adad87a97fc103d0a61f1e6a`.
Canonical integration branch: `release/0.7.2-private-github-token` (to create from the state commit produced by this revision).
Canonical PR / RC: pending.
Relevant open PRs: #17 draft remains separate/excluded.
Relevant Issues: none required for this owner-direct scope.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.
Relevant release/deployment state: 0.7.1 beta is released; its explicit exclusion of private repositories/tokens is superseded by the current owner decision.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture / major components: popup/options UI, MV3 service worker, pure state/model helpers, ChatGPT content script, optional Telegram integration and GitHub Actions watchdog.
Build / packaging: deterministic Python ZIP/source-manifest packaging plus Node validation.
Tests / validation: 84 deterministic extension tests plus Playwright loaded-Chromium E2E before this patch.
CI: five-cycle deterministic audit, Chromium E2E, reproducible package/provenance and dependency runner policy.
Release / deployment: validated merge to main; no Chrome Web Store publication required by current project policy.
Governance: organizational HQ master 1.2 live-read for this wave.
External release dependencies: GitHub REST API and Chromium download for E2E.
Material findings: `MishkaStrategy/Elza` is private, so 0.7.1 cannot create a baseline because its GitHub client intentionally sends no Authorization header. Current GitHub documentation confirms fine-grained PAT `Actions` repository permission (read) is sufficient for workflow-run reads; classic PATs require the broad `repo` scope for private repositories and are not the preferred least-privilege path. Existing GitHub client already centralizes the exact read-only Actions request, allowing credential use to be added without changing watchdog state-machine semantics.

## 4. Release Gates

### GATE-1 — Secure private-repository authentication
Status: UNSATISFIED
Evidence: current client has no token store/header and private Elza cannot be read by the extension.
Blocking items: credential store, authenticated GET, actionable errors, secret isolation.

### GATE-2 — Token verification UX
Status: UNSATISFIED
Evidence: current Control Center has no GitHub token input or verification button.
Blocking items: masked token field, verification control/status, least-privilege guidance.

### GATE-3 — Frozen branch validation
Status: UNSATISFIED
Evidence: patch not implemented.
Blocking items: GATE-1 and GATE-2.

### GATE-4 — Canonical PR merge-tree
Status: UNSATISFIED
Evidence: no PR yet.
Blocking items: GATE-3.

### GATE-5 — Post-merge main
Status: UNSATISFIED
Evidence: not merged.
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1 — Implement least-privilege GitHub credential path and verification UI
Status: ACTIVE
Release gate: GATE-1, GATE-2
Why critical: unblocks the owner’s private `MishkaStrategy/Elza` watchdog while protecting the credential boundary.
Depends on: released 0.7.1 active-run watchdog.
Blocks: CP-2.
Execution plane: HQ_DIRECT
Exact scope: GitHub client credential store/authenticated GET + Control Center masked token/check control + secret-isolation tests/docs/versioning.
Acceptance condition: deterministic tests prove authenticated and unauthenticated protocol behavior, token verification/error handling, storage isolation and no export/log leakage; existing watchdog behavior stays green.
Evidence: pending branch SHA/workflow.

### CP-2 — Validate frozen 0.7.2 branch
Status: PENDING
Release gate: GATE-3
Depends on: CP-1
Blocks: CP-3
Execution plane: PROJECT_RUNNER
Exact scope: five deterministic audits, Chromium E2E, dependency policy, reproducible package/provenance.
Acceptance condition: exact branch head fully green.
Evidence: pending.

### CP-3 — Validate canonical PR merge-tree
Status: PENDING
Release gate: GATE-4
Depends on: CP-2
Blocks: CP-4
Execution plane: PROJECT_RUNNER
Exact scope: exact GitHub PR merge ref plus review/thread/mergeability checks.
Acceptance condition: exact merge-tree fully green with no unresolved blocker.
Evidence: pending.

### CP-4 — Merge exact head and validate main
Status: PENDING
Release gate: GATE-5
Depends on: CP-3
Blocks: DONE
Execution plane: HQ_DIRECT + PROJECT_RUNNER
Exact scope: merge only validated PR head, reproduce release evidence on exact main product commit, persist final state.
Acceptance condition: all main gates green and 0.7.2 package hashes recorded.
Evidence: pending.

## 6. Active Execution Registry

HQ: CP-1 canonical writer/integrator.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: NONE until branch head is created.

## 7. Safe Parallel Work

NONE — credential storage, authenticated client behavior and per-chat UI are a tightly coupled security boundary and should have one canonical writer.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — affected GitHub client/UI/security/test/release surfaces identified.
Evidence Audit: PASS — branch/merge-tree/main and secret-isolation evidence requirements are explicit.
Release Alignment Audit: PASS — limited to owner-requested private GitHub support and token verification plus necessary security/release hardening.
Dependency & Ordering Audit: PASS — secure credential/client layer precedes UI and release validation.
Execution & Parallelism Audit: PASS — one canonical writer avoids split ownership of the credential boundary.
Adversarial Audit: PASS — design forbids token export/logging/content-script exposure and GitHub writes; errors remain fail-closed.

Material findings and resolutions: use a repository-keyed local credential store separate from ChatPulse model state; apply `chrome.storage.local.setAccessLevel({accessLevel: "TRUSTED_CONTEXTS"})` from the GitHub integration module when available; verification uses the same read-only workflow-runs endpoint the watchdog consumes; fine-grained PAT with Actions read is the recommended path.

## 10. Next Action

Exact next action: create `release/0.7.2-private-github-token`, implement CP-1, then validate the exact branch head.
Executor: HQ_DIRECT.
Expected evidence: deterministic auth/storage/UI tests plus existing watchdog/Chromium/package gates.
Acceptance condition: GATE-1 and GATE-2 satisfied and branch gate green.

## 11. Last Material Revision

What changed: owner promoted private GitHub repository support and a token-permission verification button into immediate release scope after `MishkaStrategy/Elza` remained without a baseline because it is private.
Why the critical path changed: 0.7.1 explicitly supported only public tokenless GitHub reads.
Evidence causing the change: live repository metadata shows `MishkaStrategy/Elza` is private; owner requested authenticated support; current GitHub docs confirm least-privilege Actions read permission for workflow-run access.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: NO.
Last completed atomic action: live-read master/current ChatPulse state and established the 0.7.2 private-repository release contract.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: implementation pending.
Recovery entrypoint: live-read organizational master, this revision and current main.
Exact next action after recovery: create the release branch and implement CP-1.
Rotation blockers: active product patch wave.

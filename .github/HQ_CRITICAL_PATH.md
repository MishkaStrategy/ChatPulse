---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 27
updated_at: 2026-09-05T09:35:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: NOT_READY
basis_ref: main
basis_sha: 92b0291bc1638971c0e911bd6ad1d39155d88019
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.1 beta patch for GitHub Actions watchdog correctness and repository-field guidance.

Release surface: GitHub Actions client/runtime state model, watchdog service-worker behavior, Control Center copy/status, watchdog tests/E2E, release versioning/packaging documentation.

Definition of RELEASED: ChatPulse polls GitHub independently every 10 minutes, treats any observed unfinished workflow run as active work that blocks same-chat restart, starts a fresh idle interval when the repository transitions from active work to no active work, preserves new-run/reset/idempotency/fail-closed safety, and shows an explicit valid `owner/repo` example in the repository field; exact branch, PR merge-tree and post-merge main evidence must all pass.

Mandatory release gates:

- [ ] Public GitHub client reads enough recent workflow-run metadata to detect unfinished runs without credentials or writes.
- [ ] `queued`, `in_progress`, `waiting`, `requested`, `pending` and any other non-`completed` run in the observed set block restart.
- [ ] Active work refreshes watchdog activity and `active -> none` starts a new idle window instead of inheriting stale pre-run idle time.
- [ ] API/permission/malformed failures remain error-only and cannot trigger restart.
- [ ] New workflow run still resets inactivity episode and one activity marker still produces at most one restart.
- [ ] Control Center shows the exact repository format with an example such as `MishkaStrategy/ChatPulse` and warns not to paste a GitHub URL or `/actions` URL.
- [ ] Loaded Chromium/MV3 E2E proves an active live CI run blocks restart, then proves idle/restart/idempotency after deterministic active-work completion.
- [ ] Existing deterministic audit remains green for five independent cycles.
- [ ] Reproducible 0.7.1 beta package/provenance passes.
- [ ] Canonical PR merge-tree and post-merge main reproduce all release gates.

Required release evidence: exact SHAs, branch/PR/main workflow IDs, E2E assertions, 5x test counts, dependency-policy result, package/source-manifest SHA-256.

Known explicit exclusions: private GitHub repositories/tokens; workflow dispatch/writes; authenticated live ChatGPT automation; redesign beyond requested repository guidance/status; unrelated draft PR #17.

## 2. Repository Basis

Default branch: main.
Default branch observed SHA: `92b0291bc1638971c0e911bd6ad1d39155d88019`.
Critical-path basis ref: main.
Critical-path basis SHA: `92b0291bc1638971c0e911bd6ad1d39155d88019`.
Canonical integration branch: `release/0.7.1-active-actions-watchdog` (to create after this state revision).
Canonical PR / RC: pending.
Relevant open PRs: #17 draft remains separate/excluded.
Relevant Issues: none required for this owner-direct patch.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.
Relevant release/deployment state: 0.7.0 beta is released and browser-E2E hardened; current product behavior only tracks new workflow-run IDs and does not inspect run status.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture / major components: popup/options UI, MV3 service worker, pure model/state helpers, ChatGPT content script, optional Telegram and public GitHub clients.
Build / packaging: deterministic Python package script plus Node validation.
Tests / validation: 80-test deterministic extension suite plus Playwright loaded-Chromium E2E before this patch.
CI: five-cycle deterministic audit, browser E2E, reproducible package/provenance, dependency runner policy.
Release / deployment: validated merge to main; no Chrome Web Store publication required.
Governance: organizational HQ master 1.2 live-read for this wave.
External release dependencies: public GitHub API and Chromium download for E2E only.
Material findings: current client requests only `per_page=1` and reduces the payload to `id/created_at`; therefore a long-running Action does not block restart. The current CI run itself provides a real active-run E2E condition for the new behavior.

## 4. Release Gates

### GATE-1 — Active Actions correctness
Status: UNSATISFIED
Evidence: current client/model omit workflow status.
Blocking items: implement active-run observation and idle transition semantics.

### GATE-2 — UI guidance
Status: UNSATISFIED
Evidence: current field only says public repository and placeholder `owner/repo`.
Blocking items: add concrete example and URL warning.

### GATE-3 — Branch validation
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

### CP-1 — Implement active-run-aware watchdog and repository guidance
Status: ACTIVE
Release gate: GATE-1, GATE-2
Why critical: prevents a false restart while GitHub Actions is still doing project work and removes repository-input ambiguity.
Depends on: released 0.7.0 beta state.
Blocks: CP-2.
Execution plane: HQ_DIRECT
Exact scope: one canonical writer across GitHub client, model/runtime, UI copy/status, tests, versioning and release workflow.
Acceptance condition: deterministic tests cover active/non-active transitions and UI example; loaded-browser E2E covers active blocking plus eventual one-send restart.
Evidence: pending branch SHA/workflow.

### CP-2 — Validate frozen release branch
Status: PENDING
Release gate: GATE-3
Depends on: CP-1
Blocks: CP-3
Execution plane: PROJECT_RUNNER
Exact scope: 5x audit, browser E2E, reproducible package/provenance, dependency policy.
Acceptance condition: exact branch head fully green.
Evidence: pending.

### CP-3 — Validate canonical PR merge tree
Status: PENDING
Release gate: GATE-4
Depends on: CP-2
Blocks: CP-4
Execution plane: PROJECT_RUNNER
Exact scope: exact GitHub PR merge ref, all release gates, reviews/threads/mergeability.
Acceptance condition: merge-tree fully green with no unresolved review blocker.
Evidence: pending.

### CP-4 — Merge exact head and validate main
Status: PENDING
Release gate: GATE-5
Depends on: CP-3
Blocks: DONE
Execution plane: HQ_DIRECT + PROJECT_RUNNER
Exact scope: merge only validated PR head, then reproduce complete release evidence on exact main product commit.
Acceptance condition: main fully green; package hashes recorded; critical path persisted DONE.
Evidence: pending.

## 6. Active Execution Registry

HQ: CP-1 canonical writer/integrator.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: NONE until first branch commit.

## 7. Safe Parallel Work

NONE — GitHub client payload, persisted runtime semantics, service-worker restart gating, UI status and E2E are tightly coupled and should have one canonical writer.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — all affected product/test/release surfaces identified.
Evidence Audit: PASS — branch, merge-tree and main evidence requirements are explicit.
Release Alignment Audit: PASS — patch is limited to owner-requested watchdog correctness and input guidance.
Dependency & Ordering Audit: PASS — model/client/UI/E2E must land before release validation.
Execution & Parallelism Audit: PASS — one canonical writer avoids conflicting coupled changes.
Adversarial Audit: PASS — design must not add tokens, writes, permanent GitHub permission or convert API uncertainty into inactivity.

Material findings and resolutions: use one bounded public API read per repository/poll and fail closed on malformed status data; persist active-run count only as runtime state and exclude it from portable export.

## 10. Next Action

Exact next action: create `release/0.7.1-active-actions-watchdog`, implement the active-run-aware client/model/UI/test/version patch, then validate exact branch head.
Executor: HQ_DIRECT.
Expected evidence: branch workflow with deterministic tests + loaded-browser active-run E2E + package provenance.
Acceptance condition: GATE-1, GATE-2 and GATE-3 satisfied.

## 11. Last Material Revision

What changed: owner promoted active GitHub Actions awareness and explicit repository-format guidance into immediate product scope.
Why the critical path changed: current 0.7.0 behavior can restart a chat while a workflow run is still unfinished because it tracks only run creation IDs.
Evidence causing the change: live inspection of `github-actions.js`, model watchdog logic and owner decision.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: NO.
Last completed atomic action: verified current main and opened 0.7.1 patch critical path.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: implementation pending.
Recovery entrypoint: live-read organizational master prompt, this revision and current main.
Exact next action after recovery: create release branch and implement CP-1.
Rotation blockers: active product patch wave.

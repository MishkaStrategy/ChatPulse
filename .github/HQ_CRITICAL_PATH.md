---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 4
updated_at: 2026-09-02T01:15:25Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: INFERRED
handoff_status: READY
basis_ref: feature/stop-phrase-0.5.4
basis_sha: 2e6d79971ccd58619acac28551ddcf6d457c71a1
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.5.4 beta with a per-chat stop phrase that stops monitoring only for the matching chat while preserving the existing Chrome MV3 safety boundaries.

Release surface:
- Product source integrated into `main`.
- GitHub Actions artifact `ChatPulse-Chrome-v0.5.4-beta.zip`.
- Expected artifact SHA-256 `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3`.

Definition of RELEASED:
- Verified Issue #14 payload applied to the release candidate.
- Exact-head validation and packaging pass.
- Expected beta artifact is published.
- Canonical release PR is merged into live `main`.
- Post-merge live inspection confirms the 0.5.4 product state.

Mandatory release gates:
- [x] Canonical 0.5.4 candidate and payload source are unambiguous.
- [ ] Exact-head integration, validation, packaging and artifact publication succeed.
- [ ] Final product diff is reviewed against current `main` and remains inside product/security/release scope.
- [ ] Release PR is merged and post-merge `main` confirms 0.5.4.

Explicit exclusions:
- PR #17 runner-selector refactor unless proven prerequisite.
- Legacy macOS cleanup.
- Chrome Web Store, GitHub Release/tag, Safari/native packaging.

## 2. Repository Basis

Working repository: `MishkaStrategy/ChatPulse`.

Default branch: `main`.

Canonical release branch: `feature/stop-phrase-0.5.4`.

Canonical PR: #15 `Добавить стоп-фразу для остановки отдельного чата`.

Current release-candidate head: `2e6d79971ccd58619acac28551ddcf6d457c71a1`.

Current head contains two bounded bootstrap commits after the previous basis:
- `666138923d5d8925412ad600e541067175ae9e74` — portable Node.js 22 release bootstrap.
- `2e6d79971ccd58619acac28551ddcf6d457c71a1` — marker retrigger revision.

Relevant issue: #14 `Temporary verified payload for ChatPulse 0.5.4`.

Pinned payload SHA-256: `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5`.

Historical failed execution:
- Run `30872589019`, attempt 2.
- Job `100082482958`.
- Actual runner `mac-MacBook-Pro-MishkaStrategy-04`.
- Checkout PASS; Node.js 22 PASS; bootstrap FAIL at missing `gh`; downstream steps skipped.

Current Actions state:
- No new `pull_request` workflow run exists for head `2e6d79971ccd58619acac28551ddcf6d457c71a1` after connector-created commits.
- Closing and reopening PR #15 preserved the exact head and PR state but also created no new run.
- The available GitHub control surface exposes rerun of historical jobs/runs but no `workflow_dispatch` action.
- Rerunning run `30872589019` is rejected because a rerun uses the historical workflow revision that still calls missing `gh` and therefore cannot validate the portable patch.

## 3. Material Findings

- The self-hosted `[self-hosted, fast]` runner is available; runner scarcity is no longer a blocker.
- The original bootstrap defect has been repaired on PR #15 using the already-guaranteed Node.js 22 runtime for GitHub REST retrieval, base64 decoding and SHA-256 checks, while preserving source/artifact pins, archive-member count, path/root/type checks, validation, secret checks, single product commit and artifact publication.
- The current blocker is execution triggering: GitHub App/connector-created repository mutations have not produced a new Actions run for the patched head.
- Issue #14 and its seven payload comments are live and readable through GitHub control; the comments are ordered by ID and carry the same ChatGPT GitHub App provenance used for prior repository writes.
- No human-only action has yet been proven necessary because independent payload validation and alternative repository-native execution routes remain available to HQ.
- `main` remains pre-0.5.4 product state; the final product commit has not yet been created.

## 4. Release Gates

### GATE-1 — Canonical candidate and payload
Status: SATISFIED.

Evidence: PR #15 + Issue #14 + pinned source/artifact checksums.

### GATE-2 — Exact-head integration, tests and artifact
Status: UNSATISFIED.

Evidence: portable bootstrap is present on exact head `2e6d7997…`, but no new Actions execution has been created for that head. Historical attempt 2 is not valid evidence for the patched workflow.

Blocking item: establish a safe execution route for the patched exact head without weakening the release contract; in parallel validate the pinned Issue #14 payload independently where possible.

### GATE-3 — Final merge readiness
Status: UNSATISFIED.

Evidence: no final 0.5.4 product commit or exact-head artifact evidence yet; current PR mergeability must be re-evaluated after integration/current-base reconciliation.

Blocks on: GATE-2.

### GATE-4 — Merge and post-merge verification
Status: UNSATISFIED.

Blocks on: GATE-3.

## 5. Current Critical Path

### CP-1 — Establish executable exact-head 0.5.4 integration
Status: ACTIVE.

Why critical: portable workflow code exists, but the release gate cannot execute until a repository-native trigger/execution route is available.

Execution plane: HQ_DIRECT for control/routing; PROJECT_RUNNER when an exact-head run exists.

Exact scope:
1. Inspect historical PR #15 workflows/runs for a safe reusable execution bridge whose historical definition checks out the current head and executes repository-owned code, without weakening checks or mutating runner state.
2. Independently reconstruct/validate the pinned Issue #14 payload if the connector data can be materialized safely; use this to verify candidate contents/tests while preserving the mandatory Actions artifact gate.
3. If a deterministic GitHub-native trigger becomes available, execute the patched workflow on exact head `2e6d7997…`.
4. Reject unchanged rerun of the historical failed workflow and any bypass that silently drops checksum, safety, test or artifact requirements.

Acceptance condition: an exact-head integration execution reaches payload reconstruction and either completes all validation/artifact/product-commit steps or yields a new exact terminal failure that materially narrows the path.

### CP-2 — Verify final 0.5.4 product diff and release evidence
Status: PENDING.

Depends on: CP-1 successful integration.

Exact scope: inspect final changed files/diff, manifest/permissions, package/version, tests, docs, workflow evidence, artifact/checksum, reviews/threads, mergeability and current base relation.

Acceptance condition: all release evidence is present and no product/security/release blocker remains.

### CP-3 — Merge canonical 0.5.4 PR
Status: PENDING.

Depends on: CP-2.

Execution plane: deterministic GitHub control only, with exact expected head SHA.

Acceptance condition: GitHub reports merged state and merge SHA.

### CP-4 — Verify released `main` and close release state
Status: PENDING.

Depends on: CP-3.

Acceptance condition: live default branch and retained artifact evidence satisfy the complete release contract; then project state becomes DONE.

## 6. Active Execution Registry

HQ:
- Owner: HQ.
- Scope: resolve exact-head execution route and independently validate pinned payload where useful.
- Ref: PR #15 / `feature/stop-phrase-0.5.4` / `2e6d79971ccd58619acac28551ddcf6d457c71a1`.
- Write surface: no product writes until execution route is proven; HQ state writes on `main` only.

Workers: NONE.

Codex: NONE.

CI/runtime: NONE active. Historical run `30872589019` attempt 2 is terminal failure and must not be rerun unchanged as release evidence.

## 7. Safe Parallel Work

Independent useful slice: payload reconstruction/validation can proceed in parallel with execution-route investigation because it is read/verify-only and cannot conflict with the release branch. No temporary worker is required; HQ has the necessary evidence and keeping it local avoids handoff overhead.

## 8. Current Blocker

Exact blocker: no new Actions run is being emitted for connector-created PR branch mutations or PR reopen, and no manual workflow-dispatch action is exposed by the current GitHub control surface.

Affected gate: GATE-2.

Evidence:
- PR #15 head moved to `2e6d7997…` after the portable workflow and marker commits.
- `fetch_commit_workflow_runs` reports no runs for that exact head.
- Branch-scoped Actions history contains only historical runs.
- Close/reopen preserved exact head but produced no new run.
- No connected/installable workflow-dispatch capability was found.

Safe alternatives checked:
- Rerun historical job/run: rejected because it executes the historical workflow revision containing the deterministic `gh` defect.
- Install/configure runner tooling: rejected as unnecessary and less reproducible than the already-landed portable patch.
- User/manual action: not yet requested because repository-native execution bridges and independent payload validation remain to be exhausted.

Unblock condition: exact-head patched integration can be executed without weakening mandatory release gates, or a genuinely human-only GitHub Actions trigger is proven after all safe automation routes are exhausted.

Project state remains EXECUTING, not BLOCKED.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — release candidate, issue payload, workflows, runner behavior, PR state, trigger behavior and release surface are covered.

Evidence Audit: PASS — every current blocker/decision has live GitHub evidence; no completion claim depends on chat memory.

Release Alignment Audit: PASS — work remains limited to producing/verifying the 0.5.4 candidate and mandatory artifact.

Dependency & Ordering Audit: PASS — execution/validation must precede final diff approval, merge and post-merge verification.

Execution & Parallelism Audit: PASS — payload verification is the only safe independent slice; branch/product writes remain serialized.

Adversarial Audit: PASS — rejected stale-workflow rerun, weakened release gates, runner mutation, unrelated PR #17 scope creep and premature merge.

## 10. Next Action

Inspect historical PR #15 workflow definitions/jobs for a reusable exact-head execution bridge while continuing read-only reconstruction/validation of the pinned Issue #14 payload. If neither yields an executable route, escalate only the proven minimal human GitHub Actions trigger requirement.

Executor: HQ_DIRECT.

Expected evidence: either a safe reusable run/job identity or independently verified payload/test evidence plus proof that all automated trigger routes are exhausted.

## 11. Last Material Revision

What changed: portable Node.js 22 bootstrap landed on PR #15 and marker was changed, but GitHub emitted no new Actions run; closing/reopening the PR also emitted no run.

Why the path changed: the code defect is fixed, so CP-1 is now an execution-trigger/control problem rather than a workflow-portability problem.

Evidence causing change: exact PR head `2e6d7997…`, empty exact-head workflow-run result, unchanged branch Actions history, and zero-run result after reopen.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.

Last completed atomic action: persisted critical-path revision 4 after portable bootstrap landing and trigger-gap discovery.

Active external executions: NONE.

Unpersisted material reasoning: NONE at this checkpoint.

Recovery entrypoint: live-fetch PR #15 head, `.github/workflows/extension-ci.yml`, `.github/HQ_CRITICAL_PATH.md`, and Actions runs for exact head. If head remains `2e6d7997…`, continue CP-1 execution-route investigation; if head moved, inspect intervening diff before any write.

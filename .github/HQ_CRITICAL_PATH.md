---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 2
updated_at: 2026-09-02T00:49:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: INFERRED
handoff_status: READY
basis_ref: feature/stop-phrase-0.5.4
basis_sha: 8228662758041478aaf17b4e490a4007dabb4f85
---

# HQ Critical Path

## 1. Current Release Contract

Release target:

ChatPulse 0.5.4 beta: add a per-chat stop phrase that stops monitoring only for the matching chat while preserving the existing Chrome MV3 safety boundaries.

Release surface:

- Chrome Manifest V3 product source integrated into `main`.
- GitHub Actions beta artifact `ChatPulse-Chrome-v0.5.4-beta.zip`.
- Expected artifact SHA-256: `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3`.

Definition of RELEASED:

The verified 0.5.4 payload from Issue #14 has been applied to PR #15, the exact-head validation and packaging gate has succeeded, the expected beta ZIP artifact has been published, PR #15 has been merged into the live default branch, and post-merge live inspection confirms the 0.5.4 product state on `main`.

Mandatory release gates:

- [x] Canonical 0.5.4 candidate and payload source are live and unambiguous.
- [ ] Exact-head integration, validation, packaging and artifact publication succeed for PR #15.
- [ ] Final product diff is reviewed against current `main` and remains inside product/security/release scope.
- [ ] PR #15 is merged and post-merge `main` confirms the released 0.5.4 state.

Required release evidence:

- PR #15 current head and final product commit SHA.
- Successful exact-head integration workflow with completed validation steps.
- GitHub Actions artifact `ChatPulse-Chrome-v0.5.4-beta` and expected ZIP checksum.
- Final PR diff/changed-files, mergeability, reviews/threads and CI state.
- PR #15 merged state and merge SHA.
- Post-merge live `main` manifest/version and relevant release files.

Known explicit exclusions:

- PR #17 runner-selector policy refactor is not part of the 0.5.4 product release unless it becomes a proven prerequisite to unblock PR #15.
- Legacy macOS cleanup is not part of this release.
- Chrome Web Store publication, GitHub Release/tag creation, Safari packaging and native macOS packaging are not release surfaces for this local unpacked Chrome extension.

## 2. Repository Basis

Default branch:

`main`

Default branch observed SHA:

`a017ad5083248abd3d5f34ae59e0909b2fad5f6b` before HQ state-only persistence commits.

Critical-path basis ref:

`feature/stop-phrase-0.5.4`

Critical-path basis SHA:

`8228662758041478aaf17b4e490a4007dabb4f85`

Canonical integration branch, if any:

`feature/stop-phrase-0.5.4`

Canonical PR / RC, if any:

PR #15 — `Добавить стоп-фразу для остановки отдельного чата`.

Relevant open PRs:

- #15 — canonical 0.5.4 release candidate; open, non-draft, mergeable at last live inspection.
- #17 — draft repository-wide runner-selector policy; non-critical follow-up unless proven necessary for #15.

Relevant Issues:

- #14 — `Temporary verified payload for ChatPulse 0.5.4`; source payload consumed by the release workflow.

Relevant CI / workflows:

- `.github/workflows/extension-ci.yml` — canonical 0.5.4 integration/validation/artifact workflow.
- PR #15 run `30872589019`: attempt 1 was cancelled after receiving no steps; attempt 2 was explicitly started by HQ on 2026-09-02 and is currently queued.
- Attempt 2 job: `100082482958`, status `queued`, no steps assigned at last live inspection.
- `.github/workflows/docker-runner-policy.yml` — repository runner policy check; not a product release gate by itself.

Relevant release/deployment state:

- No GitHub Releases are currently published.
- Project distribution is an unpacked local Chrome extension and GitHub Actions beta ZIP.
- No production deployment surface is required for this release.

## 3. Repository Scan Summary

Project purpose:

Local dependency-free Google Chrome Manifest V3 extension that safely continues selected ChatGPT conversations using the already authenticated Chrome profile.

Architecture / major components:

- MV3 manifest and permissions in `chrome-extension/manifest.json`.
- Background service worker scheduling/recovery in `chrome-extension/background/`.
- ChatGPT DOM interaction in `chrome-extension/content/`.
- Decision/state model in `chrome-extension/lib/`.
- Popup/options UI in `chrome-extension/popup/` and `chrome-extension/options/`.
- Local-only storage; no backend or telemetry.

Build / packaging:

Node.js >=20 for validation. Current main package scripts provide syntax checks, Node tests and extension validation. Release candidate workflow reconstructs the locally verified payload, runs its `npm run audit:ci`, verifies the deterministic 0.5.4 ZIP checksum and uploads the artifact.

Tests / validation:

Main contains model, service-worker and stale-tab Node suites plus static/Manifest validation. The 0.5.4 PR contract additionally requires the prepared unit, service-worker, DOM, UI, Manifest and packaging gates on exact head.

CI:

GitHub Actions. PR #15 selects `[self-hosted, fast]`; historical exact-head attempts were cancelled without job steps. HQ has now started attempt 2, which is accepted by GitHub but remains queued without steps at the latest observation.

Release / deployment:

Artifact-based beta distribution. Historical merged 0.5.2 used GitHub Actions ZIP packaging. No current GitHub Release or production deployment is required.

Governance:

- Live organizational contract: `MishkaStrategy/.github/HQ_MASTER_PROMPT.md` v1.1 RELEASE.
- `CONTRIBUTING.md` requires local audit before PR and preserves minimal extension permissions.
- `SECURITY.md` fixes the boundary: no backend/telemetry and no broad/sensitive Chrome permissions.
- Repository `main` is not branch-protected and no repository rulesets were observed.

External release dependencies:

A usable GitHub Actions runner matching `[self-hosted, fast]` for the canonical integration workflow.

Material findings:

- `main` is still product version 0.5.2.
- PR #15 has not yet applied the product payload; its live diff is only the integration workflow plus `.release/apply-0.5.4` marker.
- PR #15 is ten product/history commits behind the pre-HQ-state `main` basis but is reported mergeable; final product diff must be re-evaluated after integration.
- PR #17 is a separate CI-policy change and is excluded from current release scope unless live evidence makes it a prerequisite.
- HQ state-only commits on `main` do not invalidate the product basis under the organizational self-invalidation rule.

## 4. Release Gates

### GATE-1 — Canonical 0.5.4 candidate and payload source

Status: SATISFIED

Evidence:

PR #15 is live on `feature/stop-phrase-0.5.4` at `8228662758041478aaf17b4e490a4007dabb4f85`. Issue #14 is live and is the payload source referenced by the workflow. The workflow pins source SHA-256 `f1a702c1bfab1c167b486bd6d7c8a722eb1800ae58c58d1b45c9a8730a7748f5` and target artifact SHA-256 `64b1285a767dcebc35b34d515c1b3cb6161000f39a19f4daa0c1cc827b4c4ed3`.

Blocking items:

None. Cryptographic validation of the payload is part of GATE-2 execution.

### GATE-2 — Exact-head integration, tests and beta artifact

Status: UNSATISFIED

Evidence:

HQ successfully requested attempt 2 of PR #15 workflow run `30872589019`. GitHub reports run attempt 2 as `queued`; new job `100082482958` is `queued` with no assigned steps. Product payload is therefore not yet integrated and no current successful 0.5.4 artifact evidence exists.

Blocking items:

The current attempt is waiting for a `[self-hosted, fast]` runner. This is an active external execution dependency, not yet a terminal project blocker.

### GATE-3 — Final merge-readiness

Status: UNSATISFIED

Evidence:

PR #15 is live, open, non-draft and mergeable with no reviews or unresolved review threads, but the expected product commit does not yet exist. Final diff/security/CI review cannot be completed until GATE-2 succeeds.

Blocking items:

GATE-2.

### GATE-4 — Merge and post-merge release verification

Status: UNSATISFIED

Evidence:

PR #15 is not merged; live product state on `main` remains version 0.5.2.

Blocking items:

GATE-3.

## 5. Current Critical Path

### CP-1 — Resolve exact PR #15 integration attempt 2

Status: ACTIVE

Release gate:

GATE-2.

Why critical:

The product payload, validation result and 0.5.4 beta artifact do not exist on the PR head until this integration succeeds. The current attempt is the shortest canonical route and is already accepted by GitHub.

Depends on:

GATE-1.

Blocks:

CP-2, CP-3 and CP-4.

Execution plane: PROJECT_RUNNER

Exact scope:

Live-observe workflow run `30872589019`, attempt 2, job `100082482958`, on exact PR #15 head `8228662758041478aaf17b4e490a4007dabb4f85`. If it succeeds, verify the pushed product commit and artifact. If it reaches a terminal failure or demonstrates runner unavailability, capture exact evidence and re-route without bypassing release/security constraints.

Acceptance condition:

Either (a) the workflow succeeds and produces the product commit plus expected artifact, or (b) a new exact terminal/runner failure provides sufficient evidence to recalculate the execution route.

Evidence:

Attempt 2 was started successfully by HQ and is queued; no steps were assigned at the last live check.

### CP-2 — Verify the integrated 0.5.4 product diff and release evidence

Status: PENDING

Release gate:

GATE-3.

Why critical:

The final product code cannot be approved for merge until the workflow-created commit exists and its exact diff, tests, permissions, packaging and artifact checksum are live-verified.

Depends on:

CP-1 successful integration.

Blocks:

CP-3.

Execution plane: HQ_DIRECT

Exact scope:

Fetch the new PR #15 head; inspect changed files/diff and relevant manifest/package/README/changelog/test surfaces; verify workflow steps, artifact identity/checksum evidence, reviews/threads, mergeability and current base relationship; reject unrelated or security-boundary changes.

Acceptance condition:

All mandatory 0.5.4 release evidence is present, no unresolved release blocker remains, and PR #15 is merge-ready on its exact live head.

Evidence:

Pending CP-1.

### CP-3 — Merge PR #15 into `main`

Status: PENDING

Release gate:

GATE-4.

Why critical:

The current release contract requires the verified 0.5.4 product state on the canonical default branch.

Depends on:

CP-2.

Blocks:

CP-4.

Execution plane: HQ_DIRECT

Exact scope:

Live-recheck PR #15 head/base/draft/mergeability/checks/reviews/threads and merge using the exact expected head SHA through the GitHub control connector.

Acceptance condition:

GitHub reports PR #15 merged and exposes the merge SHA.

Evidence:

Pending CP-2.

### CP-4 — Verify released 0.5.4 state and close release control state

Status: PENDING

Release gate:

GATE-4.

Why critical:

Merge alone is not accepted as release proof; the default branch and artifact evidence must match the release contract.

Depends on:

CP-3.

Blocks:

Project DONE.

Execution plane: HQ_DIRECT

Exact scope:

Fetch live `main`, verify version/relevant product files and merge ancestry, confirm 0.5.4 artifact evidence remains available, ensure no unresolved critical execution remains, then update this file to `DONE` if and only if all release gates are satisfied.

Acceptance condition:

Live release evidence satisfies the complete release contract.

Evidence:

Pending CP-3.

## 6. Active Execution Registry

HQ:

- Owner: HQ.
- Scope: critical-path control, live verification, persistence, PR integration and release verification.
- Ref: PR #15 / `feature/stop-phrase-0.5.4` at `8228662758041478aaf17b4e490a4007dabb4f85`.
- Write surface: `.github/HQ_CRITICAL_PATH.md` on `main`; subsequent ordinary GitHub PR lifecycle operations when gates permit.
- Expected evidence: current workflow result, final merge/release evidence.

Workers:

NONE.

Codex:

NONE.

Zero-model control:

NONE active.

CI/runtime:

- GitHub Actions run `30872589019`, attempt 2.
- Job `100082482958` — `queued` at last live inspection.
- Source: PR #15 head `8228662758041478aaf17b4e490a4007dabb4f85`.
- Write surface if job starts: branch `feature/stop-phrase-0.5.4` through the workflow's exact product integration commit.
- Expected evidence: completed validation steps, updated PR head, and artifact `ChatPulse-Chrome-v0.5.4-beta`.

## 7. Safe Parallel Work

Independent slices:

NONE — CP-1 is now active external execution. Product-diff verification cannot begin until its write completes, and a second executor touching the release branch would violate non-overlap safety.

## 8. Current Blockers

No project-level blocker is currently declared.

Active external wait:

- Exact dependency: GitHub Actions job `100082482958` requires a matching `[self-hosted, fast]` runner.
- Affected release gate: GATE-2.
- Evidence: attempt 2 is accepted and queued with no steps assigned.
- Attempted safe alternatives: canonical rerun was performed; GitHub connector exposes no runner-management capability; no parallel write is safe while the release job is active.
- Unblock condition: the job obtains a runner and completes, or reaches a terminal state that supplies exact failure evidence for rerouting.

## 9. Critical Path Audits

Repository Coverage Audit: PASS

Evidence Audit: PASS

Release Alignment Audit: PASS

Dependency & Ordering Audit: PASS

Execution & Parallelism Audit: PASS

Adversarial Audit: PASS

Material findings and resolutions:

- Wrong-release hypothesis: rejected. Active PR #15, Issue #14, the release workflow and the main preparation commit all converge on 0.5.4; historical 0.5.3 PR #13 is closed and unmerged.
- Hidden competing product work: rejected. The only other open PR is draft #17 and changes CI policy, not product behavior.
- Hidden release surface: rejected. README and historical merged 0.5.2 establish local unpacked extension + Actions ZIP distribution; no current GitHub Release exists and no production deployment is required.
- Premature merge risk: resolved by requiring the workflow-created product commit, exact-head evidence and a fresh final diff review before merge.
- Runner risk: incorporated into active CP-1. Attempt 2 is live; no claim of terminal unavailability is made while it remains queued.
- Scope creep: PR #17 and legacy cleanup explicitly excluded from current release path.

## 10. Next Action

Exact next action:

Live-check workflow run `30872589019` attempt 2 / job `100082482958`; if execution begins, verify its steps and terminal result; if terminal, integrate the exact result immediately.

Executor:

HQ observing PROJECT_RUNNER.

Expected evidence:

Job status transition, step-level execution once assigned, and a terminal success or exact failure reason.

Acceptance condition:

CP-1 reaches its acceptance condition and the critical path is recalculated from the live result.

## 11. Last Material Revision

What changed:

HQ started exact PR #15 integration attempt 2. GitHub accepted the rerun and created job `100082482958`, which is queued without steps.

Why the critical path changed:

The previous runner availability uncertainty is now an active external execution with an exact run attempt and job identity.

Evidence causing the change:

Workflow run `30872589019` reports `run_attempt: 2`, status `queued`, exact head `8228662758041478aaf17b4e490a4007dabb4f85`; job `100082482958` reports `queued` with no steps.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES

Last completed atomic action:

Started PR #15 integration attempt 2 and persisted its exact live identity/status.

Active external executions and exact refs:

- GitHub Actions run `30872589019`, attempt 2.
- Job `100082482958`, last known status `queued`.
- PR #15 head `8228662758041478aaf17b4e490a4007dabb4f85`.

Unpersisted material reasoning: NONE

Recovery entrypoint:

Live-fetch PR #15 head plus workflow run `30872589019` and job `100082482958`. Confirm whether attempt 2 is still queued, running, completed, or has pushed a new PR head.

Exact next action after recovery:

Integrate the current attempt-2 result; on success proceed to CP-2, on terminal failure recalculate CP-1 from exact evidence, and if still queued continue live observation without overlapping writes.

Rotation blockers, if any:

NONE.

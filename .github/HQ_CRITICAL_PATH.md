---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 31
updated_at: 2026-09-05T11:05:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: NOT_READY
basis_ref: main
basis_sha: d06a24b9335404422c3c07e1e5d4fe1497ce0f40
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.3 beta — replace a genuinely hung background ChatGPT tab with a new tab for the same conversation instead of reloading the broken tab.

Release surface: tab-recovery policy/model, MV3 service worker recovery implementation, deterministic recovery tests, loaded-Chromium regression gate, version/package/workflow metadata and reproducible packaging.

Definition of RELEASED: for managed background chats, hard recovery reasons (`discarded-tab`, `frozen-tab`, `content-unreachable`, `page-error`, `stuck-generation`) close the failed tab and create a fresh inactive tab for the same canonical chat URL; ordinary periodic freshness remains a soft reload; active tabs and tabs with user drafts keep the existing non-destructive protection; continuation/watchdog/token safety semantics remain unchanged; frozen branch, canonical PR merge-tree and post-merge main evidence all pass.

Mandatory release gates:

- [ ] Hard-hang recovery is explicitly classified separately from periodic freshness.
- [ ] Hard-hang recovery closes the old background tab, creates a new inactive tab for the exact same ChatGPT conversation URL, protects it from auto-discard, waits for hydration and continues inspection on the replacement tab ID.
- [ ] Active tabs are never auto-closed or auto-reloaded by this recovery path.
- [ ] A user draft still blocks destructive recovery.
- [ ] Normal ongoing generation remains untouched until the existing stuck-generation threshold is reached.
- [ ] Periodic freshness remains a reload, not tab replacement.
- [ ] Tests prove replacement-tab behavior and no regression in recovery counters, continuation at-most-once, GitHub watchdog, private-token isolation and UI behavior.
- [ ] Five deterministic audit cycles, Chromium E2E and reproducible package/provenance pass on frozen branch, PR merge-tree and main; dependency policy passes on applicable PR/main triggers.

Required release evidence: exact branch/PR/main SHAs, workflow IDs, deterministic test counts, replacement-tab assertions, browser E2E result, package/source-manifest SHA-256.

Known explicit exclusions: changing the 20-minute stuck-generation threshold; closing an active tab; discarding user drafts; changing GitHub watchdog semantics; unrelated draft PR #17.

## 2. Repository Basis

Default branch: main.
Default branch observed SHA: `d06a24b9335404422c3c07e1e5d4fe1497ce0f40`.
Validated previous product commit: `310ee9e445e14b4a2099d5aa3c515453abb05172` (0.7.2 beta).
Critical-path basis ref: main.
Critical-path basis SHA: `d06a24b9335404422c3c07e1e5d4fe1497ce0f40`.
Canonical integration branch: `release/0.7.3-replace-stuck-tab` (to create from this state commit).
Canonical PR / RC: pending.
Relevant open PRs: #17 draft remains separate/excluded.
Relevant Issues: none required for this owner-direct patch.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.
Relevant release/deployment state: 0.7.2 beta released and green; no store publication required.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture / major components: popup/options UI, MV3 service worker, pure state/model helpers, ChatGPT content script, optional Telegram and GitHub Actions integrations.
Build / packaging: deterministic Python ZIP/source-manifest packaging plus Node validation.
Tests / validation: 92 deterministic extension tests plus loaded-Chromium E2E before this patch.
CI: five deterministic audit cycles, Chromium E2E, reproducible package/provenance and dependency runner policy.
Release / deployment: validated merge to main; CI artifact is the installable beta package.
Governance: organizational HQ master 1.2 live-read for this wave.
External release dependencies: Chromium download for E2E.
Material findings: current `planTabRecovery` already protects active tabs and drafts and distinguishes hard failure reasons from `periodic-freshness`; `obtainFreshSnapshot` funnels all refreshes through `recoverAndInspect`, which currently always calls `chrome.tabs.reload`. The minimal safe change is to route hard-hang reasons to a new replacement-tab recovery helper while leaving periodic freshness on the existing reload path.

## 4. Release Gates

### GATE-1 — Safe replacement-tab recovery
Status: UNSATISFIED
Evidence: current service worker reloads the same tab for all recovery reasons.
Blocking items: hard-recovery classifier + replacement helper + state/tab-ID propagation.

### GATE-2 — Regression coverage
Status: UNSATISFIED
Evidence: current tests assert reload recovery, not close-and-reopen recovery.
Blocking items: deterministic and loaded-browser assertions.

### GATE-3 — Frozen branch validation
Status: UNSATISFIED
Evidence: branch not yet created.
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

### CP-1 — Implement hard-hang close-and-reopen recovery
Status: ACTIVE
Release gate: GATE-1, GATE-2
Why critical: directly implements the owner decision while preserving active-tab/draft safety.
Depends on: released 0.7.2 recovery behavior.
Blocks: CP-2.
Execution plane: HQ_DIRECT
Exact scope: model recovery classification, service-worker replacement helper, deterministic tests, version/release metadata.
Acceptance condition: hard failures use a new tab; periodic freshness still reloads; all existing safety tests stay green.
Evidence: pending branch SHA/workflow.

### CP-2 — Validate frozen 0.7.3 branch
Status: PENDING
Release gate: GATE-3
Depends on: CP-1
Blocks: CP-3
Execution plane: PROJECT_RUNNER
Exact scope: five deterministic audits, Chromium E2E, reproducible package/provenance.
Acceptance condition: exact branch head fully green.
Evidence: pending.

### CP-3 — Validate canonical PR merge-tree
Status: PENDING
Release gate: GATE-4
Depends on: CP-2
Blocks: CP-4
Execution plane: PROJECT_RUNNER
Exact scope: exact PR merge ref plus dependency policy/review/thread/mergeability checks.
Acceptance condition: exact merge-tree fully green with no unresolved blocker.
Evidence: pending.

### CP-4 — Merge exact head and validate main
Status: PENDING
Release gate: GATE-5
Depends on: CP-3
Blocks: DONE
Execution plane: HQ_DIRECT + PROJECT_RUNNER
Exact scope: merge only validated head, validate exact main product commit, persist final state.
Acceptance condition: all main gates green and 0.7.3 hashes recorded.
Evidence: pending.

## 6. Active Execution Registry

HQ: CP-1 canonical writer/integrator.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: NONE until frozen branch head is created.

## 7. Safe Parallel Work

NONE — recovery policy, service-worker tab lifecycle and tests are tightly coupled and should have one canonical writer.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — affected recovery/model/service-worker/test/release surfaces identified.
Evidence Audit: PASS — branch/merge-tree/main and replacement-tab evidence requirements are explicit.
Release Alignment Audit: PASS — limited to owner-requested hang recovery behavior plus necessary release hardening.
Dependency & Ordering Audit: PASS — recovery policy precedes branch validation, then PR merge-tree, then main.
Execution & Parallelism Audit: PASS — one writer avoids split ownership of tab lifecycle semantics.
Adversarial Audit: PASS — active tab and user draft remain protected; replacement is limited to hard recovery reasons; periodic freshness stays non-destructive reload.

Material findings and resolutions: replacement should preserve the canonical managed chat URL, create the new tab inactive, and return the new tab object so the existing runtime state records the new `tabId`; if replacement creation fails after the old tab is removed, the next check can recreate the managed chat via `ensureChatTab`, while the failure is surfaced rather than silently continuing.

## 10. Next Action

Exact next action: create `release/0.7.3-replace-stuck-tab`, implement CP-1, freeze exact head and start branch release gate.
Executor: HQ_DIRECT.
Expected evidence: deterministic close/create/reload policy tests plus full existing audit suite.
Acceptance condition: GATE-1 and GATE-2 satisfied and branch gate green.

## 11. Last Material Revision

What changed: owner requires hung managed tabs to be closed and replaced with a fresh tab instead of reloading the same broken tab.
Why the critical path changed: current 0.7.2 recovery always reloads the existing tab.
Evidence causing the change: live `planTabRecovery` and `recoverAndInspect` inspection on current main.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: NO.
Last completed atomic action: live-read organizational master/current project state and established the 0.7.3 release contract.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: implementation pending.
Recovery entrypoint: live-read organizational master, this revision and current main.
Exact next action after recovery: create release branch and implement CP-1.
Rotation blockers: active product patch wave.

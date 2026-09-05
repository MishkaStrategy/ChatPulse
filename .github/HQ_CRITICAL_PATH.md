---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 33
updated_at: 2026-09-05T13:25:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: NOT_READY
basis_ref: main
basis_sha: e954997515a333426457d659bf637fd529906496
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.4 beta — make the GitHub Actions watchdog scheduler durable and independent from the ordinary chat interval, and add a per-chat GitHub-only resume mode.

Release surface: scheduler/alarm lifecycle, per-chat profile/model, MV3 service-worker routing, Control Center GitHub watchdog UI, portable config, deterministic scheduler/watchdog tests, loaded-Chromium regression gate, version/package/workflow metadata and reproducible packaging.

Definition of RELEASED: ordinary monitoring and the GitHub Actions watchdog no longer reset/postpone each other's Chrome alarms; a watched chat can opt into GitHub-only mode so automatic interval checks are disabled for that chat while the watchdog remains active; manual Check Now remains explicit/manual; global Stop remains master stop; watchdog inactivity, active-run blocking, fail-closed API errors, token isolation and at-most-once restart semantics remain unchanged; frozen branch, canonical PR merge-tree and post-merge main evidence all pass.

Mandatory release gates:

- [ ] Independent alarm lifecycle: unchanged normal checks never recreate/postpone the GitHub 10-minute alarm, and unchanged watchdog checks never recreate/postpone the ordinary interval alarm.
- [ ] Per-chat `githubWatchOnly` mode excludes the chat from automatic ordinary interval checks while keeping it eligible for the GitHub watchdog.
- [ ] If every eligible chat is GitHub-only, no ordinary monitor alarm is scheduled; the GitHub watchdog alarm still is.
- [ ] Manual Check Now can still inspect a GitHub-only chat; global Start does not cause an automatic ordinary continuation for it.
- [ ] Global Stop still disables all automatic sends and clears both scheduler surfaces.
- [ ] New workflow-run activity continues to reset the restart idempotency episode indefinitely; no hard-coded restart-count cap is introduced.
- [ ] Existing active-run blocking, active->idle fresh countdown, API fail-closed behavior, private-token isolation, draft/active-tab safety and continuation at-most-once remain green.
- [ ] Five deterministic audit cycles, Chromium E2E and reproducible package/provenance pass on frozen branch, PR merge-tree and main; dependency policy passes on applicable PR/main triggers.

Required release evidence: exact branch/PR/main SHAs, workflow IDs, scheduler regression assertions, deterministic test counts, browser E2E result, package/source-manifest SHA-256.

Known explicit exclusions: changing the GitHub 10-minute poll cadence; changing the inactivity N semantics; changing the 20-minute stuck-generation threshold; closing active tabs; weakening fail-closed GitHub/token behavior; unrelated draft PR #17.

## 2. Repository Basis

Default branch: main.
Default branch observed SHA: `e954997515a333426457d659bf637fd529906496`.
Validated previous product commit: `800f6e9ead0fa119ed7cd7a82957ac058d4f2d97` (0.7.3 beta).
Critical-path basis ref: main.
Critical-path basis SHA: `e954997515a333426457d659bf637fd529906496`.
Canonical integration branch: `release/0.7.4-independent-actions-watchdog` (to create from this state checkpoint).
Canonical PR / RC: pending.
Relevant open PRs: #17 draft remains separate/excluded.
Relevant Issues: none required for this owner-direct regression patch.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.
Relevant release/deployment state: 0.7.3 beta released and green; no Chrome Web Store publication required by current project policy.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture / major components: popup/options UI, MV3 service worker, pure state/model helpers, ChatGPT content script, optional Telegram and GitHub Actions integrations.
Build / packaging: deterministic Python ZIP/source-manifest packaging plus Node validation.
Tests / validation: 102 deterministic extension tests plus loaded-Chromium E2E before this patch.
CI: five deterministic audit cycles, Chromium E2E, reproducible package/provenance and dependency runner policy.
Release / deployment: validated merge to main; CI artifact is the installable beta package.
Governance: organizational HQ master 1.2 live-read for this wave.
External release dependencies: Chromium download for E2E.
Material findings: `configureAlarm()` currently clears both `chatpulse-monitor` and `chatpulse-github-actions-watchdog` before recreating them. Therefore each ordinary check postpones the watchdog alarm and each watchdog check postpones the ordinary alarm. Whichever cadence fires more frequently can starve the other indefinitely. The watchdog is also coupled to `state.enabled`/`chat.enabled`, so the safe GitHub-only design is per-chat exclusion from the ordinary automatic scheduler while preserving the master engine/watchdog eligibility and master Stop semantics.

## 4. Release Gates

### GATE-1 — Independent scheduler lifecycle
Status: UNSATISFIED
Evidence: current `configureAlarm()` unconditionally clears both alarm names and recreates them.
Blocking items: idempotent per-alarm synchronization plus deterministic starvation regression coverage.

### GATE-2 — GitHub-only resume mode
Status: UNSATISFIED
Evidence: current profile has no mode that disables ordinary automatic interval checks while preserving watchdog eligibility.
Blocking items: additive profile field/UI, scheduler filtering and portable-config coverage.

### GATE-3 — Frozen branch validation
Status: UNSATISFIED
Evidence: release branch not yet created.
Blocking items: GATE-1 and GATE-2.

### GATE-4 — Canonical PR merge-tree
Status: UNSATISFIED
Evidence: no 0.7.4 PR yet.
Blocking items: GATE-3.

### GATE-5 — Post-merge main
Status: UNSATISFIED
Evidence: not merged.
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1 — Fix scheduler starvation and add GitHub-only per-chat mode
Status: ACTIVE
Release gate: GATE-1, GATE-2
Why critical: directly fixes the reported watchdog stoppage and owner-requested no-general-interval mode.
Depends on: released 0.7.3 behavior.
Blocks: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: model/profile, service-worker alarm synchronization/routing, Control Center watchdog controls/status, portable config, deterministic tests, release metadata.
Acceptance condition: independent alarms remain scheduled across opposite-path checks; GitHub-only chats receive no automatic ordinary interval continuation but remain watchdog-eligible; all safety contracts stay green.
Evidence: pending branch SHA/workflow.

### CP-2 — Validate frozen 0.7.4 branch
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
Acceptance condition: all main gates green and 0.7.4 hashes recorded.
Evidence: pending.

## 6. Active Execution Registry

HQ: CP-1 canonical writer/integrator.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: NONE until frozen branch head is created.

## 7. Safe Parallel Work

NONE — scheduler lifecycle, profile semantics, service-worker routing and UI/tests are tightly coupled; split writers would create avoidable overlap on the same state contract.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — scheduler/model/service-worker/UI/portable-config/tests/release metadata/workflow/package surfaces identified; unrelated PR #17 excluded.
Evidence Audit: PASS — root cause is directly visible in live `configureAlarm()` and current profile/watchdog eligibility code; previous 0.7.3 release evidence remains intact.
Release Alignment Audit: PASS — scope is limited to the reported Actions stoppage plus the requested GitHub-only mode and necessary regression/release hardening.
Dependency & Ordering Audit: PASS — scheduler/profile implementation precedes frozen validation, then PR merge-tree, then exact main validation.
Execution & Parallelism Audit: PASS — one canonical writer is appropriate for coupled scheduler/state/UI changes; project runners provide deterministic validation.
Adversarial Audit: PASS — master Stop remains authoritative; GitHub-only mode does not bypass completion guards or API fail-closed behavior; manual checks remain explicit; no new permissions/network write surface is introduced.

Material findings and resolutions: the robust fix is not a larger delay but idempotent per-alarm synchronization that preserves an existing alarm when its desired period is unchanged. GitHub-only is modeled as an additive per-chat profile flag, default false, valid only with an enabled GitHub watcher; it suppresses ordinary automatic scheduling for that chat rather than disabling the master engine.

## 10. Next Action

Exact next action: create `release/0.7.4-independent-actions-watchdog`, implement CP-1, freeze exact head and start the branch release gate.
Executor: HQ_DIRECT + PROJECT_RUNNER.
Expected evidence: starvation regression tests, GitHub-only scheduler tests, full extension audit.
Acceptance condition: GATE-1 and GATE-2 satisfied and branch gate green.

## 11. Last Material Revision

What changed: owner reported the GitHub Actions watchdog resumed the chat twice and then stopped, and requested a GitHub-only resume mode without ordinary interval checks.
Why the critical path changed: live code inspection found mutual Chrome-alarm starvation caused by unconditional dual-alarm reset and no current profile mode for interval exclusion.
Evidence causing the change: current `service-worker-v2.js` `configureAlarm()` plus live model/profile/watchdog eligibility code on `main`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: NO.
Last completed atomic action: live-read organizational master/current repository state, reproduced the scheduler design defect from source and established the verified 0.7.4 release contract.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: implementation pending.
Recovery entrypoint: live-read organizational master, this revision and current main.
Exact next action after recovery: create the 0.7.4 release branch and implement CP-1.
Rotation blockers: active product patch wave.

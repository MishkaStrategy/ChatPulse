---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 64
updated_at: 2026-09-09T05:10:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.8-draftless-go
basis_sha: 92268611618498b2665ef03809a034c8d7a9ba39
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.8 beta — continuation must never stop because the ChatGPT composer contains text, and the stock continuation command becomes `go`.

Release surface:
- remove composer-draft protection as a continuation/restart blocker;
- automatic continuation may replace whatever text is currently in the composer and submit the configured continuation command;
- draft presence must not suppress tab freshness recovery;
- default global continuation command is exactly `go`;
- the exact legacy stock command `продолжай и не останавливайся до технического лимита` migrates to `go` when existing state or a portable config is normalized;
- non-legacy custom global commands and per-chat command overrides remain supported;
- 0.7.8 metadata, tests, Chromium E2E, reproducible package/provenance, canonical PR/merge and exact-main proof.

Definition of RELEASED:
- no runtime path can cancel the normal continuation send merely because the composer contains a draft;
- the content snapshot presented to the current runtime never marks a draft as blocking;
- periodic tab recovery ignores legacy `hasDraft=true` evidence;
- new/default state uses `go` and existing installations carrying the exact old stock default are migrated to `go` without overwriting genuinely custom commands;
- exact candidate and exact merged main pass all mandatory release evidence.

Mandatory release gates:
- [ ] draftless continuation behavior passes focused/full validation;
- [ ] `go` default + legacy migration passes focused/full validation;
- [ ] exact frozen 0.7.8 candidate passes 5/5 audits, Chromium MV3 E2E and reproducible package/provenance;
- [ ] canonical PR checks/reviews/merge safety pass and exact validated head merges;
- [ ] exact post-merge main release/dependency gates pass and canonical inner hashes reproduce frozen candidate.

Required release evidence: exact SHAs, focused/full test output, release/dependency workflow runs, artifact ID, inner ZIP/source-manifest SHA-256.

Known explicit exclusions: no changes to stop-phrase/task completion guards, GitHub PAT/watchdog credential semantics, Telegram, auth grace, chat URL rebind semantics, or unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA before this release: `699d9a60aaf2927839ae6ad8427aaa751e1d91ff`; it differs from the 0.7.7 product basis only by terminal HQ state.
Critical-path basis ref: `release/0.7.8-draftless-go`.
Critical-path basis SHA: `92268611618498b2665ef03809a034c8d7a9ba39`.
Canonical integration branch: `release/0.7.8-draftless-go`.
Canonical PR / RC: NONE yet.
Relevant open PRs: draft #17 remains unrelated/excluded.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`, dependency runner policy.
Relevant prior release: ChatPulse 0.7.7 beta terminally VERIFIED under r63.

## 3. Repository Scan Summary

Project purpose: Chrome MV3 watchdog/continuation control for configured ChatGPT chats with task guards and optional GitHub Actions watchdog.

Critical architecture inspected:
- `chrome-extension/content/content-script.js` reports composer state and performs `CHATPULSE_SEND`;
- `chrome-extension/lib/model-v2.js` owns defaults/state normalization and tab-recovery planning;
- `chrome-extension/background/service-worker-v2.js` contains legacy `hasDraft` restart guards, which become inert with current content snapshots but remain a compatibility concern to verify adversarially;
- tests under `tests/chrome-extension/` plus release validator/Chromium E2E establish release evidence.

Material findings:
- owner runtime evidence shows ChatPulse typed its own stock continuation text into the composer, then a later GitHub restart path interpreted that text as a user draft and repeatedly logged `restart отложен: в поле ввода есть пользовательский черновик`;
- content script independently refused `CHATPULSE_SEND` whenever the composer was non-empty;
- tab recovery also treated `hasDraft=true` as a reason not to refresh;
- stock command in live source was exactly `продолжай и не останавливайся до технического лимита`;
- branch implementation now forces `hasDraft:false`, removes send cancellation on non-empty composer, removes draft suppression from `planTabRecovery`, sets `DEFAULT_COMMAND="go"`, migrates the exact old stock global command on state/config normalization, and adds focused regression coverage.

Build / packaging: deterministic Python package script, Chrome MV3 ZIP.
Tests / validation: Node syntax/unit/integration/task/watchdog/token/UI tests, Chromium loaded-extension E2E, static release audit, reproducible package/provenance.
CI: five full audit cycles + Chromium E2E + package/provenance; dependency policy separately.
Governance: live organizational HQ master v1.2; this file is the persistent control checkpoint.

## 4. Release Gates

### GATE-1 — Draftless continuation
Status: UNSATISFIED
Evidence: branch commits through `92268611618498b2665ef03809a034c8d7a9ba39`; focused regression test added.
Blocking items: independent CI/browser validation and adversarial verification that no current runtime path still blocks on composer draft.

### GATE-2 — Default `go` and legacy migration
Status: UNSATISFIED
Evidence: `DEFAULT_COMMAND` changed to `go`; exact legacy stock global command migrates on state/config normalization; existing model test expectation updated.
Blocking items: focused/full validation.

### GATE-3 — Frozen 0.7.8 candidate
Status: UNSATISFIED
Blocking items: 0.7.8 metadata + exact candidate CI/provenance.

### GATE-4 — Canonical PR integration
Status: UNSATISFIED
Blocking items: GATE-3.

### GATE-5 — Post-merge exact-main proof
Status: UNSATISFIED
Blocking items: GATE-4.

## 5. Current Critical Path

### CP-1 — Verify/finish draftless continuation + `go` migration
Status: VERIFYING
Release gate: GATE-1, GATE-2.
Why critical: directly fixes the owner-observed false stop and applies the requested stock command.
Depends on: NONE.
Blocks: CP-2.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: content-script draft send behavior; model default/migration/recovery behavior; focused tests. Remove any remaining release-critical draft blocker discovered by validation.
Acceptance condition: unit/static/runtime evidence proves composer content cannot cancel continuation or recovery, default/migration semantics are exact, custom commands remain intact.
Evidence: commits `be80a5f...`, `693ed0c...`, `c0b5be9...`, `9226861...`.

### CP-2 — Advance 0.7.8 metadata and freeze candidate
Status: PENDING
Release gate: GATE-3.
Why critical: establishes release artifact/evidence.
Depends on: CP-1 implementation surface stable.
Blocks: CP-3.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Exact scope: version/package/validator/workflow metadata only plus required test wiring.
Acceptance condition: exact candidate passes 5/5 audits, Chromium E2E, reproducible package/provenance; artifact/hash evidence captured.

### CP-3 — Canonical PR integration
Status: PENDING
Release gate: GATE-4.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT + PROJECT_RUNNER.
Acceptance condition: exact validated head, checks/reviews/threads/mergeability green, expected-head merge.

### CP-4 — Exact post-merge main proof
Status: PENDING
Release gate: GATE-5.
Depends on: CP-3.
Execution plane: PROJECT_RUNNER.
Acceptance condition: exact-main release/dependency runs green and canonical inner hashes exactly match frozen candidate.

## 6. Active Execution Registry

HQ: active owner of product patch, release metadata, audits, PR/merge and release proof.
Workers: NONE — scope is compact and overlapping; no useful independent worker slice.
Codex: NONE — direct connector path is sufficient; previous 0.7.7 Codex failures are not reused.
Zero-model control: NONE.
CI/runtime: no 0.7.8 release run yet; metadata/workflow trigger is next.

## 7. Safe Parallel Work

NONE — remaining product/test/metadata writes share one release branch and must remain serialized before freeze.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — affected content/model/background/test/release surfaces inspected incrementally from live main.
Evidence Audit: PASS — owner screenshot/log evidence is corroborated by exact live source guards and stock command constant.
Release Alignment Audit: PASS — patch is limited to draftless continuation and `go` default/migration plus release evidence.
Dependency & Ordering Audit: PASS — product behavior before metadata/freeze; freeze before PR/merge/main proof.
Execution & Parallelism Audit: PASS — one HQ writer, no duplicate executor or conflicting worker.
Adversarial Audit: PASS — covers self-authored composer text, genuine user draft, legacy `hasDraft=true` recovery evidence, existing installations with old stock global command, portable config migration, and preservation of custom commands.
Material findings and resolutions: destructive overwrite of a genuine composer draft is intentional owner policy for this release; continuation wins over composer content.

## 10. Next Action

Exact next action: inspect/advance every established 0.7.7 release metadata surface to 0.7.8, ensure focused regression test is included by the standard test glob, then launch exact branch release CI.
Executor: HQ.
Expected evidence: exact branch head, metadata diff, terminal audit/E2E/package jobs.
Acceptance condition: no candidate freeze claim before exact CI/provenance is green.

## 11. Last Material Revision

What changed: owner opened a new release objective after observing repeated draft-induced restart deferrals; HQ created `release/0.7.8-draftless-go` and implemented the first product/regression-test slice.
Why the critical path changed: 0.7.7 is complete; the owner reported a new release-critical runtime defect and requested a new stock continuation command.
Evidence causing the change: runtime screenshot/logs plus live source in content script/model/service worker.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: focused regression test added on branch head `92268611618498b2665ef03809a034c8d7a9ba39` and r64 persisted.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r64 + `release/0.7.8-draftless-go@92268611618498b2665ef03809a034c8d7a9ba39`.
Exact next action after recovery: advance 0.7.8 metadata/workflow and run exact candidate validation.
Rotation blockers: NONE.

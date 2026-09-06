---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 39
updated_at: 2026-09-06T08:48:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.7.5-post-open-auth-warmup
basis_sha: 30f0db2532786b3e9d876d7a151afba3ba593ac7
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.5 beta — eliminate the shipped watchdog auth race that can log `restart отложен: в профиле Chrome не выполнен вход` immediately after ChatPulse opens a fresh ChatGPT tab.

Release surface: bounded GitHub-watchdog auth-grace planner, focused regressions, 0.7.5 extension/package metadata and ordinary release CI.

Definition of RELEASED: whenever an eligible watchdog restart first observes `authenticated: false`, that restart episode receives exactly one non-extending 60-second warm-up from that first unauthenticated observation. Time already spent loading/hydrating the document cannot consume that minute. During grace no command is sent. The same `restartKey` cannot receive a second grace after expiry. At expiry the targeted watchdog path performs a fresh GitHub Actions read before send eligibility. If ChatGPT still reports unauthenticated, restart remains fail-closed. New workflow activity, successful restart, watcher reset and global Stop retain their existing invalidation behavior; at-most-once dispatch remains intact.

Mandatory release gates:
- [x] planner guarantees a full 60 seconds from first unauthenticated restart observation rather than from `documentStartedAt`;
- [x] focused unit regression proves a 45-second-old document still receives 60, document age cannot consume the grace, same-episode grace cannot extend/restart, authenticated pages get no grace;
- [x] manifest/package/workflow metadata targets 0.7.5 beta;
- [ ] frozen release branch exact-head CI is green;
- [ ] canonical PR exact merge-ref, reviews/threads and mergeability are green;
- [ ] exact post-merge main release evidence is green.

Required release evidence: exact SHAs/run IDs, deterministic suite, Chromium MV3 E2E, reproducible package/provenance, PR review/thread state and exact post-merge main CI.

Known explicit exclusions: do not weaken the authenticated send gate; do not change GitHub poll cadence, inactivity thresholds, scheduler behavior, credential boundaries, Telegram behavior, tab recovery or unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Default branch product basis before this patch: `2b5527fdc3daa6f8b5aefc0b37c474ac12e8c7e8` (subsequent main changes are HQ state-only).
Critical-path basis ref: `release/0.7.5-post-open-auth-warmup`.
Critical-path basis SHA: `30f0db2532786b3e9d876d7a151afba3ba593ac7`.
Canonical integration branch: `release/0.7.5-post-open-auth-warmup`.
Canonical PR / RC: pending branch validation.
Relevant open PRs: draft #17 excluded.
Relevant Issues: retired #14 excluded.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`; exact branch run `34022809958`.
Relevant release/deployment state: branch validation active; no merge performed.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog.

Architecture / major components: watchdog restart in `service-worker-v2.js`; bounded grace planning in `github-restart-grace.js`; content snapshot exposes auth state; model persists grace key/deadline; Node and loaded-Chromium tests cover release behavior.

Build / packaging: Node static/test audit plus deterministic Python ZIP/source-manifest package.

Tests / validation: deterministic extension suite, focused `github-restart-grace.test.mjs`, service-worker integration and Chromium MV3 E2E.

CI: release workflow now targets 0.7.5 branch/main, five deterministic audit cycles, browser E2E, then reproducible package/provenance.

Governance: live organizational HQ master v1.2; `MishkaStrategy/ChatPulse` is the sole working repository.

External release dependencies: GitHub Actions runners.

Material findings: 0.7.4 had the correct one-shot/non-extending machinery, but initial deadline was `documentStartedAt + 60s`. A slow load could therefore spend most of the grace before the watchdog even obtained the unauthenticated snapshot. The bounded repair keeps the existing service-worker alarm/revalidation path and changes only the planner's initial clock origin to `now + 60s` on first unauthenticated observation for the restart key.

## 4. Release Gates

### GATE-1 — Behavior implementation
Status: SATISFIED
Evidence: branch helper commit lineage through `30f0db2...`; focused tests updated. Existing service-worker integration remains unchanged and exercises one-shot alarm + fresh GitHub retry.
Blocking items: none.

### GATE-2 — Frozen branch validation
Status: UNSATISFIED
Evidence: run `34022809958` on exact `30f0db2532786b3e9d876d7a151afba3ba593ac7`; five self-hosted audit jobs plus Chromium E2E are queued.
Blocking items: CI terminal success and downstream package/provenance.

### GATE-3 — Canonical PR
Status: UNSATISFIED
Evidence: PR intentionally not opened before frozen branch validation.
Blocking items: GATE-2.

### GATE-4 — Post-merge main
Status: UNSATISFIED
Evidence: none yet.
Blocking items: GATE-3.

## 5. Current Critical Path

### CP-1 — Implement full restart auth warm-up
Status: DONE
Release gate: GATE-1.
Why critical: fixes the reported race without changing send authorization semantics.
Depends on: none.
Blocks: CP-2.
Execution plane: HQ_DIRECT.
Exact scope: planner, focused test, 0.7.5 manifest/package/workflow metadata and release-validation adapter.
Acceptance condition: one 60-second non-extending grace per unauthenticated restart key; authenticated pages no grace; expiry remains fail-closed and fresh-revalidated.
Evidence: exact branch head `30f0db2...`.

### CP-2 — Validate frozen release branch
Status: VERIFYING
Release gate: GATE-2.
Why critical: exact candidate must pass repository-native release gates.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34022809958` on exact head `30f0db2...`.
Acceptance condition: all five audits + Chromium E2E + reproducible package/provenance succeed.
Evidence: active run `34022809958`.

### CP-3 — Validate and merge canonical PR
Status: PENDING
Release gate: GATE-3.
Depends on: CP-2.
Blocks: CP-4.
Execution plane: HQ_DIRECT.
Exact scope: open PR only after frozen-head success; verify exact head/base/diff/reviews/threads/CI/mergeability, then merge when ready.
Acceptance condition: merged only from validated exact candidate.
Evidence: pending.

### CP-4 — Validate exact post-merge main
Status: PENDING
Release gate: GATE-4.
Depends on: CP-3.
Blocks: release closure.
Execution plane: PROJECT_RUNNER.
Exact scope: exact main 0.7.5 release CI and provenance.
Acceptance condition: mandatory main evidence green on exact product merge SHA.
Evidence: pending.

## 6. Active Execution Registry

HQ: no active write; next action depends on branch CI result.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: GitHub Actions run `34022809958`, ref `release/0.7.5-post-open-auth-warmup`, SHA `30f0db2532786b3e9d876d7a151afba3ba593ac7`; expected evidence is five deterministic audit successes, Chromium E2E success and package/provenance success.

## 7. Safe Parallel Work

NONE — opening/merging the canonical PR before the frozen exact-head gate would violate release ordering; no independent critical slice remains while branch CI is active.

## 8. Current Blockers

NONE. Current state is external CI wait, not BLOCKED.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — relevant planner, service-worker retry/alarm path, content auth gate, runtime state, focused tests, package metadata and release workflow inspected.

Evidence Audit: PASS — owner runtime report plus exact main code/test evidence identified the timing-origin defect; branch diff and exact CI run are live.

Release Alignment Audit: PASS — patch changes only auth warm-up timing plus required release/test metadata.

Dependency & Ordering Audit: PASS — implementation → exact frozen branch CI → PR → merge → exact main CI.

Execution & Parallelism Audit: PASS — HQ direct bounded writes completed; repository runner now owns validation; no duplicate execution.

Adversarial Audit: PASS — delay cannot cause an unauthorized send, same restart key cannot extend/restart grace, authenticated pages bypass grace, expiry still routes through fresh GitHub Actions check and true logout remains fail-closed.

Material findings and resolutions: the first r38 design considered carrying an explicit tab-open timestamp through the service worker, but the smaller verified repair is stronger against all load-duration races: the already-existing one-shot grace begins on the first unauthenticated watchdog observation. It changes no service-worker send path and remains bounded by restart key.

## 10. Next Action

Exact next action: live-reconcile run `34022809958`; on full success open the canonical 0.7.5 PR from exact head `30f0db2...` to current main.
Executor: HQ.
Expected evidence: terminal job conclusions and package/provenance.
Acceptance condition: no PR created until frozen candidate is green.

## 11. Last Material Revision

What changed: CP-1 completed; candidate frozen at `30f0db2...`; 0.7.5 release CI started.
Why the critical path changed: implementation is complete and execution moved to validation.
Evidence causing the change: exact branch commits and run `34022809958`.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: froze 0.7.5 candidate `30f0db2...` and launched repository-native release validation.
Active external executions and exact refs: run `34022809958` on `release/0.7.5-post-open-auth-warmup` at `30f0db2532786b3e9d876d7a151afba3ba593ac7`.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live master + r39 + exact branch run `34022809958`.
Exact next action after recovery: inspect terminal CI; if fully green, create canonical PR; if red, inspect exact failing job and repair only the evidenced cause.
Rotation blockers: NONE.

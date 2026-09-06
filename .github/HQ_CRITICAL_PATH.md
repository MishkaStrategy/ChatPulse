---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 40
updated_at: 2026-09-06T08:53:00Z
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

Release surface: bounded GitHub-watchdog auth-grace planner, focused regressions, 0.7.5 extension/package metadata and repository-native release CI.

Definition of RELEASED: whenever an eligible watchdog restart first observes `authenticated: false`, that restart episode receives exactly one non-extending 60-second warm-up from that first unauthenticated observation. Time already spent loading/hydrating the document cannot consume that minute. During grace no command is sent. The same `restartKey` cannot receive a second grace after expiry. At expiry the targeted watchdog path performs a fresh GitHub Actions read before send eligibility. If ChatGPT still reports unauthenticated, restart remains fail-closed. New workflow activity, successful restart, watcher reset and global Stop retain their existing invalidation behavior; at-most-once dispatch remains intact.

Mandatory release gates:
- [x] planner guarantees a full 60 seconds from first unauthenticated restart observation rather than from `documentStartedAt`;
- [x] focused unit regression proves a 45-second-old document still receives 60 seconds, document age cannot consume the grace, same-episode grace cannot extend/restart, authenticated pages get no grace;
- [x] manifest/package/workflow metadata targets 0.7.5 beta;
- [x] frozen candidate Chromium MV3 E2E is green;
- [ ] five frozen-candidate deterministic audit cycles are green;
- [ ] frozen-candidate reproducible package/provenance is green;
- [ ] canonical PR exact merge-ref, reviews/threads and mergeability are green;
- [ ] exact post-merge main release evidence is green.

Required release evidence: exact SHAs/run IDs, deterministic suite, Chromium MV3 E2E, reproducible package/provenance, PR review/thread state and exact post-merge main CI.

Known explicit exclusions: do not weaken the authenticated send gate; do not change GitHub poll cadence, inactivity thresholds, scheduler behavior, credential boundaries, Telegram behavior, tab recovery or unrelated draft PR #17.

## 2. Repository Basis

Default branch: `main`.
Default branch observed SHA before this state-only checkpoint: `a0a048d94867b94dd0f3744dda9323c84a2155ac`.
Product basis before 0.7.5 patch: `2b5527fdc3daa6f8b5aefc0b37c474ac12e8c7e8`; intervening main commits are HQ state-only.
Critical-path basis ref: `release/0.7.5-post-open-auth-warmup`.
Critical-path basis SHA: `30f0db2532786b3e9d876d7a151afba3ba593ac7`.
Canonical integration branch: `release/0.7.5-post-open-auth-warmup`.
Canonical PR / RC: pending frozen branch validation.
Relevant open PRs: draft #17 excluded.
Relevant Issues: retired #14 excluded.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`; exact branch run `34022809958`.
Relevant release/deployment state: branch validation active; no merge performed.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner with optional GitHub Actions watchdog.

Architecture / major components: watchdog restart in `service-worker-v2.js`; bounded grace planning in `github-restart-grace.js`; content snapshot exposes auth state; model persists grace key/deadline; Node and loaded-Chromium tests cover release behavior.

Build / packaging: Node static/test audit plus deterministic Python ZIP/source-manifest package.

Tests / validation: deterministic extension suite, focused `github-restart-grace.test.mjs`, service-worker integration and Chromium MV3 E2E.

CI: 0.7.5 release workflow has five deterministic audit cycles on `[self-hosted, fast]`, Chromium MV3 E2E on GitHub-hosted Ubuntu, then reproducible package/provenance.

Governance: live organizational HQ master v1.2; `MishkaStrategy/ChatPulse` is the sole working repository.

External release dependencies: GitHub Actions runner capacity.

Material findings: 0.7.4 had correct one-shot/non-extending machinery, but its initial deadline was tied to document age. The 0.7.5 repair keeps the existing alarm/revalidation/send path and changes only the initial clock origin to the first unauthenticated watchdog observation for a restart key. Frozen candidate browser E2E has independently passed. Five deterministic jobs are currently queued for the repository's self-hosted `fast` runner class; there are no other in-progress ChatPulse workflow runs, so this is an external runner-capacity wait rather than evidence of product failure.

## 4. Release Gates

### GATE-1 — Behavior implementation
Status: SATISFIED
Evidence: exact candidate `30f0db2532786b3e9d876d7a151afba3ba593ac7`; focused tests and 0.7.5 release metadata are present.
Blocking items: none.

### GATE-2 — Frozen branch validation
Status: UNSATISFIED
Evidence: run `34022809958` on exact candidate `30f0db2532786b3e9d876d7a151afba3ba593ac7`; Chromium MV3 browser E2E job `101458397716` completed SUCCESS. Five deterministic audit jobs `101458397552`, `101458397615`, `101458397623`, `101458397654`, `101458397734` remain queued on `[self-hosted, fast]`. Package/provenance is downstream and has not started.
Blocking items: terminal success of the five deterministic jobs and downstream package/provenance.

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
Evidence: exact branch head `30f0db2532786b3e9d876d7a151afba3ba593ac7`.

### CP-2 — Validate frozen release branch
Status: VERIFYING
Release gate: GATE-2.
Why critical: exact candidate must pass repository-native release gates.
Depends on: CP-1.
Blocks: CP-3.
Execution plane: PROJECT_RUNNER.
Exact scope: run `34022809958` on exact head `30f0db2532786b3e9d876d7a151afba3ba593ac7`.
Acceptance condition: all five deterministic audits + Chromium E2E + reproducible package/provenance succeed.
Evidence: browser E2E SUCCESS; five deterministic jobs queued; package pending.

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

HQ: no active write after this checkpoint; next action depends on branch CI result.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: GitHub Actions run `34022809958`, ref `release/0.7.5-post-open-auth-warmup`, SHA `30f0db2532786b3e9d876d7a151afba3ba593ac7`. Browser E2E is SUCCESS. Five self-hosted deterministic audit jobs are queued. Expected next event: one or more queued jobs acquire `[self-hosted, fast]` runners and complete, followed by package/provenance when prerequisites are green.

## 7. Safe Parallel Work

NONE — opening/merging the canonical PR before the frozen exact-head gate would violate release ordering; changing runner routing solely to avoid a short external capacity wait would mutate the frozen candidate and add unnecessary CI/governance surface. Duplicate execution is prohibited while the canonical run is queued.

## 8. Current Blockers

NONE. Current state is external CI wait, not `BLOCKED`.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — relevant planner, service-worker retry/alarm path, content auth gate, runtime state, focused tests, package metadata and release workflow inspected.

Evidence Audit: PASS — owner runtime report plus exact source/test evidence identified the timing-origin defect; exact frozen SHA and CI identities are recorded.

Release Alignment Audit: PASS — patch changes only auth warm-up timing plus required release/test metadata.

Dependency & Ordering Audit: PASS — implementation → exact frozen branch CI → PR → merge → exact main CI.

Execution & Parallelism Audit: PASS — canonical run retained; no duplicate rerun or premature PR; self-hosted capacity wait is observed rather than bypassed.

Adversarial Audit: PASS — delay cannot cause an unauthorized send, same restart key cannot extend/restart grace, authenticated pages bypass grace, expiry still routes through fresh GitHub Actions check and true logout remains fail-closed.

Material findings and resolutions: browser E2E independently passed on exact candidate. Five deterministic audit cycles remain queued due to unavailable matching runner capacity. No product failure is evidenced and no governance-safe critical-path action is unblocked before those jobs finish.

## 10. Next Action

Exact next action: on next invocation or relevant Actions event, live-reconcile run `34022809958`; if all five deterministic jobs and package/provenance are green, create the canonical 0.7.5 PR from exact head `30f0db2532786b3e9d876d7a151afba3ba593ac7` to current main. If any job fails, inspect that exact failing job and repair only the evidenced cause.
Executor: HQ.
Expected evidence: terminal deterministic job conclusions and package/provenance.
Acceptance condition: no PR created until frozen candidate is fully green.

## 11. Last Material Revision

What changed: Chromium MV3 E2E on frozen candidate closed SUCCESS; deterministic audit jobs remain queued on self-hosted fast runners.
Why the critical path changed: GATE-2 gained independent browser evidence but is not yet complete.
Evidence causing the change: run `34022809958`, job `101458397716` SUCCESS; five exact deterministic job IDs remain queued.

## 12. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: live-reconciled frozen run and persisted browser-success/runner-wait evidence.
Active external executions and exact refs: run `34022809958` on `release/0.7.5-post-open-auth-warmup` at `30f0db2532786b3e9d876d7a151afba3ba593ac7`; deterministic jobs `101458397552`, `101458397615`, `101458397623`, `101458397654`, `101458397734` queued; browser job `101458397716` SUCCESS.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live organizational master + r40 + exact run `34022809958`.
Exact next action after recovery: inspect run `34022809958`; on full frozen-candidate success open canonical PR, otherwise diagnose exact red job only.
Rotation blockers: NONE.

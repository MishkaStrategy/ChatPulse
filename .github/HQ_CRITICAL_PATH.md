---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 37
updated_at: 2026-09-05T16:15:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: c85b96a56acfdabb91546970f275490b2c666562
---

# HQ Critical Path

## 1. Current Release Contract
Release target: ChatPulse 0.7.4 beta — independent GitHub Actions scheduling, per-chat GitHub-only resume mode, lossless scheduler-trigger serialization, and bounded post-open ChatGPT authentication warm-up.

Definition of RELEASED: ordinary and GitHub alarms do not reset or suppress each other; GitHub-only chats receive no automatic ordinary interval checks; concurrent scheduler triggers retain their own source/parameters; more than two independent workflow inactivity episodes can continue restarting; a fresh unauthenticated ChatGPT document receives one non-extending 60-second grace per restart episode; grace expiry forces a fresh targeted GitHub Actions read before restart eligibility/send; true logout after grace stays fail-closed; master Stop, active-run blocking, private-token isolation, draft/active-tab safety, stuck-tab recovery and durable at-most-once dispatch remain intact; frozen branch, canonical PR and post-merge main evidence are green.

Mandatory gates:
- [x] independent ordinary/GitHub alarm lifecycle;
- [x] per-chat **Только GitHub Actions** mode;
- [x] lossless simultaneous-trigger serialization;
- [x] more than two independent workflow inactivity episodes can restart;
- [x] one bounded 60-second post-open auth grace with no deadline extension;
- [x] grace retry performs a fresh targeted GitHub Actions read before send;
- [x] frozen branch exact-head release gate;
- [x] canonical PR #28 exact merge-ref gate, reviews/threads and mergeability;
- [x] exact post-merge main release gate and reproducible provenance.

Required release evidence is satisfied below.

Explicit exclusions retained: normal GitHub poll cadence remains approximately 10 minutes; only the explicit post-open grace retry may force one bounded extra repository read. Inactivity N semantics, the 20-minute stuck-generation threshold, credential boundary and unrelated draft PR #17 remain unchanged.

## 2. Repository Basis
Default branch: `main`.
Validated product main SHA: `c85b96a56acfdabb91546970f275490b2c666562`.
Canonical release branch: `release/0.7.4-independent-actions-watchdog`.
Frozen branch head: `0f8bac313191a52b4c4ea4c71941ac6c129d33e5`.
Canonical PR: #28, merged.
Validated PR merge-ref: `a72f3d753d655cd8a70b918761a362ee0c51379c`.
Relevant workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.
Dependency routing policy was green on the last applicable workflow-state; the final PR/main product diff did not touch its path-filtered surfaces (`.github/workflows/**` or the routing-audit script), so no new policy run was applicable to the final product-only merge.

## 3. Repository Scan Summary
Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture: popup/options UI, MV3 service worker, state/model helpers, ChatGPT content script, optional Telegram and GitHub Actions integrations.
Build/package: reproducible Python ZIP/source-manifest packaging plus Node validation.
Tests: 112 deterministic extension tests plus loaded Chromium MV3 GitHub-watchdog E2E.

Material findings and released resolutions:
1. Dual alarm recreation starved one scheduler behind the other; fixed by independent idempotent alarm synchronization.
2. `activeCheck` dropped simultaneous later triggers; fixed by rejection-safe promise-tail serialization preserving source/parameters.
3. `githubWatchOnly` suppresses ordinary automatic checks for that chat while preserving GitHub watchdog and manual check.
4. Fresh ChatGPT documents could transiently report unauthenticated and cause `restart отложен: в профиле Chrome не выполнен вход`; fixed by one 60-second document-age grace stored only as runtime state.
5. Grace is implemented with a one-shot Chrome alarm, not a sleeping MV3 worker; the same restart episode cannot extend or repeat its grace after expiry.
6. Grace expiry uses targeted `github-watchdog-grace` force-polling before eligibility/send, so new active GitHub Actions work during the minute cannot be missed.
7. New run/active work, successful restart, watcher reset and global Stop invalidate pending grace state/alarms.

## 4. Release Gates
### GATE-1 — Behavior implementation
Status: SATISFIED
Evidence: frozen branch `0f8bac31...`; deterministic regressions cover alarm independence, GitHub-only scheduling, trigger serialization, >2 restart episodes, post-open grace, fresh GitHub revalidation and retained safety contracts.

### GATE-2 — Frozen branch
Status: SATISFIED
Evidence: run `33975579796` SUCCESS on exact `0f8bac313191a52b4c4ea4c71941ac6c129d33e5`; 5/5 audit cycles, 112/112 tests each; Chromium E2E PASS; package/provenance PASS.
ZIP SHA-256: `489850034ccce208021c93b43196a6f4f7410d8309753d785c6caaececd1e66d`.
Source-manifest SHA-256: `d70b24b683875893ff417a077f6f870cdda450574365ac8118731b0f53992a03`.
File count 18; fixed timestamp `2020-01-01T00:00:00`; branch artifact ID `9972230323`.

### GATE-3 — Canonical PR #28
Status: SATISFIED
Evidence: exact merge-ref `a72f3d753d655cd8a70b918761a362ee0c51379c`; release run `33975583026` passed 5/5 × 112/112, Chromium E2E and reproducible package with the same canonical hashes. Reviews: none. Review threads: none. PR was mergeable and merged only from frozen head `0f8bac31...`.

### GATE-4 — Post-merge main
Status: SATISFIED
Evidence: product merge commit `c85b96a56acfdabb91546970f275490b2c666562`. Main release run `33975954681` is `completed/success` on that exact SHA. Final attempt closed all five audit matrix jobs SUCCESS; cycle logs show 112/112, including `independent_alarm_lifecycle`, `github_only_scheduler`, `simultaneous_alarm_serialization` and `github_post_open_auth_grace` PASS. Chromium E2E SUCCESS. Reproducible package/provenance job `101335945384` SUCCESS with the canonical hashes, file count 18 and fixed timestamp.
Main artifact ID `9972670587`, outer digest `sha256:f34c619805523bcea758e3f21fd10ff45c568ba018c470cc34ef1922a61d9b5b`, size 60680 bytes; repository retention caps it to 1 day.

Infrastructure note: earlier main attempts encountered slow `actions/setup-node@v4` downloads on several self-hosted Mac runners. No product test failed; one cycle completed its audit successfully but was marked cancelled at job-level timeout. Reruns on the same immutable product SHA closed all five audit jobs and downstream provenance SUCCESS.

## 5. Current Critical Path
### CP-1 — Implement scheduler/auth-grace fixes
Status: DONE
Release gates: GATE-1.
Evidence: frozen branch and deterministic tests.

### CP-2 — Validate frozen branch
Status: DONE
Release gate: GATE-2.
Evidence: run `33975579796`.

### CP-3 — Validate and merge PR #28
Status: DONE
Release gate: GATE-3.
Evidence: merge-ref `a72f3d75...`, run `33975583026`, merged frozen head.

### CP-4 — Validate exact main product commit
Status: DONE
Release gate: GATE-4.
Evidence: main `c85b96a5...`, run `33975954681`, package job `101335945384`.

## 6. Active Execution Registry
HQ: NONE — release closed.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: NONE required for release closure.

## 7. Safe Parallel Work
NONE — no active critical-path work.

## 8. Current Blockers
NONE.

## 9. Critical Path Audits
Repository Coverage Audit: PASS — scheduler, state/model, restart/auth-grace, UI/config, tests, package and applicable CI surfaces covered; temporary executors/scripts removed from final diff; unrelated PR #17 excluded.
Evidence Audit: PASS — independent exact branch, PR merge-ref and main evidence with matching canonical package hashes.
Release Alignment Audit: PASS — release contains the reported watchdog failures, requested GitHub-only mode, reported fresh-tab auth race and only necessary safety/test/release hardening.
Dependency & Ordering Audit: PASS — root-cause fixes → clean frozen branch → PR merge-ref → exact merge → exact main → final persistence.
Execution & Parallelism Audit: PASS — one canonical writer for coupled scheduler/state/restart changes; CI used only for exact-ref validation.
Adversarial Audit: PASS — no blind delayed send, grace cannot extend indefinitely, fresh Actions revalidation precedes retry, activity/new run/Stop invalidate grace, old or truly logged-out pages remain fail-closed, credential/write boundaries unchanged, at-most-once restart semantics retained.

## 10. Next Action
Await new owner scope or evidence-backed regression. No release action is pending.

## 11. Last Material Revision
0.7.4 beta completed: PR #28 merged and exact main product commit `c85b96a5...` independently passed all release evidence. Main package hashes match frozen branch and PR exactly. Infrastructure-only setup-node timeouts were closed by same-SHA reruns without changing product code.

## 12. Chat Rotation Checkpoint
Safe to rotate chat: YES.
Last completed atomic action: exact main release gate and reproducible package/provenance closed SUCCESS; final release state persisted.
Active external executions and exact refs: NONE required.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live organizational master + this r37 checkpoint + current main.
Exact next action after recovery: await owner scope or inspect a newly reported regression.
Rotation blockers: NONE.

---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 20
updated_at: 2026-09-02T06:41:00Z
project_state: VALIDATING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: release/0.6.0-control-center
basis_sha: 994fbcbccf2169bf00fd74a390752e922401f95d
---

# HQ Critical Path

## 1. Current Release Contract

Release target: **ChatPulse 0.6.0 beta**.

Owner scope: per-chat continuation/time limits, per-chat profiles, Control Center, expanded Telegram operational events, safe configuration export/import, and guarded “run task until completion”.

RELEASED requires canonical non-draft PR + exact-head merge, five-cycle branch/PR/main audits, deterministic package/security on all three refs, and identical final ZIP/source-manifest hashes.

Explicit exclusions: multi-stop/regex, cloud sync/backend/accounts, Telegram token export, unrelated Draft PR #17.

## 2. Final Clean Candidate

Canonical branch: `release/0.6.0-control-center`.
Exact clean head: `994fbcbccf2169bf00fd74a390752e922401f95d`.
Exact clean branch run: `33599862500`.
Last observed: queued.

Branch workflow hygiene audit PASS: only `cleanup-legacy.yml`, `docker-runner-policy.yml`, and canonical `extension-ci.yml` remain. All temporary `hq-*` helper workflows/scripts are removed.

A permanent `workflow_dispatch` entry is retained in `extension-ci.yml` so frozen release candidates can be explicitly revalidated without modifying product code.

## 3. Product / Safety Contract Implemented

- schema v4 with per-chat inherited/custom command, interval, stop phrase, max continuations, max runtime and Telegram policy;
- inherited global changes advance affected chat `controlRevision`; removing the last inherited active-task guard fails closed;
- exact N continuation limit and runtime guard; actual count advances only after dispatch;
- task mode requires a guard, resets only selected chat baseline/counter, supports isolated `taskOnly` engine when normal monitoring was off, and targeted immediate task check;
- top Stop is master-stop; manual/global task stop advances `controlRevision`; live send requires same chat control revision and same global session;
- at-most-once fingerprint/outcome/count is durably persisted before Telegram/network notification;
- concurrent profile edits preserve fresh profile/control state while same-run real dispatch is still counted; newer run keeps fresh counter but late old-run fingerprint remains duplicate-protected;
- Control Center + popup show normal/taskOnly/master-stop state consistently, with per-chat progress/status/profile controls;
- Telegram remains optional-only and sends fixed operational events without response text, URL, stop phrase, command or bot token;
- portable JSON excludes credentials/runtime identity/history/logs; duplicate canonical chat URLs are rejected; import regenerates IDs/baselines/counters and remains globally stopped;
- destructive remove/import is blocked during an active check.

## 4. Regression / Validation Evidence

Final test inventory is 58 tests per audit cycle, including all released 0.5.4/0.5.5 regressions plus new profile/task/configuration/dispatch isolation suites.

Immediately preceding product-identical head `66f54dc89a6b39733ca1c81861a45be13d0b04d8` completed run `33599369283`:
- five independent audit cycles PASS;
- 58/58 tests PASS per cycle, 0 failures;
- static safety validation PASS;
- deterministic package/security PASS;
- ZIP SHA-256 `54963345846658b7e8794ec3fafbb45fecfd0abcd17fd1e808c75795bfd9b82b`;
- source-manifest SHA-256 `4e08b1108a7a91ec00299e198a97d92d1af6d631e485a091d30ab03c2b2f7690`;
- packaged extension file count 14;
- artifact ID `9834630782`.

That run is product-byte evidence only, not sufficient exact-head branch evidence, because subsequent control-only cleanup removed obsolete helper workflows. Current exact-head run `33599862500` must reproduce the same tests/hashes on `994fbcbc...`.

## 5. Release Gates

GATE-1 architecture/migration: SATISFIED.
GATE-2 core profiles/limits/tasks: SATISFIED pending exact clean-head revalidation.
GATE-3 Control Center/Telegram/portable config: SATISFIED pending exact clean-head revalidation.
GATE-4 exact clean branch audit/package/security: ACTIVE — run `33599862500`.
GATE-5 canonical PR merge-tree equality: PENDING GATE-4.
GATE-6 exact-head merge + post-merge `main` equality: PENDING GATE-5.

## 6. Current Critical Path

CP-1 ACTIVE — require `33599862500` 5/5 audits + 58/58 tests + static/package/security PASS and the same canonical hashes.
CP-2 PENDING — final diff/adversarial review and canonical non-draft PR.
CP-3 PENDING — independent PR merge-tree five-cycle/package equality + review/thread audit.
CP-4 PENDING — exact-head merge, post-merge main five-cycle/hash equality, persist DONE.

## 7. Active Execution Registry

HQ: final validation/integration/release owner.
PROJECT_RUNNER: `33599862500` on `release/0.6.0-control-center@994fbcbccf2169bf00fd74a390752e922401f95d`.
Workers: NONE — shared state/service-worker/options surfaces overlap.
Codex: NONE.
Human gate: NONE.

## 8. Current Blockers

NONE. Runner queue is active execution, not a blocker. No owner action required.

## 9. Critical Path Audits

Repository Coverage: PASS.
Evidence: PASS for identity/product-byte provenance; clean exact-head evidence executing.
Release Alignment: PASS — exactly selected ideas 1/2/3/4/7/8.
Dependency & Ordering: PASS.
Execution & Parallelism: PASS.
Adversarial: PASS — N+1, stale control/session, task isolation/master-stop, durable dispatch, duplicate import, inherited-guard, identity mutation, secret export and UI-state risks are explicitly guarded/regression-tested.

## 10. Next Action

Inspect `33599862500`. If fully green and hashes reproduce, freeze branch, open canonical non-draft PR, then require independent merge-tree equality before exact-head merge.

## 11. Chat Rotation Checkpoint

Safe to rotate: YES.
Last completed atomic action: obsolete helper workflows removed, clean exact candidate `994fbcbc...` created, exact-head run `33599862500` materialized, revision 20 persisted.
Active external execution: `33599862500`.
Unpersisted material reasoning: NONE.
Recovery: live-read master + revision 20 + exact run/head; continue CP-1 without owner input.

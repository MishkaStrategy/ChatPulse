---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 21
updated_at: 2026-09-02T07:03:00Z
project_state: EXECUTING
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: ca202a094424ae637c2ad381b44300fb604ccec8
---

# HQ Critical Path

## 1. Last Released Contract — ChatPulse 0.6.0 beta

0.6.0 is RELEASED.

Canonical branch head: `994fbcbccf2169bf00fd74a390752e922401f95d`.
Branch run `33599862500`: 5/5 audit cycles, 58/58 tests per cycle, static/package/security PASS.
Canonical PR: #21, merge-tree `5bd8769f2c5e46969227ce380b1f583cd526f165`.
PR run `33600098493`: 5/5, 58/58, package/security PASS, no reviews or unresolved threads.
Merged exact head to `main` as `ca202a094424ae637c2ad381b44300fb604ccec8`.
Post-merge main run `33601361550`: 5/5, 58/58, static/package/security PASS.
Dependency runner policy run `33601361484`: PASS.
Canonical 0.6.0 product ZIP SHA-256: `54963345846658b7e8794ec3fafbb45fecfd0abcd17fd1e808c75795bfd9b82b`.
Canonical source-manifest SHA-256: `4e08b1108a7a91ec00299e198a97d92d1af6d631e485a091d30ab03c2b2f7690`.

## 2. Current Release Contract — ChatPulse 0.7.0 beta

Explicit owner scope: add per-chat GitHub Actions activity watchdog. A chat can bind to a project repository; if no new GitHub Actions workflow run is created for configured `N` minutes, ChatPulse performs one controlled restart-send for that inactivity episode.

Interpretation of “new tasks”: creation of new GitHub Actions workflow runs in the configured repository, using the latest run ID/`created_at` as the activity marker.

Release surface:
- schema/profile/runtime support for repository watcher;
- optional GitHub API host permission;
- GitHub Actions polling client;
- controlled restart integrated with existing stop/limit/session/at-most-once safety;
- Control Center configuration/status;
- configuration-only export/import support;
- regression/static/package/release evidence for 0.7.0.

RELEASED requires canonical non-draft PR + exact-head merge, branch/PR/main regression and package/security gates, and reproducible final 0.7.0 package provenance.

Explicit exclusions:
- GitHub repository writes or workflow dispatches;
- private-repository token/auth in this release;
- cloud backend/accounts;
- opening a brand-new ChatGPT conversation as “restart”;
- treating GitHub API/network/permission/rate-limit errors as inactivity;
- resetting continuation/runtime counters on watchdog restart;
- weakening normal `at-most-once`, stop phrase, draft/active-generation, `controlRevision`, global-session or master-stop gates.

## 3. Watchdog Safety Contract

- Watchdog is disabled by default and configured per chat.
- Repository identifiers are normalized as `owner/repo`; malformed identifiers fail closed.
- GitHub API access is `optional_host_permissions` for `https://api.github.com/*`; no install-time GitHub access.
- First successful repository observation establishes baseline and never immediately restarts a chat.
- A new latest workflow-run ID resets the inactivity episode and clears restart idempotency.
- An empty but successful workflow-run list starts a baseline at observation time.
- API/network/403/404/rate-limit/invalid-response/permission failure records an error only and never advances the idle decision.
- Public unauthenticated API load is bounded: unique repositories are deduplicated per cycle, maximum watched unique repositories is bounded, and each repository is polled no more often than a fixed safe minimum interval.
- One activity marker can cause at most one successful restart-send; retry is allowed only while restart has not actually been submitted and the page is temporarily unsafe.
- Restart means a controlled continuation in the same ChatGPT conversation, preserving context; it does not call `startChatRun()` and does not reset `runStartedAt` or `continuationCount`.
- Watchdog restart must pass live same-chat `controlRevision`, same global session, enabled/master engine, completion guards, stop-phrase, authentication/page-ready, no active generation, no user draft, and fresh DOM preflight.
- A successful watchdog restart is a real dispatch: fingerprint/outcome/count and watchdog restart key are durably saved before optional notification; continuation/time limits still apply.
- Top Stop disables watchdog execution together with all other background sending.
- Portable export may contain non-secret watcher configuration but never latest run IDs, activity timestamps, restart keys/counts or errors.

## 4. Release Gates

GATE-1 0.6.0 predecessor release: SATISFIED.
GATE-2 schema/watchdog decision model + migration: ACTIVE.
GATE-3 GitHub client/runtime controlled restart + optional permission: PENDING GATE-2.
GATE-4 Control Center/config/docs + static privacy boundary: PENDING GATE-3.
GATE-5 exact branch regression/package/security: PENDING GATE-4.
GATE-6 canonical PR merge-tree equality: PENDING GATE-5.
GATE-7 exact-head merge + post-merge `main`: PENDING GATE-6.

## 5. Current Critical Path

CP-1 ACTIVE — create `release/0.7.0-github-actions-watchdog` from released product SHA `ca202a09...`; implement schema v5, pure watchdog state transitions and regression tests.
CP-2 PENDING — implement GitHub Actions read-only client and serialized watchdog runtime with controlled restart safety.
CP-3 PENDING — add per-chat Control Center fields/permission/status, safe portable config, privacy/security/docs and 0.7 release metadata.
CP-4 PENDING — exact-head adversarial diff review + branch gate/package.
CP-5 PENDING — canonical PR, merge-tree gate and review/thread audit.
CP-6 PENDING — exact-head merge, post-merge main gate/provenance, persist DONE.

## 6. Active Execution Registry

HQ: 0.7.0 architecture, implementation, integration and release owner.
PROJECT_RUNNER: NONE at this checkpoint; implementation branch not yet created.
Workers: NONE — model/service-worker/options/release surfaces are tightly coupled and one canonical writer is lower risk.
Codex: NONE.
Human gate: NONE.

## 7. Current Blockers

NONE.

## 8. Six Critical Path Audits

Repository Coverage Audit: PASS — manifest/model/service worker/Control Center/portable config/tests/static validation/package/workflow/docs/privacy/security are included.
Evidence Audit: PASS — owner request plus released `ca202a09...` architecture and 0.6 safety evidence are live-verified.
Release Alignment Audit: PASS — path implements only repository Actions inactivity restart; private auth/repo writes/new-chat/cloud scope excluded.
Dependency & Ordering Audit: PASS — 0.6.0 is fully released before 0.7 product writes; schema precedes runtime/UI/release validation.
Execution & Parallelism Audit: PASS — coupled state/runtime/UI surfaces require one writer; deterministic project runner will validate exact refs.
Adversarial Audit: PASS — API ambiguity/rate limits, repeated stall sends, master-stop, stale session/profile, active generation/draft, counter reset, export runtime leakage and shared-repo request amplification have explicit fail-closed rules.

## 9. Next Action

Create `release/0.7.0-github-actions-watchdog` from `ca202a094424ae637c2ad381b44300fb604ccec8`, implement schema/watchdog core first, then run focused regressions before runtime/UI integration.

## 10. Chat Rotation Checkpoint

Safe to rotate: YES.
Last completed atomic action: 0.6.0 branch/PR/main evidence verified and PR #21 merged; 0.7.0 owner scope audited and revision 21 persisted.
Active external execution: NONE.
Unpersisted material reasoning: NONE.
Recovery: read live master + revision 21 + current main; verify 0.7 branch state if created after this checkpoint.
Exact next action after recovery: create or inspect `release/0.7.0-github-actions-watchdog` from released product SHA and continue CP-1.

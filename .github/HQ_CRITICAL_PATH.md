---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 81
updated_at: 2026-09-22T18:49:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: SATISFIED
handoff_status: READY
basis_ref: main
basis_sha: a3fb895bf5e89fe47faf9ede763be3c6a04b88b8
---

# HQ Critical Path

## Current Release Contract

Release target: ChatPulse 0.8.3 beta — prevent Pulse 2.0 routes with an empty current-chat URL from remaining indefinitely in **создание чата / Создание первого чата**.

Definition of DONE: project-chat creation has durable recovery across Manifest V3 service-worker sleep/restart, the exact persisted stuck state is recovered in loaded Chromium without another owner action, all prior Pulse 1.0/Pulse 2.0 behavior remains green, and exact post-merge `main` reproduces the candidate package identity.

## Repository Basis

- Previous verified release: 0.8.2.
- 0.8.2 immutable product basis: `9327e20daf6f19aead632424e9e9822d6b908e6e`.
- 0.8.3 frozen candidate: `70cd6ec615273543c31e85f9db3ecf8cce20a659`.
- Canonical PR: #37, merged.
- Immutable 0.8.3 product merge / release basis: `a3fb895bf5e89fe47faf9ede763be3c6a04b88b8`.
- This state document may advance `main` after the immutable product basis above without changing product release contents.

## Root Cause / Delivered Fix

Owner evidence showed a route with a valid Project URL and empty current-chat field stuck at `rotating` / **создание чата**, with no last check and no error.

0.8.2 correctly persisted the route in `rotating`, but creation of the first project chat was launched only as fire-and-forget follow-up work after START. Monitoring and capture had durable alarms; rotating routes did not. A Manifest V3 service-worker sleep/restart could therefore strand the route indefinitely.

0.8.3 now:

- creates a managed tab synchronously during START for every route, using the current chat when present or the Project page when current chat is empty;
- keeps the normal immediate follow-up path for fast execution;
- adds dedicated `chatpulse-pulse2-rotation` recovery scheduling every 30 seconds while any route is `rotating`;
- resumes all persisted rotating routes through `performPulse2RotationSweep` after worker wake/restart;
- records `lastCheckAt` when a rotation attempt actually begins;
- reuses a managed tab already on the correct Project page instead of unnecessarily reloading it;
- if a prior attempt already sent the start message and the managed tab has become a new concrete `/c/...` URL, adopts it into capture-wait instead of creating another chat;
- preserves direct `Новый чат в … / New chat in …` Project-composer compatibility from 0.8.2;
- preserves Pulse 1.0 isolation, auth/fail-closed send rules, multi-route serialization and bounded permanent-URL capture.

## Audit / Validation Evidence

### Development audit findings

The stricter browser regression intentionally found and blocked two harness races before the final candidate:
- the first extension-created tab could load before Playwright fixture interception;
- a retained existing-chat baseline could read a stale auth error before the route-owned fixture/check completed.

Neither issue was accepted as release evidence. The harness was made deterministic by pre-controlling the recovery Project tab and later binding the retained authenticated fixture to the exact saved `route.tabId`. Production authentication guards were never weakened.

### Candidate / PR #37

- Candidate SHA: `70cd6ec615273543c31e85f9db3ecf8cce20a659`.
- PR release run `35769145846`: SUCCESS.
- PR dependency run `35769145859`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Retained Pulse 1.0 loaded-extension Chromium E2E: SUCCESS.
- Pulse 2.0 loaded-extension E2E:
  - unsaved settings draft: PASS;
  - optional current chat: PASS;
  - multi-route save: PASS;
  - persisted stuck rotation recovery: PASS;
  - retained full rotation: PASS;
  - Pulse 1.0 isolation: PASS.
- Reproducible package/provenance: SUCCESS.
- Candidate artifact ID: `10712993313`, name `ChatPulse-Chrome-v0.8.3-beta`.
- Candidate ZIP SHA-256: `25cfa3508989839dd1fe3f2de2bceece054cc5ac61dae92501bd638d1af8da17`.
- Candidate source manifest SHA-256: `b6b3340d6063944c76fae45260650f1d6c948c7258cd5fc4f9955912b9ac1e77`.

### Exact post-merge product main

- Product merge SHA: `a3fb895bf5e89fe47faf9ede763be3c6a04b88b8`.
- Exact-main release run `35769404771`: SUCCESS.
- Exact-main dependency run `35769404767`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Retained Pulse 1.0 loaded-extension Chromium E2E: SUCCESS.
- Pulse 2.0 persisted-rotation recovery + retained rotation E2E: SUCCESS.
- Reproducible package/provenance: SUCCESS.
- Exact-main artifact ID: `10713527175`, name `ChatPulse-Chrome-v0.8.3-beta`.
- Exact-main ZIP SHA-256: `25cfa3508989839dd1fe3f2de2bceece054cc5ac61dae92501bd638d1af8da17`.
- Exact-main source manifest SHA-256: `b6b3340d6063944c76fae45260650f1d6c948c7258cd5fc4f9955912b9ac1e77`.
- Candidate and exact post-merge product `main` are byte-for-byte identical by canonical release payload hashes.

## Adversarial Review

- Rotation recovery uses the existing serialized engine queue, so ordinary immediate work and alarm recovery do not concurrently mutate route state in one worker instance.
- The rotation alarm exists only while an enabled route is actually `rotating` and is cleared when no rotating routes remain or Pulse 2.0 stops.
- Chrome minimum version remains 120, where the 30-second alarm cadence is supported.
- Recovery re-checks the persisted session/revision/phase before committing send/capture transitions.
- Existing auth and fail-closed checks were not relaxed.
- No blocker remained after exact-main loaded-browser validation.

## Critical Work

- [x] Root-cause the owner-reported stuck `rotating` state.
- [x] Create managed Project tabs synchronously on START for blank-current-chat routes.
- [x] Add durable rotating-route recovery watchdog.
- [x] Add crash/restart concrete-chat adoption to reduce duplicate creation risk.
- [x] Add runtime attempt timestamp.
- [x] Add focused/static recovery contract coverage.
- [x] Add loaded-browser regression for the exact persisted stuck state.
- [x] Pass candidate dependency gate and 5/5 audits.
- [x] Pass candidate loaded Chromium recovery + retained rotation E2E.
- [x] Produce deterministic 0.8.3 candidate package.
- [x] Merge PR #37 with exact-head guard.
- [x] Repeat all material validation on exact post-merge `main`.
- [x] Verify exact-main package hashes equal the candidate byte-for-byte.
- [x] Persist DONE/VERIFIED evidence.

## Blockers

NONE.

## Active Execution

NONE. ChatPulse 0.8.3 release contract is complete.

## Next Action

None for this release. Await the next owner-requested bug/feature.

## Recovery Note

Immutable 0.8.3 product release basis is `a3fb895bf5e89fe47faf9ede763be3c6a04b88b8`. The owner-reported `создание чата` hang is covered by a real loaded-extension alarm-driven recovery regression. PR #37 and exact-main evidence above satisfy the release contract.

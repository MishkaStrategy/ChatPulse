---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 80
updated_at: 2026-09-22T18:15:00Z
project_state: ACTIVE
critical_path_status: EXECUTING
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: b4eaeda7ff3bb7490c04833e23cdf8810a4688e4
---

# HQ Critical Path

## Current Goal

Release ChatPulse 0.8.3 beta fixing Pulse 2.0 routes that can remain indefinitely in **создание чата / Создание первого чата** after Start.

## Owner Evidence / Root Cause

Owner supplied a runtime screenshot with an empty current chat, valid project URL, phase **создание чата**, next action **Создание первого чата**, zero responses, no last check and no error.

Live 0.8.2 code persisted empty-chat routes as `phase=rotating` correctly, but the first rotation was started only through fire-and-forget follow-up work after the START request. A Manifest V3 service worker sleep/restart could therefore leave a persisted rotating route with no alarm capable of resuming it. Monitoring alarms only covered `monitoring`; capture alarms only covered `capture-wait`.

## 0.8.3 Release Contract

- Add a dedicated persistent recovery path for every active `rotating` route.
- The recovery path must be alarm-driven so a worker wake/restart can resume work without another UI action.
- Keep immediate follow-up work for responsiveness; recovery alarm is a watchdog, not a replacement for normal fast execution.
- Avoid unnecessary project-page reloads on retries.
- Record a visible runtime attempt timestamp when rotation work begins.
- If a previous attempt already sent the start message and the managed tab already has a new concrete `/c/...` URL, adopt it into capture-wait rather than creating a duplicate chat.
- Preserve Pulse 1.0 isolation, project-composer compatibility, multi-route behavior, auth/fail-closed rules and bounded URL capture.
- Add loaded-browser regression evidence for the exact persisted stuck `rotating` state.
- Pass canonical PR release/dependency gates and exact post-merge main revalidation.

## Current State

- Previous verified release: 0.8.2.
- 0.8.2 immutable product basis: `9327e20daf6f19aead632424e9e9822d6b908e6e`.
- Main state-only head before this fix: `b4eaeda7ff3bb7490c04833e23cdf8810a4688e4`.
- Execution branch: `fix/pulse2-rotation-recovery-0.8.3`.
- Dedicated `chatpulse-pulse2-rotation` recovery alarm implemented at 30-second cadence while any route is rotating.
- Alarm-driven `performPulse2RotationSweep` implemented.
- Rotation attempts now persist `lastCheckAt`.
- Existing project tab is reused without needless reload when already at the correct project URL.
- Crash/restart recovery adopts a new concrete chat URL into capture-wait if the start send already advanced the managed tab.
- Browser regression seeds the exact stuck persisted state and triggers the real rotation alarm.
- Release metadata/tooling bumped to 0.8.3 beta.

## Critical Work

- [x] Root-cause the stuck `rotating` state from live code.
- [x] Add rotating-route recovery watchdog.
- [x] Add post-send concrete-chat adoption to avoid duplicate first-chat creation after interruption.
- [x] Add runtime progress timestamp.
- [x] Add focused/static regression coverage.
- [x] Add loaded-browser stalled-state recovery regression.
- [x] Bump release tooling/docs to 0.8.3 beta.
- [ ] Open canonical PR on exact candidate.
- [ ] Pass PR full audits, loaded Chromium E2E, dependency and reproducible package gates.
- [ ] Complete adversarial review.
- [ ] Merge with exact-head guard.
- [ ] Repeat material validation on exact post-merge main.
- [ ] Persist DONE/VERIFIED evidence and deliver exact-main ZIP.

## Blockers

NONE currently known.

## Active Execution

HQ_DIRECT on `fix/pulse2-rotation-recovery-0.8.3`.

## Next Action

Open the canonical PR and validate the persisted-stuck-state recovery path on the exact GitHub candidate.

## Recovery Note

The key defect is not the Project composer detector from 0.8.2. It is missing durable scheduling for `rotating` routes. Do not remove immediate follow-up work; add durable alarm recovery around it. Do not relax auth/send/capture safety checks.

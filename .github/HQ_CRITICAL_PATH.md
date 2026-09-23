---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 85
updated_at: 2026-09-23T03:43:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: SATISFIED
handoff_status: READY
basis_ref: main
basis_sha: aad546080ebac191e424e05c4e583b2678ea30e4
---

# HQ Critical Path

## Current Release Contract

Release target: ChatPulse 0.8.5 beta — make Pulse 2.0 continue reliably after the first automatically created project chat during long/overnight runs.

## Repository Basis

- Previous verified release: 0.8.4.
- 0.8.4 product basis: `05fa17ee3c61998ca5a2a302e16e9d19a87bd60a`.
- 0.8.5 frozen candidate: `8c89ac325287a89b6931ff65c3cf1d37d25e8035`.
- Canonical PR: #39, merged.
- Immutable 0.8.5 product merge / release basis: `aad546080ebac191e424e05c4e583b2678ea30e4`.

## Root Cause / Delivered Fix

Owner evidence showed cycle 1 created successfully, but no subsequent overnight progress with a 1-hour delay.

0.8.4 had two relevant defects:
- after project creation, ordinary monitoring again inspected/sent in a background ChatGPT tab;
- the configured auto-response delay also doubled as polling cadence, adding an unintended extra observation interval for newly captured project chats.

0.8.5 now:
- foregrounds every due managed chat before inspection/send;
- safely restores the user's previous tab when the user has not switched elsewhere;
- keeps the managed chat active if monitoring transitions into project rotation;
- runs the monitor alarm every 30 seconds while still touching only routes whose `nextCheckAt` is due;
- schedules a 30-second recheck after chat capture and after each auto-response so the next assistant response is discovered promptly;
- preserves the configured interval as the actual stability delay after a completed assistant response is observed;
- retries transient/generating/waiting states at 30 seconds and auth/page errors at a 5-minute backoff;
- persists the page visibility observed during monitoring for diagnosability;
- preserves project-scoped `/g/<project>/c/<chat-id>` URLs, 0.8.4 project foregrounding, rotation recovery, multi-route isolation and Pulse 1.0 isolation.

## Candidate / PR #39 Evidence

- Candidate SHA: `8c89ac325287a89b6931ff65c3cf1d37d25e8035`.
- Release run `35814740744`: SUCCESS.
- Dependency run `35814740811`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Loaded Chromium Pulse 1.0 watchdog E2E: SUCCESS.
- Loaded Chromium Pulse 2.0:
  - form draft: PASS;
  - optional chat: PASS;
  - multi-route save: PASS;
  - rotation recovery: PASS;
  - project foreground: PASS;
  - overnight monitor alarm: PASS;
  - monitor focus restore: PASS;
  - normal rotation: PASS;
  - Pulse 1 isolation: PASS.
- Candidate artifact ID: `10731195565`.
- Candidate ZIP SHA-256: `ecb256651a1e9f4cf6b01579cb9b104e3cc319b06abcfeefddc6d4de5e9796d4`.
- Candidate source manifest SHA-256: `616655b77dcaf4e7645da6f2afb33e7aa4ab67ff5984eab5bc29148ee227e1cb`.

## Exact Post-Merge Main Evidence

- Product merge SHA: `aad546080ebac191e424e05c4e583b2678ea30e4`.
- Release run `35815023317`: SUCCESS.
- Dependency run `35815023312`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Loaded Chromium Pulse 1.0 watchdog E2E: SUCCESS.
- Loaded Chromium Pulse 2.0 including `overnight_monitor_alarm=PASS` and `monitor_focus_restore=PASS`: SUCCESS.
- Exact-main artifact ID: `10731685960`.
- Exact-main ZIP SHA-256: `ecb256651a1e9f4cf6b01579cb9b104e3cc319b06abcfeefddc6d4de5e9796d4`.
- Exact-main source manifest SHA-256: `616655b77dcaf4e7645da6f2afb33e7aa4ab67ff5984eab5bc29148ee227e1cb`.
- Candidate and exact post-merge product main are byte-for-byte identical by canonical release hashes.

## Audit Notes

Two defects were caught by the stricter browser gate before release:
- a missing `addMilliseconds` helper in the first implementation;
- a brittle headless `visibilitychange` assertion, replaced by persisted `lastPageVisibility === "visible"` plus explicit focus-restore verification.

No production safety check was weakened to make tests pass.

## Critical Work

- [x] Root-cause the owner-reported overnight stall.
- [x] Fix foreground monitoring and safe focus restore.
- [x] Decouple response delay from observation cadence.
- [x] Add short post-capture/post-dispatch rechecks and bounded error backoff.
- [x] Add real alarm-driven loaded-browser regression.
- [x] Pass candidate 5/5 audits, browser E2E, dependency and package gates.
- [x] Merge PR #39 with exact-head guard.
- [x] Repeat all material checks on exact post-merge main.
- [x] Verify candidate and main package identity.
- [x] Persist DONE/VERIFIED evidence.

## Blockers

NONE.

## Active Execution

NONE. ChatPulse 0.8.5 release contract is complete.

## Next Action

Await owner runtime verification or next requested bug/feature.

## Recovery Note

Local Chrome extensions cannot execute while Chrome or the computer is fully asleep/off. When Chrome is running, 0.8.5 no longer depends on long background-tab hydration or uses the configured auto-response delay as polling cadence.

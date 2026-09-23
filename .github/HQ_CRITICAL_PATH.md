---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 84
updated_at: 2026-09-23T03:45:00Z
project_state: ACTIVE
critical_path_status: EXECUTING
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 352cb5e6a4b07916c5b1a536e4d9091a7fa050d9
---

# HQ Critical Path

## Current Goal

Release ChatPulse 0.8.5 beta fixing Pulse 2.0 routes that successfully create cycle 1 but then make no further overnight progress.

## Owner Evidence / Root Cause

Owner left Pulse 2.0 running overnight with:
- one route;
- auto-response text `go`;
- 1-hour configured auto-response delay;
- 3 auto-responses per cycle;
- 4 cycles per project.

By morning, history still contained only the first automatically created project chat and the owner observed only the initial start message.

Live 0.8.4 investigation found two relevant gaps:

1. Project-chat creation was foregrounded in 0.8.4, but once the route entered `monitoring`, ordinary assistant inspection and `go` dispatch again occurred entirely in a background tab. Real ChatGPT may freeze or incompletely update that DOM.
2. The configured auto-response delay also doubled as the Chrome monitor alarm period. For a route created by Pulse itself, URL capture set the first monitoring check one full configured interval later; seeing the assistant response then started another full stability interval. With a 1-hour setting, this could add an unintended extra hour before the first `go`.

The project-scoped current-chat URL form visible in owner evidence, `/g/<project>/c/<chat-id>`, is accepted by `normalizeChatURL` and is not the defect.

## 0.8.5 Release Contract

- Every due monitoring check must foreground the route-owned managed chat before reading assistant state or sending an auto-response.
- After a monitoring-only check or send, restore the user's previous tab when the managed tab is still active; do not override a manual user tab switch.
- If monitoring transitions into rotation, keep the managed tab active so 0.8.4 Project-foreground behavior remains intact.
- Decouple assistant observation cadence from the configured auto-response delay.
- Monitor scheduler wakes at 30-second cadence but only executes routes whose persisted `nextCheckAt` is due.
- After project-chat capture and after an auto-response dispatch, schedule a 30-second recheck to discover the next assistant response promptly.
- Once a specific completed assistant response is observed, preserve the configured interval as the real stability delay before sending `go`.
- Use 30-second retry for transient ready/generating/waiting states and bounded 5-minute retry for auth/page-error states.
- Preserve 0.8.4 foreground Project rotation, durable rotation recovery, project-scoped chat URLs, multi-route serialization, Pulse 1.0 isolation, auth/fail-closed rules and URL capture.
- Add loaded Chromium evidence using the real monitor alarm, not only manual `CHECK_NOW`.
- Pass canonical PR release/dependency gates and exact post-merge main revalidation.

## Current State

- Previous verified release: 0.8.4.
- 0.8.4 immutable product basis: `05fa17ee3c61998ca5a2a302e16e9d19a87bd60a`.
- Main state-only head before this fix: `352cb5e6a4b07916c5b1a536e4d9091a7fa050d9`.
- Execution branch: `fix/pulse2-overnight-monitoring-0.8.5`.
- Foreground due-monitoring with safe previous-tab restoration implemented.
- 30-second monitor scheduler implemented with due-route filtering retained.
- 30-second post-capture/post-dispatch recheck implemented.
- 5-minute bounded error backoff implemented.
- Model tests cover 1-hour configured delay without an unintended extra observation hour.
- Browser regression now drives first auto-response through the real monitor alarm and checks foreground/restore behavior.
- Release metadata/tooling/docs bumped to 0.8.5 beta.

## Critical Work

- [x] Verify project-scoped current-chat URL normalization.
- [x] Root-cause background-monitoring and delay/polling coupling.
- [x] Foreground due chat monitoring and safely restore previous user focus.
- [x] Decouple 30-second observation cadence from configured response delay.
- [x] Add short post-capture/post-dispatch rechecks and bounded error backoff.
- [x] Add model/static tests.
- [x] Add loaded-browser real-alarm overnight regression.
- [x] Bump release tooling/docs to 0.8.5 beta.
- [ ] Open canonical PR on exact candidate.
- [ ] Pass 5/5 audits, loaded Chromium E2E, dependency gate and reproducible package/provenance.
- [ ] Complete adversarial review.
- [ ] Merge with exact-head guard.
- [ ] Repeat material validation on exact post-merge main.
- [ ] Persist DONE/VERIFIED evidence and deliver exact-main ZIP.

## Blockers

NONE currently known.

## Active Execution

HQ_DIRECT on `fix/pulse2-overnight-monitoring-0.8.5`.

## Next Action

Open the canonical PR and validate the real alarm-driven monitoring path on loaded Chromium.

## Recovery Note

Do not weaken delay semantics. The configured delay remains time from observed stable assistant response to auto-response; only observation/retry cadence is shortened. Local Chrome extensions cannot execute while Chrome/the computer is fully asleep, so docs now state that limitation explicitly.

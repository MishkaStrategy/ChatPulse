---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 86
updated_at: 2026-09-23T04:10:00Z
project_state: ACTIVE
critical_path_status: EXECUTING
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: ffb0c5287780bfb41d218978d0f4fb1c47193e3f
---

# HQ Critical Path

## Current Goal

Adversarially test ChatPulse 0.8.5 Pulse 2.0 beyond the existing release gate, fix newly discovered runtime defects, and release 0.8.6 beta if the hardened candidate passes full validation.

## Newly Discovered Bugs

Additional inspection and test design found:

1. **Stop → Start managed-tab duplication** — persisted `tabId` survived STOP, but START unconditionally opened a new ChatGPT tab for every route.
2. **Open Current Chat bypassed the engine** — the Pulse 2.0 UI directly called `chrome.tabs.create()`, creating an unmanaged duplicate while the route continued pointing to its hidden managed tab.
3. **Unexpected monitor runtime failures could hammer every 30 seconds** — the generic catch path preserved a due/null `nextCheckAt`, so a broken page could repeatedly foreground the route on every monitor alarm.
4. **Replacement-tab readiness race** — after a managed tab was manually closed, a replacement tab could transiently report `status=complete` before the requested ChatGPT URL was actually loaded. The engine could inspect that blank/intermediate document and report a false authentication error.

## 0.8.6 Release Contract

- Reuse an existing route-owned tab across Stop → Start when its URL still matches the saved chat/project target.
- Create a replacement only when the saved managed tab is closed, unavailable or points somewhere else.
- Route **Open Current Chat** through the background engine and reuse the managed route tab instead of creating a UI-owned duplicate.
- Protect newly opened/replacement managed tabs from Chrome auto-discard.
- Treat a tab as ready only when both `status=complete` and the actual URL matches the expected current chat/project target.
- Unexpected monitor runtime errors receive a bounded 5-minute retry instead of immediate 30-second hammering.
- Preserve 0.8.5 overnight monitoring, 0.8.4 project foregrounding, durable rotation recovery, multi-route isolation and Pulse 1.0 isolation.
- Add loaded-Chromium adversarial scenarios:
  - manually close the managed chat during monitoring and require recovery + successful auto-response;
  - manually switch to another user tab while a service check is running and require Pulse not to steal focus back;
  - Stop → Start must retain the same valid managed `tabId` and not increase ChatGPT tab count;
  - **Open Current Chat** must activate that same managed `tabId` and not increase ChatGPT tab count.
- Retain full 5/5 extension audits, browser E2E, dependency gate and reproducible package/provenance on candidate and exact post-merge main.

## Current State

- Previous verified release: 0.8.5.
- 0.8.5 immutable product basis: `aad546080ebac191e424e05c4e583b2678ea30e4`.
- Main state-only head before this work: `ffb0c5287780bfb41d218978d0f4fb1c47193e3f`.
- Execution branch: `fix/pulse2-adversarial-hardening-0.8.6`.
- Managed-tab reuse implemented in START.
- UI Open Current Chat now delegates to engine action `OPEN_CURRENT_CHAT`.
- Generic monitoring runtime failure backoff implemented.
- Expected-target URL readiness implemented for monitoring and rotation waits.
- Browser E2E extended with closed-tab recovery, manual focus guard, restart reuse and Open Current Chat reuse.
- Unit/static tests extended for transient timing and tab lifecycle contracts.
- Release metadata/tooling/docs bumped to 0.8.6 beta.

## Critical Work

- [x] Read live 0.8.5 state and identify untested lifecycle surfaces.
- [x] Find and fix Stop → Start duplicate-tab bug.
- [x] Find and fix Open Current Chat unmanaged-duplicate bug.
- [x] Add runtime failure backoff.
- [x] Catch and fix replacement-tab readiness race exposed by the new browser test.
- [x] Add adversarial loaded-browser scenarios.
- [x] Add unit/static timing and lifecycle tests.
- [x] Bump release tooling/docs to 0.8.6 beta.
- [ ] Open canonical PR on exact candidate.
- [ ] Pass adversarial browser E2E, 5/5 audits, dependency gate and reproducible package/provenance.
- [ ] Review any newly exposed failures and fix without weakening acceptance.
- [ ] Merge exact verified head.
- [ ] Repeat material validation on exact post-merge main.
- [ ] Persist DONE/VERIFIED evidence and deliver exact-main ZIP.

## Blockers

NONE currently known.

## Active Execution

HQ_DIRECT on `fix/pulse2-adversarial-hardening-0.8.6`.

## Next Action

Open the canonical PR and let the expanded Chromium E2E try to break the candidate.

## Recovery Note

The additional tests intentionally go beyond prior release coverage. Do not accept a green static suite if any of the new real-tab lifecycle assertions fail.

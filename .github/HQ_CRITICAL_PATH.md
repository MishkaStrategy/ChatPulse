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
5. **Post-load hydration race** — even after the correct ChatGPT URL reaches `complete`, profile/composer/auth DOM can appear later. Immediate inspection could still record a transient false unauthenticated state.
6. **Tab-ready listener registration gap** — a tab could become ready after the initial state read but before `tabs.onUpdated` listener registration, causing a false 45-second timeout despite the page being ready.
7. **Open Current Chat could corrupt an in-flight rotation** — during `rotating/capture-wait`, `currentChatUrl` still points at the previous chat while `tabId` belongs to the new-chat flow; opening the old current chat could replace the managed `tabId` and break URL capture.
8. **Rotation recovery could adopt an unrelated ChatGPT chat** — a stale/manually navigated managed `tabId` pointing at any new `/c/...` URL could be mistaken for the just-created project chat.
9. **Capture-wait could adopt an unrelated ChatGPT chat** — after a valid project chat was created but before its two-minute URL capture completed, manual navigation to another `/c/...` URL could be persisted as the next project cycle.
10. **Lost managed-tab recovery must not hijack a user-owned matching tab** — avoiding duplicate tabs by adopting any unclaimed matching URL can unexpectedly turn the user's own ChatGPT tab into a Pulse service tab, overwrite its composer and send automation into it.
11. **Background URL-capture hydration could fail after the two-minute wait** — if the user switched away from the newly created chat before capture, the capture path inspected its DOM in the background even though ChatGPT can defer hydration there.
12. **Transient unauthenticated snapshot could survive the hydration window** — even a correct foregrounded chat can occasionally remain incompletely hydrated; immediately recording auth failure after one hydration window makes recovery too brittle.
13. **Recovered monitoring could falsely advance counters without proven DOM delivery** — the adversarial closed-tab test observed runtime continuation counters advancing while the user message was absent from the expected page. The release gate now requires `lastDispatchOutcome=confirmed` and a real user message in the route-owned replacement tab.

## 0.8.6 Release Contract

- Reuse an existing route-owned tab across Stop → Start when its URL still matches the saved chat/project target.
- Create a replacement only when the saved managed tab is closed, unavailable or points somewhere else.
- Route **Open Current Chat** through the background engine and reuse the managed route tab instead of creating a UI-owned duplicate.
- Protect newly opened/replacement managed tabs from Chrome auto-discard.
- Treat a tab as ready only when both `status=complete` and the actual URL matches the expected current chat/project target.
- Retry ChatGPT DOM/auth hydration for a bounded 8-second window before deciding that a loaded page is unauthenticated.
- Recheck tab readiness immediately after listener registration to close the missed-event gap.
- Disable and reject **Open Current Chat** while a running route is not in `monitoring`.
- During crash recovery, adopt a concrete chat only when its project-scoped URL belongs to the configured Project; otherwise rebuild from the configured Project page.
- During `capture-wait`, persist a changed chat URL only when it belongs to the configured Project; unrelated ChatGPT chats are rejected and retried.
- When a previously managed chat tab is lost, create a fresh route-owned replacement. Never adopt an arbitrary matching tab merely because no other Pulse route claims it.
- Foreground due URL-capture before inspecting permanent URL/auth/message DOM, then safely restore the previous user tab.
- If a correct loaded chat remains unauthenticated after the bounded hydration window, allow one single foreground reload + second bounded hydration attempt before surfacing auth failure.
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
- Bounded post-load DOM/auth hydration retry implemented.
- Tab-ready listener registration gap closed with an immediate post-subscription recheck.
- Browser E2E extended with closed-tab recovery that preserves a separate user-owned matching tab, manual focus guard, restart reuse, Open Current Chat reuse, unrelated recovery rejection and unrelated capture-wait rejection.
- Unit/static tests extended for transient timing and tab lifecycle contracts.
- Release metadata/tooling/docs bumped to 0.8.6 beta.

## Critical Work

- [x] Read live 0.8.5 state and identify untested lifecycle surfaces.
- [x] Find and fix Stop → Start duplicate-tab bug.
- [x] Find and fix Open Current Chat unmanaged-duplicate bug.
- [x] Add runtime failure backoff.
- [x] Catch and fix replacement-tab readiness race exposed by the new browser test.
- [x] Catch and fix post-load DOM/auth hydration race exposed by the same closed-tab scenario.
- [x] Close the tab-ready listener registration event gap found in manual adversarial review.
- [x] Guard Open Current Chat during rotating/capture-wait so it cannot corrupt the managed new-chat tab.
- [x] Reject unrelated ChatGPT chats during rotation recovery and cover this with loaded Chromium.
- [x] Reject unrelated ChatGPT chats during capture-wait and require later recovery to the correct project URL.
- [x] Preserve user-owned matching tabs after managed-tab loss; recover only by creating a fresh route-owned replacement.
- [x] Foreground URL capture and restore user focus after the capture check.
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

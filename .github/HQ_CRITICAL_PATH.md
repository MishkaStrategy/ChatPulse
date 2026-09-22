---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 82
updated_at: 2026-09-22T19:30:00Z
project_state: ACTIVE
critical_path_status: EXECUTING
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 85fbd20923dd4136a5e7e1f25253c3ad65a67022
---

# HQ Critical Path

## Current Goal

Release ChatPulse 0.8.4 beta fixing Pulse 2.0 project-chat creation failures caused by leaving the managed ChatGPT Project tab in the background.

## Owner Evidence / Root Cause

Owner reports the runtime error **«Не найдено поле нового чата внутри проекта ChatGPT.»** and observes that Pulse opens the Project link in a background tab without switching to it. In real Chrome, ChatGPT may not fully hydrate/render the project composer and send controls while that tab remains backgrounded.

Live 0.8.3 code confirmed the behavior: `performPulse2Rotation()` created and updated the managed Project tab with `active: false` in all rotation paths, then immediately attempted Project-composer discovery.

## 0.8.4 Release Contract

- During first-chat and next-chat creation, make the route-owned managed Project tab the active Chrome tab before composer lookup.
- Focus the containing Chrome window when possible; tab activation remains the required fallback.
- Keep the tab foregrounded while waiting for page completion, Project hydration, composer discovery and start-message submission.
- A route started with an empty current-chat URL should not begin Project initialization solely as a background tab.
- Scope forced foreground switching to the project-chat creation / `rotating` phase; ordinary monitoring of existing chats should remain background-capable.
- Preserve 0.8.3 durable rotation recovery, multi-route serialization, auth/fail-closed behavior, Pulse 1.0 isolation and bounded URL capture.
- Add loaded-Chromium evidence where a Project tab is intentionally backgrounded before recovery and the extension must activate it before rotation can pass.
- Pass canonical PR release/dependency gates and exact post-merge main revalidation.

## Current State

- Previous verified release: 0.8.3.
- 0.8.3 immutable product basis: `a3fb895bf5e89fe47faf9ede763be3c6a04b88b8`.
- Main state-only head before this fix: `85fbd20923dd4136a5e7e1f25253c3ad65a67022`.
- Execution branch: `fix/pulse2-foreground-project-rotation-0.8.4`.
- Product change implemented: rotating routes explicitly activate the managed tab and focus its window before Project-composer discovery.
- Blank-current-chat START now creates the Project tab active immediately.
- Existing-chat monitoring remains background-capable.
- Browser regression now starts recovery with the Project tab intentionally in the background and requires the route tab to become active.

## Critical Work

- [x] Confirm live 0.8.3 uses `active: false` during project rotation.
- [x] Foreground the managed Project tab before composer lookup.
- [x] Focus the containing Chrome window when possible.
- [x] Keep ordinary monitoring background-capable.
- [x] Add static foreground-tab contract tests.
- [x] Add loaded-Chromium active-tab assertions for recovery and ordinary rotation.
- [x] Bump release metadata/tooling/docs to 0.8.4 beta.
- [ ] Open canonical PR on exact candidate.
- [ ] Pass 5/5 audits, loaded Chromium E2E, dependency gate and reproducible package/provenance.
- [ ] Complete adversarial review.
- [ ] Merge with exact-head guard.
- [ ] Repeat material validation on exact post-merge main.
- [ ] Persist DONE/VERIFIED evidence and deliver exact-main ZIP.

## Blockers

NONE currently known.

## Active Execution

HQ_DIRECT on `fix/pulse2-foreground-project-rotation-0.8.4`.

## Next Action

Open the canonical 0.8.4 PR and validate that a deliberately backgrounded Project tab is brought to the foreground before Project-composer discovery.

## Recovery Note

Do not fix this by weakening composer/auth checks. The owner-requested behavior is explicit Chrome tab switching during the `rotating` phase. Ordinary monitoring should remain background-capable.

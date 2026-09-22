---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 78
updated_at: 2026-09-22T17:50:00Z
project_state: ACTIVE
critical_path_status: EXECUTING
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: c909d04fac4e2b8a19ad8bfc669ed064c7909ec5
---

# HQ Critical Path

## Current Goal

Release ChatPulse 0.8.2 beta fixing Pulse 2.0 compatibility with the current ChatGPT Project landing composer shown as `Новый чат в … / New chat in …`.

## Bug Evidence

Owner provided a screenshot of the current project UI: a large project composer labelled `Новый чат в Модульная Стратегия` is visible, but there is no separate `Новый чат / New chat` button.

0.8.1 `pulse2-content.js` only accepted:
- an already materialized textarea/contenteditable; or
- a separate button/link/role-button whose label was exactly Chat/New chat/Create chat.

Therefore the visible project composer shell could be missed and Pulse 2.0 failed with `Не найдено действие «Новый чат / Chat» внутри проекта ChatGPT.`

## Release Contract

0.8.2 must:

- recognize a visible direct project composer shell whose semantic label starts with `Новый чат в` or `New chat in`;
- activate that composer shell and then wait for the actual editable field;
- tolerate bounded project hydration for up to 12 seconds instead of doing a one-shot control lookup;
- preserve the old explicit New chat action as a fallback;
- preserve Pulse 1.0 isolation, multi-route state, URL capture and fail-closed behavior;
- prove the screenshot-style layout in loaded Chromium with no legacy New chat button;
- pass existing full audit/dependency/package gates before merge and again on exact post-merge product main.

## Current State

- Previous verified release: 0.8.1.
- 0.8.1 immutable product basis: `8d186a53a9764fa032f30d33c078f770a7c016d2`.
- State-only main head before 0.8.2 work: `c909d04fac4e2b8a19ad8bfc669ed064c7909ec5`.
- Execution branch: `fix/pulse2-project-composer-0.8.2`.
- Direct project composer detection and bounded hydration wait implemented.
- Loaded-browser fixture changed to the screenshot-style UI with no separate New chat button.
- Version/release tooling bumped to 0.8.2 beta.

## Critical Work

- [x] Root-cause current Project UI incompatibility.
- [x] Add direct project composer-shell detection.
- [x] Add bounded hydration wait and preserve legacy button fallback.
- [x] Add screenshot-style browser regression fixture.
- [x] Bump deterministic release tooling to 0.8.2 beta.
- [ ] Open canonical PR on exact candidate.
- [ ] Pass PR full audits, loaded Chromium E2E, dependency and reproducible package gates.
- [ ] Perform final adversarial review.
- [ ] Merge with exact-head guard.
- [ ] Repeat material validation on exact post-merge main.
- [ ] Persist DONE/VERIFIED evidence.

## Blockers

NONE currently known.

## Active Execution

HQ_DIRECT on `fix/pulse2-project-composer-0.8.2`.

## Next Action

Open the canonical PR and validate the screenshot-style composer regression on the exact GitHub candidate.

## Recovery Note

Do not weaken authentication or fail-closed send guards to make the test pass. The bug is specifically project-entry detection/hydration. Preserve 0.8.1 multi-route behavior and only expand the compatible project composer entry paths.

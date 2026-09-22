---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 77
updated_at: 2026-09-22T13:50:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: SATISFIED
handoff_status: READY
basis_ref: main
basis_sha: 8d186a53a9764fa032f30d33c078f770a7c016d2
---

# HQ Critical Path

## Current Release Contract

Release target: ChatPulse 0.8.1 beta — fix Pulse 2.0 settings reset/flicker, make the current-chat URL optional with automatic first project-chat creation, and support multiple independent project routes in one Pulse 2.0 session.

Definition of DONE: implementation merged through canonical PR after repeated unit/static/browser/package/dependency gates, then exact post-merge product `main` reproduces the full validation and the deterministic package identity.

## Repository Basis

- Previous release 0.8.0 remains DONE and verified; immutable product basis `aa1aadfbee6ef7887e2befde68d7567fb0152137`.
- 0.8.1 frozen candidate: `76ce4a59abac5ab65f124fa3f055d5f4ad8d3371`.
- Canonical PR: #35, merged.
- Exact 0.8.1 product merge / immutable release basis: `8d186a53a9764fa032f30d33c078f770a7c016d2`.
- This state document may advance `main` after the immutable product basis above without changing release contents.

## Delivered Behavior

- Pulse 2.0 form values are no longer blindly rewritten on background state pushes.
- UI settings use an isolated draft/dirty state; focused or unsaved inputs survive live runtime updates.
- Each Pulse 2.0 route has its own project URL, optional current chat, managed tab, phase, current URL, cycle/continuation counters, history and error state.
- Up to 20 independent project routes can be configured in one Pulse 2.0 session.
- Shared continuation text, start message, delay, continuations-per-cycle and cycles-per-project remain global settings.
- A blank current-chat field starts in project initialization mode: create the first project chat, send the start message, wait two minutes, capture the real permanent `/c/...` URL, and continue that chat as cycle 1.
- Initial auto-created project chats use history source `project-initial` and do not incorrectly increment to cycle 2.
- Route operations use a serialized background operation queue so simultaneous UI/alarm events cannot clobber multi-route state.
- One route may complete or fail without stopping other active routes.
- Duplicate current-chat URLs across Pulse 2.0 routes are blocked.
- Legacy 0.8.0 single-route Pulse 2.0 state migrates into schema v2 without losing the current chat/runtime.
- Pulse 1.0 isolation remains intact; Pulse 2.0 reads Pulse 1.0 state only for same-chat collision protection.
- Existing two-minute permanent URL capture, bounded retries and fail-closed behavior remain intact.

## Validation / Audit Evidence

### Focused and adversarial review

- Focused Pulse 2.0 model/runtime regression suite before PR: 17/17 PASS.
- Adversarial review covered legacy schema migration, mixed `monitoring` + `capture-wait` routes, per-route terminal isolation, duplicate-chat protection, alarm scheduling and serialized write ordering.
- No additional product blocker remained after review.
- A known headless Playwright first-load authentication-fixture race occurred once in PR browser CI; the same exact candidate passed when only the browser job was rerun, with no product-code change and without weakening production authentication guards.

### Candidate / PR evidence

- Candidate head: `76ce4a59abac5ab65f124fa3f055d5f4ad8d3371`.
- PR #35 release run `35735519878`: SUCCESS after browser-only rerun.
- PR #35 dependency run `35735519780`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Retained Pulse 1.0 loaded-extension Chromium E2E: SUCCESS.
- Pulse 2.0 loaded-extension browser regressions:
  - unsaved form draft survives live background state push: PASS;
  - optional empty current-chat settings: PASS;
  - multi-route persistence: PASS;
  - retained full project rotation: PASS;
  - Pulse 1.0 isolation: PASS.
- Reproducible package/provenance: SUCCESS.
- Candidate artifact ID: `10697171593`, name `ChatPulse-Chrome-v0.8.1-beta`.

### Exact post-merge product-main evidence

- Product merge SHA: `8d186a53a9764fa032f30d33c078f770a7c016d2`.
- Exact-main release run `35735867643`: SUCCESS.
- Exact-main dependency run `35735867723`: SUCCESS.
- Five full extension audit cycles: 5/5 SUCCESS.
- Retained Pulse 1.0 loaded-extension Chromium E2E: SUCCESS.
- Pulse 2.0 multi-route loaded-extension Chromium E2E: SUCCESS.
- Reproducible package/provenance: SUCCESS.
- Exact-main artifact ID: `10698071162`, name `ChatPulse-Chrome-v0.8.1-beta`.

### Canonical package identity

Candidate and exact post-merge product `main` generated identical deterministic release payload hashes:

- `ChatPulse-Chrome-v0.8.1-beta.zip` SHA-256: `4dd4ca11f36552186e93f21fe284bdc80dc6c6ff25cf47126eff0023041bc244`.
- `ChatPulse-Chrome-v0.8.1-source-manifest.txt` SHA-256: `37003bf467f2574251233a9f7660b99203498113ac0eafb991e0a444cec095d0`.

## Critical Work

- [x] Isolate editable UI draft from live runtime state.
- [x] Define schema-v2 multi-route model with legacy single-route migration.
- [x] Make current chat optional and make auto-created first chat cycle 1.
- [x] Serialize multi-route background writes.
- [x] Add multi-project UI and independent per-route runtime/history.
- [x] Add focused and loaded-browser regression coverage.
- [x] Pass 5/5 PR full audits and dependency gate.
- [x] Pass loaded Chromium E2E after isolating a non-product fixture race.
- [x] Produce deterministic 0.8.1 package/provenance.
- [x] Merge PR #35 with exact-head guard.
- [x] Repeat all material validation on exact post-merge `main`.
- [x] Verify exact-main package hashes equal the PR candidate byte-for-byte.

## Blockers

NONE.

## Active Execution

NONE. ChatPulse 0.8.1 release contract is complete.

## Next Action

None for this release. Await the next owner-requested bug/feature; do not reopen 0.8.1 without new evidence.

## Recovery Note

Resume from the live organizational master prompt plus this document. Immutable 0.8.1 product release basis is `8d186a53a9764fa032f30d33c078f770a7c016d2`; PR #35 and the candidate/exact-main evidence above satisfy the release contract.

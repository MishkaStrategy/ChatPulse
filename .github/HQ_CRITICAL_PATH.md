---
schema: hq-critical-path/v1
repository: MishkaStrategy/ChatPulse
default_branch: main
critical_path_revision: 30
updated_at: 2026-09-05T10:51:00Z
project_state: DONE
critical_path_status: VERIFIED
release_contract_status: EXPLICIT
handoff_status: READY
basis_ref: main
basis_sha: 310ee9e445e14b4a2099d5aa3c515453abb05172
---

# HQ Critical Path

## 1. Current Release Contract

Release target: ChatPulse 0.7.2 beta — private GitHub repository support through a locally stored read-only GitHub token, plus an explicit token-permission verification control in each per-chat GitHub Actions profile.

Release surface: GitHub Actions authenticated read client and credential store, Control Center GitHub token UI, security/privacy documentation, deterministic tests, loaded-Chromium regression gate, release versioning and reproducible packaging.

Definition of RELEASED: public repositories continue to work without credentials; a private repository can be watched when a GitHub token with repository access and Actions read permission is stored; a pasted token can be checked against the exact configured `owner/repo` workflow-runs endpoint before it is saved; credentials remain local-only, hidden from content scripts, excluded from portable export/logs/runtime state, and never grant or perform GitHub writes; all 0.7.1 active-run, idle-reset, fail-closed and at-most-once restart semantics remain intact; frozen branch, canonical PR merge-tree and post-merge main evidence all pass.

Mandatory release gates:

- [x] Authenticated private-repository workflow-run reads use a conditional `Authorization: Bearer` header on the exact repository-scoped read endpoint; public repositories remain unauthenticated by default.
- [x] UI recommends a fine-grained PAT restricted to the target repository with `Actions: Read-only`; classic PAT broad `repo` scope is explicitly not recommended.
- [x] **Проверить токен** checks the exact configured `owner/repo` Actions read path and gives actionable 401/403/404/rate-limit feedback without echoing the token.
- [x] A check-only action does not persist a newly pasted token; saving a new token verifies access first and then stores it locally.
- [x] Token is stored only in a dedicated repository-keyed `chrome.storage.local` credential store; supported Chrome builds restrict local storage access to `TRUSTED_CONTEXTS`.
- [x] Token never enters `chatpulseState`, portable export, logs, ChatGPT content messages, package provenance or UI/runtime state returned by ChatPulse.
- [x] GitHub integration remains bounded read-only GET behavior; no workflow dispatch or repository writes were added.
- [x] Existing unfinished-run blocking, active-to-idle fresh baseline, API fail-closed and one-restart-per-marker semantics remain green.
- [x] Five deterministic audit cycles, Chromium E2E and reproducible package/provenance pass on frozen branch, PR merge-tree and main.
- [x] Dependency runner policy passes on its configured release-relevant triggers: canonical PR and post-merge main. The workflow intentionally has no release-branch push trigger.

Required release evidence: exact branch/PR/main SHAs, workflow IDs, 92/92 test counts, token-auth protocol and secret-isolation assertions, browser E2E result, dependency-policy results, reproducible package/source-manifest SHA-256.

Known explicit exclusions: GitHub write permissions; workflow dispatch; credentials in backend/cloud/sync storage; OAuth device flow; GitHub App installation flow; private repository support without a user-provided credential; committing or using an owner's real private-repository token in CI; unrelated draft PR #17.

## 2. Repository Basis

Default branch: main.
Validated product main commit: `310ee9e445e14b4a2099d5aa3c515453abb05172`.
Critical-path basis ref: main.
Critical-path basis SHA: `310ee9e445e14b4a2099d5aa3c515453abb05172`.
Canonical integration branch: `release/0.7.2-private-github-token`.
Frozen final branch head: `42627a63e1f386db65c8f1cc3ebfe9d9587b5c6b`.
Canonical PR: #25.
Validated PR merge-tree SHA: `f551ccd958605d56272d36682ce3c742b362ed6e`.
Relevant open PRs after release: #17 draft remains separate/excluded.
Relevant Issues: none required for this owner-direct patch.
Relevant CI / workflows: `.github/workflows/extension-ci.yml`, `.github/workflows/docker-runner-policy.yml`.
Relevant release/deployment state: 0.7.2 beta merged to main and exact post-merge product evidence is green; no Chrome Web Store publication is required by this release contract.

## 3. Repository Scan Summary

Project purpose: local Chrome MV3 ChatGPT task runner.
Architecture / major components: popup/options UI, MV3 service worker, pure state/model helpers, ChatGPT content script, optional Telegram integration and GitHub Actions watchdog.
Build / packaging: deterministic Python ZIP/source-manifest packaging plus Node validation.
Tests / validation: 92 deterministic extension tests plus Playwright loaded-Chromium E2E.
CI: five independent deterministic audit cycles, browser E2E, reproducible package/provenance and dependency runner policy.
Release / deployment: validated PR merge to main; package artifact generated by main CI.
Governance: organizational HQ master 1.2 live-read for this wave; this file records the final verified state.
External release dependencies: GitHub REST API and Chromium download for E2E.
Material findings: `MishkaStrategy/Elza` is private, so 0.7.1 could never create a tokenless baseline. 0.7.2 adds a separate local repository-keyed token store and conditionally authenticates only the same read-only workflow-runs request. The watchdog model/service-worker state machine required no behavioral rewrite because the central GitHub client supplies credentials transparently for a matching repository.

## 4. Release Gates

### GATE-1 — Secure private-repository authentication
Status: SATISFIED
Evidence: deterministic tests prove public requests omit Authorization, authenticated requests use Bearer only on the exact workflow-runs endpoint, 401/403/404/rate-limit failures stay fail-closed, storage is repository-keyed and token values are not returned by public helpers.
Blocking items: NONE.

### GATE-2 — Token verification UX
Status: SATISFIED
Evidence: Control Center has masked token input, **Проверить токен**, remove-token action, least-privilege `Actions: Read-only` guidance and exact-repository access status; check-only does not save a newly pasted token and profile save verifies before persistence.
Blocking items: NONE.

### GATE-3 — Frozen release branch
Status: SATISFIED
Evidence: branch head `42627a63e1f386db65c8f1cc3ebfe9d9587b5c6b`; release run `33961375276` SUCCESS; 5/5 deterministic cycles; inspected cycle 92/92 PASS; Chromium E2E PASS; package/provenance PASS; artifact ID `9968057296`.
Blocking items: NONE.

### GATE-4 — Canonical PR merge-tree
Status: SATISFIED
Evidence: PR #25 exact merge-tree `f551ccd958605d56272d36682ce3c742b362ed6e`; release run `33961500917` SUCCESS; 5/5 deterministic cycles; inspected cycle 92/92 PASS; Chromium E2E PASS; package/provenance PASS; dependency-policy run `33961500822` SUCCESS; artifact ID `9968092651`; reviews none; review threads none; mergeable clean before merge.
Blocking items: NONE.

### GATE-5 — Post-merge main
Status: SATISFIED
Evidence: product merge commit `310ee9e445e14b4a2099d5aa3c515453abb05172`; release run `33961601438` SUCCESS; dependency-policy run `33961601439` SUCCESS; all five audit cycles SUCCESS; inspected cycle 92/92 PASS; browser E2E job `101294314938` SUCCESS; package/provenance job `101294406843` SUCCESS; main artifact ID `9968122162`.
Blocking items: NONE.

## 5. Current Critical Path

CP-1 — implement least-privilege GitHub credential path and verification UI: DONE.
CP-2 — validate frozen 0.7.2 branch: DONE.
CP-3 — validate canonical PR #25 merge-tree: DONE.
CP-4 — merge exact head and validate main: DONE.
CP-5 — persist verified 0.7.2 release state: DONE by this revision.

## 6. Active Execution Registry

HQ: DONE for 0.7.2 private-repository token wave.
Workers: NONE.
Codex: NONE.
Zero-model control: NONE.
CI/runtime: no active release-critical execution.

## 7. Safe Parallel Work

NONE — release wave is complete.

## 8. Current Blockers

NONE.

## 9. Critical Path Audits

Repository Coverage Audit: PASS — product/release diff is limited to 15 intended files covering the central GitHub client/credential store, Control Center token UI, deterministic security/UI tests, validator, version/package/workflow and security/privacy docs. No service-worker/model rewrite was needed.

Evidence Audit: PASS — exact frozen branch, exact PR merge-tree and exact post-merge main have independent green evidence; canonical product hashes match across all three stages.

Release Alignment Audit: PASS — changes are limited to owner-requested private GitHub support and token-permission verification plus necessary security/release hardening.

Dependency & Ordering Audit: PASS — credential/client boundary -> verification UI/tests -> branch validation -> PR merge-tree/dependency policy -> exact merge -> main validation -> persistence. Dependency policy intentionally triggers on PR/main, not release-branch push; both applicable runs passed.

Execution & Parallelism Audit: PASS — one canonical HQ writer handled the tightly coupled credential/client/UI boundary; project runners supplied exact-ref evidence.

Adversarial Audit: PASS — token is separate from model state and portable export; content script never receives it; `TRUSTED_CONTEXTS` is requested where supported; public repos remain tokenless; authenticated access is a conditional Bearer header only on repository-scoped GET workflow-runs; no GitHub write/dispatch path exists; verification and API failures are fail-closed; token value is never echoed in status/runtime helpers; package secret scan passed.

Material findings and resolutions: no real owner token is committed or used in CI. CI proves protocol, storage, isolation, UI, existing watchdog and loaded-MV3 behavior. The definitive live proof that a specific user token can read `MishkaStrategy/Elza` is the in-extension **Проверить токен** action in the user's Chrome profile.

## 10. Release Evidence Summary

Frozen branch head: `42627a63e1f386db65c8f1cc3ebfe9d9587b5c6b`.
Branch release run: `33961375276` — SUCCESS; 5/5 x 92/92; Chromium E2E PASS; package/provenance PASS; artifact ID `9968057296`.

PR #25 merge-tree: `f551ccd958605d56272d36682ce3c742b362ed6e`.
PR release run: `33961500917` — SUCCESS; exact merge-ref; 5/5 x 92/92; Chromium E2E PASS; package/provenance PASS; artifact ID `9968092651`.
PR dependency policy: `33961500822` — SUCCESS.

Post-merge main product commit: `310ee9e445e14b4a2099d5aa3c515453abb05172`.
Main release run: `33961601438` — SUCCESS; exact main SHA; five audit cycles SUCCESS; inspected cycle 92/92 PASS; loaded-browser watchdog E2E PASS; package/provenance PASS.
Main dependency policy: `33961601439` — SUCCESS.
Main artifact ID: `9968122162`; artifact container digest `sha256:9e92e1200fa5b0592aa0ee3bd71653f22f9fc737e57ac96954bff1f0a45d40f1`; repository retention policy reduces retention to 1 day.

Canonical 0.7.2 beta product ZIP SHA-256:
`a788ba1766a047f656009b05af5aeaf517ea9f99fd17a3f437811090528dc4cb`

Canonical source-manifest SHA-256:
`4c0775cb7c64e2903c448bee2d2e12ac99df011334debcd3840a7219955c95e1`

Packaged extension file count: 16. Reproducible timestamp: `2020-01-01T00:00:00`.

## 11. Runtime Contract

GitHub watchdog polling remains a distinct Chrome alarm at a 10-minute minimum cadence and independent of the normal ChatGPT check interval. Public repositories use the existing no-Authorization GET path. If a matching repository-keyed token is stored, the central GitHub client adds `Authorization: Bearer <token>` only to `GET /repos/{owner}/{repo}/actions/runs?per_page=100`; browser credentials remain omitted. Any API/auth/rate-limit/malformed failure remains error-only and cannot trigger restart.

**Проверить токен** requests the existing optional `api.github.com` origin from a direct user action and checks the exact repository Actions endpoint. Checking a newly pasted token does not save it. Saving a profile with a new token verifies the same access first and only then writes the token to the local credential store. The token field is cleared after save and the token value is not exposed back to UI state.

Existing 0.7.1 semantics remain unchanged: every observed non-`completed` run blocks restart; active observations refresh activity; active-to-idle starts a fresh N-minute window; restart requires a successful current poll and all ChatGPT live-send safety gates; one activity marker produces at most one submitted restart.

## 12. Next Action

Exact next action: owner updates the local unpacked extension to 0.7.2 and uses **Проверить токен** for the private `MishkaStrategy/Elza` repository, or HQ awaits a new owner scope/evidence-backed regression.
Executor: OWNER only for supplying/creating the private credential locally; no token should be sent to HQ/chat.
Expected evidence: Control Center reports successful Actions read access and a subsequent watchdog poll creates the Elza baseline.
Acceptance condition: private Elza credential verifies locally; no additional code/release action is required unless a regression appears.

## 13. Last Material Revision

What changed: ChatPulse 0.7.2 beta adds least-privilege private GitHub Actions reads and an explicit token-permission verification button while preserving public tokenless behavior and all 0.7.1 watchdog safety semantics.
Why the critical path changed: `MishkaStrategy/Elza` is private, so 0.7.1 could not create a baseline without authentication; owner requested a secure upgrade and permission check control.
Evidence causing closure: branch `33961375276`, PR `33961500917`, main `33961601438`, applicable dependency-policy runs, exact SHAs, 5x92/92, browser E2E and equal reproducible package hashes.

## 14. Chat Rotation Checkpoint

Safe to rotate chat: YES.
Last completed atomic action: exact main product commit `310ee9e445e14b4a2099d5aa3c515453abb05172` passed full release gate, dependency policy, loaded-browser E2E and reproducible package/provenance equality.
Active external executions and exact refs: NONE.
Unpersisted material reasoning: NONE.
Recovery entrypoint: live-read organizational master prompt, this revision and current main; treat `310ee9e...` as the validated 0.7.2 product merge beneath the later HQ-only state commit created by this revision.
Exact next action after recovery: await owner scope or evidence-backed regression; private token live verification stays local to the owner's Chrome.
Rotation blockers: NONE.

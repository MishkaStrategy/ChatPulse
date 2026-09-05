import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchLatestGithubWorkflowRun,
  githubActionsRunsURL,
  normalizeGithubToken,
  parseLatestWorkflowRunPayload,
  verifyGithubTokenAccess
} from "../../chrome-extension/background/github-actions.js";

test("GitHub Actions URL is repository-scoped and read-only", () => {
  assert.equal(
    githubActionsRunsURL("MishkaStrategy/ChatPulse"),
    "https://api.github.com/repos/MishkaStrategy/ChatPulse/actions/runs?per_page=100"
  );
  assert.throws(() => githubActionsRunsURL("https://github.com/MishkaStrategy/ChatPulse"));
});

test("workflow payload keeps latest activity marker and counts unfinished runs", () => {
  assert.deepEqual(parseLatestWorkflowRunPayload({ workflow_runs: [] }), {
    runId: null,
    createdAt: null,
    activeRunCount: 0
  });
  assert.deepEqual(parseLatestWorkflowRunPayload({
    workflow_runs: [
      { id: 123, created_at: "2026-09-02T07:00:00Z", status: "completed", name: "not-exported" },
      { id: 122, created_at: "2026-09-02T06:55:00Z", status: "in_progress" },
      { id: 121, created_at: "2026-09-02T06:50:00Z", status: "queued" },
      { id: 120, created_at: "2026-09-02T06:45:00Z", status: "waiting" },
      { id: 119, created_at: "2026-09-02T06:40:00Z", status: "requested" },
      { id: 118, created_at: "2026-09-02T06:35:00Z", status: "pending" }
    ]
  }), {
    runId: "123",
    createdAt: "2026-09-02T07:00:00Z",
    activeRunCount: 5
  });
  assert.throws(() => parseLatestWorkflowRunPayload({ workflow_runs: [{ id: 123, created_at: "2026-09-02T07:00:00Z" }] }));
  assert.throws(() => parseLatestWorkflowRunPayload({ workflow_runs: [{ id: 123, status: "completed" }] }));
  assert.throws(() => parseLatestWorkflowRunPayload({}));
});

test("GitHub client sends no credentials for public repository by default", async () => {
  const calls = [];
  const result = await fetchLatestGithubWorkflowRun("MishkaStrategy/ChatPulse", async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ workflow_runs: [{ id: 7, created_at: "2026-09-02T07:00:00Z", status: "in_progress" }] })
    };
  });
  assert.deepEqual(result, { runId: "7", createdAt: "2026-09-02T07:00:00Z", activeRunCount: 1 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(Object.hasOwn(calls[0].init.headers, "Authorization"), false);
});

test("authenticated GitHub client sends Bearer token only to the repository Actions read endpoint", async () => {
  const token = "github_pat_TEST_ONLY_12345678901234567890";
  const calls = [];
  const result = await fetchLatestGithubWorkflowRun("MishkaStrategy/Elza", async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ workflow_runs: [{ id: 88, created_at: "2026-09-05T10:00:00Z", status: "completed" }] })
    };
  }, token);
  assert.deepEqual(result, { runId: "88", createdAt: "2026-09-05T10:00:00Z", activeRunCount: 0 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.github.com/repos/MishkaStrategy/Elza/actions/runs?per_page=100");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${token}`);
});

test("token verification proves Actions read access using the exact configured repository", async () => {
  const token = "github_pat_TEST_ONLY_abcdefghijklmnopqrstuvwxyz";
  const calls = [];
  const result = await verifyGithubTokenAccess("MishkaStrategy/Elza", token, async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ workflow_runs: [] })
    };
  });
  assert.equal(result.repository, "MishkaStrategy/Elza");
  assert.equal(result.permission, "actions:read");
  assert.equal(result.activeRunCount, 0);
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${token}`);
});

test("GitHub token validation rejects empty, whitespace and implausibly short values", () => {
  assert.equal(normalizeGithubToken(""), null);
  assert.equal(normalizeGithubToken("short"), null);
  assert.equal(normalizeGithubToken("github_pat_valid_but has space"), null);
  assert.equal(normalizeGithubToken("github_pat_TEST_ONLY_123456789012345"), "github_pat_TEST_ONLY_123456789012345");
});

test("private-repository auth errors are actionable and remain fail closed", async () => {
  const token = "github_pat_TEST_ONLY_12345678901234567890";
  await assert.rejects(
    () => fetchLatestGithubWorkflowRun("MishkaStrategy/Elza", async () => ({
      ok: false,
      status: 401,
      headers: { get: () => null }
    }), token),
    /token отклонён|401/
  );
  await assert.rejects(
    () => fetchLatestGithubWorkflowRun("MishkaStrategy/Elza", async () => ({
      ok: false,
      status: 403,
      headers: { get: () => null }
    }), token),
    /Actions: Read-only|403/
  );
  await assert.rejects(
    () => fetchLatestGithubWorkflowRun("MishkaStrategy/Elza", async () => ({
      ok: false,
      status: 404,
      headers: { get: () => null }
    }), token),
    /token не имеет.*доступа|404/
  );
});

test("404, rate limit and malformed public responses fail closed", async () => {
  await assert.rejects(
    () => fetchLatestGithubWorkflowRun("a/b", async () => ({
      ok: false,
      status: 404,
      headers: { get: () => null }
    })),
    /private repository|недоступен без token/
  );
  await assert.rejects(
    () => fetchLatestGithubWorkflowRun("a/b", async () => ({
      ok: false,
      status: 403,
      headers: { get: (name) => name === "x-ratelimit-remaining" ? "0" : null }
    })),
    /rate limit/
  );
  await assert.rejects(
    () => fetchLatestGithubWorkflowRun("a/b", async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ nope: true })
    })),
    /неожиданный ответ/
  );
  await assert.rejects(
    () => fetchLatestGithubWorkflowRun("a/b", async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ workflow_runs: [{ id: 1, created_at: "2026-09-02T07:00:00Z", status: null }] })
    })),
    /неполный workflow run/
  );
});

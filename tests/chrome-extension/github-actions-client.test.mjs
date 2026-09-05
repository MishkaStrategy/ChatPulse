import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchLatestGithubWorkflowRun,
  githubActionsRunsURL,
  parseLatestWorkflowRunPayload
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

test("GitHub client sends no credentials and accepts public run status metadata", async () => {
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

test("404, rate limit and malformed responses fail closed", async () => {
  await assert.rejects(
    () => fetchLatestGithubWorkflowRun("a/b", async () => ({
      ok: false,
      status: 404,
      headers: { get: () => null }
    })),
    /не найден|недоступен/
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

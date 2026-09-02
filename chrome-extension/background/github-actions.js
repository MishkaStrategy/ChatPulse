import { normalizeGithubRepository } from "../lib/model-v2.js";

export const GITHUB_API_ORIGIN = "https://api.github.com/*";
const API_VERSION = "2022-11-28";

export async function hasGithubApiPermission() {
  return chrome.permissions.contains({ origins: [GITHUB_API_ORIGIN] });
}

export function githubActionsRunsURL(repository) {
  const normalized = normalizeGithubRepository(repository);
  if (!normalized) throw new Error("Некорректный GitHub repository: ожидается owner/repo.");
  const [owner, repo] = normalized.split("/");
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/runs?per_page=1`;
}

export function parseLatestWorkflowRunPayload(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.workflow_runs)) {
    throw new Error("GitHub Actions вернул неожиданный ответ.");
  }
  const [run] = payload.workflow_runs;
  if (!run) return { runId: null, createdAt: null };
  const runId = run.id === null || run.id === undefined ? null : String(run.id);
  const createdAt = typeof run.created_at === "string" && Number.isFinite(Date.parse(run.created_at))
    ? run.created_at
    : null;
  if (!runId || !createdAt) throw new Error("GitHub Actions вернул неполный workflow run.");
  return { runId, createdAt };
}

export async function fetchLatestGithubWorkflowRun(repository, fetchImpl = fetch) {
  const response = await fetchImpl(githubActionsRunsURL(repository), {
    method: "GET",
    cache: "no-store",
    credentials: "omit",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION
    }
  });

  if (!response?.ok) {
    const status = Number(response?.status || 0);
    if (status === 403 && response?.headers?.get?.("x-ratelimit-remaining") === "0") {
      throw new Error("GitHub API rate limit исчерпан; watchdog не считает это простоем.");
    }
    if (status === 404) {
      throw new Error("GitHub repository/Actions не найден или недоступен публично.");
    }
    throw new Error(`GitHub Actions API недоступен (HTTP ${status || "?"}).`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("GitHub Actions вернул не-JSON ответ.");
  }
  return parseLatestWorkflowRunPayload(payload);
}

import { normalizeGithubRepository } from "../lib/model-v2.js";

export const GITHUB_API_ORIGIN = "https://api.github.com/*";
export const GITHUB_CREDENTIALS_KEY = "chatpulseGithubCredentialsV1";
const API_VERSION = "2022-11-28";
const RUN_PAGE_SIZE = 100;
let storageProtectionPromise = null;

void protectGithubCredentialStorage();

export async function protectGithubCredentialStorage() {
  if (storageProtectionPromise) return storageProtectionPromise;
  storageProtectionPromise = (async () => {
    try {
      const local = globalThis.chrome?.storage?.local;
      if (typeof local?.setAccessLevel === "function") {
        await local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
        return true;
      }
    } catch {
      // Older Chromium builds may not expose setAccessLevel. Credential reads/writes
      // still remain extension-local; supported Chrome builds use TRUSTED_CONTEXTS.
    }
    return false;
  })();
  return storageProtectionPromise;
}

export async function hasGithubApiPermission() {
  return chrome.permissions.contains({ origins: [GITHUB_API_ORIGIN] });
}

export function githubActionsRunsURL(repository) {
  const normalized = normalizeGithubRepository(repository);
  if (!normalized) throw new Error("Некорректный GitHub repository: ожидается owner/repo.");
  const [owner, repo] = normalized.split("/");
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/runs?per_page=${RUN_PAGE_SIZE}`;
}

export function githubCredentialKey(repository) {
  const normalized = normalizeGithubRepository(repository);
  return normalized ? normalized.toLowerCase() : null;
}

export function normalizeGithubToken(value) {
  if (typeof value !== "string") return null;
  const token = value.trim();
  if (token.length < 20 || token.length > 1024) return null;
  if (/\s|[\u0000-\u001f\u007f]/.test(token)) return null;
  return token;
}

export async function listGithubTokenRepositories() {
  const store = await loadGithubCredentialStore();
  return Object.keys(store.tokens).sort();
}

export async function saveGithubToken(repository, token) {
  const key = githubCredentialKey(repository);
  const normalizedToken = normalizeGithubToken(token);
  if (!key) throw new Error("Укажите repository в формате owner/repo.");
  if (!normalizedToken) throw new Error("GitHub token выглядит некорректно.");
  const store = await loadGithubCredentialStore();
  await protectGithubCredentialStorage();
  await chrome.storage.local.set({
    [GITHUB_CREDENTIALS_KEY]: {
      version: 1,
      tokens: { ...store.tokens, [key]: normalizedToken }
    }
  });
  return { repository: key, tokenConfigured: true };
}

export async function clearGithubToken(repository) {
  const key = githubCredentialKey(repository);
  if (!key) return { repository: null, tokenConfigured: false };
  const store = await loadGithubCredentialStore();
  const tokens = { ...store.tokens };
  delete tokens[key];
  await protectGithubCredentialStorage();
  await chrome.storage.local.set({
    [GITHUB_CREDENTIALS_KEY]: { version: 1, tokens }
  });
  return { repository: key, tokenConfigured: false };
}

export function parseLatestWorkflowRunPayload(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.workflow_runs)) {
    throw new Error("GitHub Actions вернул неожиданный ответ.");
  }
  const runs = payload.workflow_runs;
  if (!runs.length) return { runId: null, createdAt: null, activeRunCount: 0 };

  let activeRunCount = 0;
  for (const candidate of runs) {
    if (!candidate || typeof candidate !== "object" || typeof candidate.status !== "string" || !candidate.status) {
      throw new Error("GitHub Actions вернул неполный workflow run.");
    }
    if (candidate.status !== "completed") activeRunCount += 1;
  }

  const [run] = runs;
  const runId = run.id === null || run.id === undefined ? null : String(run.id);
  const createdAt = typeof run.created_at === "string" && Number.isFinite(Date.parse(run.created_at))
    ? run.created_at
    : null;
  if (!runId || !createdAt) throw new Error("GitHub Actions вернул неполный workflow run.");
  return { runId, createdAt, activeRunCount };
}

export async function fetchLatestGithubWorkflowRun(repository, fetchImpl = fetch, tokenOverride = undefined) {
  const normalizedRepository = normalizeGithubRepository(repository);
  if (!normalizedRepository) throw new Error("Некорректный GitHub repository: ожидается owner/repo.");

  let token = null;
  if (tokenOverride === undefined) {
    token = await loadGithubToken(normalizedRepository);
  } else if (tokenOverride !== null && tokenOverride !== "") {
    token = normalizeGithubToken(tokenOverride);
    if (!token) throw new Error("GitHub token выглядит некорректно.");
  }

  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetchImpl(githubActionsRunsURL(normalizedRepository), {
    method: "GET",
    cache: "no-store",
    credentials: "omit",
    headers
  });

  if (!response?.ok) throw githubApiError(response, Boolean(token));

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("GitHub Actions вернул не-JSON ответ.");
  }
  return parseLatestWorkflowRunPayload(payload);
}

export async function verifyGithubTokenAccess(repository, token = undefined, fetchImpl = fetch) {
  const normalizedRepository = normalizeGithubRepository(repository);
  if (!normalizedRepository) throw new Error("Укажите repository в формате owner/repo.");
  const candidate = token === undefined || token === ""
    ? await loadGithubToken(normalizedRepository)
    : normalizeGithubToken(token);
  if (!candidate) {
    throw new Error("Вставьте GitHub token или сначала сохраните его для этого repository.");
  }
  const activity = await fetchLatestGithubWorkflowRun(normalizedRepository, fetchImpl, candidate);
  return {
    repository: normalizedRepository,
    permission: "actions:read",
    ...activity
  };
}

async function loadGithubToken(repository) {
  const key = githubCredentialKey(repository);
  if (!key) return null;
  const store = await loadGithubCredentialStore();
  return store.tokens[key] || null;
}

async function loadGithubCredentialStore() {
  await protectGithubCredentialStorage();
  const local = globalThis.chrome?.storage?.local;
  if (!local?.get) return { version: 1, tokens: {} };
  const stored = await local.get(GITHUB_CREDENTIALS_KEY);
  const raw = stored?.[GITHUB_CREDENTIALS_KEY];
  const tokens = {};
  if (raw?.tokens && typeof raw.tokens === "object" && !Array.isArray(raw.tokens)) {
    for (const [key, value] of Object.entries(raw.tokens)) {
      const normalizedToken = normalizeGithubToken(value);
      if (/^[a-z0-9-]{1,39}\/[a-z0-9._-]{1,100}$/.test(key) && normalizedToken) {
        tokens[key] = normalizedToken;
      }
    }
  }
  return { version: 1, tokens };
}

function githubApiError(response, authenticated) {
  const status = Number(response?.status || 0);
  const rateRemaining = response?.headers?.get?.("x-ratelimit-remaining");
  if (status === 403 && rateRemaining === "0") {
    return new Error("GitHub API rate limit исчерпан; watchdog не считает это простоем.");
  }
  if (status === 401) {
    return new Error("GitHub token отклонён (HTTP 401). Проверьте token и срок его действия.");
  }
  if (status === 403 && authenticated) {
    return new Error("GitHub token не имеет достаточного read-доступа к Actions этого repository (HTTP 403). Для fine-grained PAT нужен Actions: Read-only.");
  }
  if (status === 404 && authenticated) {
    return new Error("GitHub repository не найден или token не имеет к нему доступа (HTTP 404). Проверьте repository access токена.");
  }
  if (status === 404) {
    return new Error("GitHub repository/Actions не найден или недоступен без token. Для private repository добавьте fine-grained PAT с Actions: Read-only.");
  }
  return new Error(`GitHub Actions API недоступен (HTTP ${status || "?"}).`);
}

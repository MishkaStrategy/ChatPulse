import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createChat,
  createPortableConfig,
  defaultState
} from "../../chrome-extension/lib/model-v2.js";

const manifestPath = fileURLToPath(new URL("../../chrome-extension/manifest.json", import.meta.url));
const optionsPath = fileURLToPath(new URL("../../chrome-extension/options/options.js", import.meta.url));
const optionsHtmlPath = fileURLToPath(new URL("../../chrome-extension/options/options.html", import.meta.url));
const tokenUiPath = fileURLToPath(new URL("../../chrome-extension/options/github-token-ui.js", import.meta.url));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const options = await readFile(optionsPath, "utf8");
const optionsHtml = await readFile(optionsHtmlPath, "utf8");
const tokenUi = await readFile(tokenUiPath, "utf8");

test("GitHub API permission is optional and never an install-time host permission", () => {
  assert.ok(manifest.optional_host_permissions.includes("https://api.github.com/*"));
  assert.equal(manifest.host_permissions.includes("https://api.github.com/*"), false);
});

test("Control Center requests GitHub permission only from direct user GitHub actions", () => {
  assert.ok(options.includes('const GITHUB_ORIGIN = "https://api.github.com/*"'));
  assert.ok(options.includes("chrome.permissions.request({ origins: [GITHUB_ORIGIN] })"));
  const permissionStart = options.indexOf("async function ensureGithubPermission()");
  const permissionEnd = options.indexOf("async function exportConfig()", permissionStart);
  const permissionBlock = options.slice(permissionStart, permissionEnd);
  assert.equal(permissionBlock.includes("permissions.contains"), false, "permission request must stay in the direct Save/Start user gesture");
  assert.ok(options.includes("if (draft.githubWatchEnabled)"));
  assert.ok(options.includes("await ensureGithubPermission()"));
  assert.ok(tokenUi.includes("chrome.permissions.request({ origins: [GITHUB_API_ORIGIN] })"));
  assert.ok(optionsHtml.includes("profile-github-watch-enabled"));
  assert.ok(optionsHtml.includes("profile-github-repository"));
  assert.ok(optionsHtml.includes("profile-github-idle"));
});

test("Control Center shows concrete owner/repo guidance and active-run restart rule", () => {
  assert.ok(optionsHtml.includes('placeholder="MishkaStrategy/ChatPulse"'));
  assert.ok(optionsHtml.includes("Формат: <code>owner/repo</code>"));
  assert.ok(optionsHtml.includes("Не вставляйте URL GitHub"));
  assert.ok(optionsHtml.includes("/actions"));
  assert.ok(optionsHtml.includes("Пока есть незавершённый GitHub Actions run, restart заблокирован"));
  assert.ok(optionsHtml.includes("отсчёт N минут начинается заново"));
  assert.ok(optionsHtml.includes("profile-github-watch-only"));
  assert.ok(optionsHtml.includes("Только GitHub Actions"));
  assert.ok(optionsHtml.includes("Обычный автоматический интервал для этого чата будет отключён"));
});

test("Control Center exposes a masked private-repository token field and explicit permission check", () => {
  assert.ok(optionsHtml.includes('class="profile-github-token" type="password"'));
  assert.ok(optionsHtml.includes('class="test-github-token secondary-button"'));
  assert.ok(optionsHtml.includes("Проверить токен"));
  assert.ok(optionsHtml.includes("Actions: Read-only"));
  assert.ok(optionsHtml.includes("Classic PAT"));
  assert.ok(optionsHtml.includes("не рекомендуется"));
  assert.ok(optionsHtml.includes("GitHub tokens"));
  assert.ok(tokenUi.includes("verifyGithubTokenAccess"));
  assert.ok(tokenUi.includes("saveGithubToken"));
  assert.ok(tokenUi.includes("clearGithubToken"));
  assert.ok(tokenUi.includes("githubTokenBypass"));
});

test("portable config includes watcher configuration but excludes all watcher runtime state and credentials", () => {
  const chat = {
    ...createChat({ title: "Project", url: "https://chatgpt.com/c/project" }),
    profile: {
      ...createChat({ title: "x", url: "https://chatgpt.com/c/x" }).profile,
      githubWatchEnabled: true,
      githubWatchOnly: true,
      githubRepository: "MishkaStrategy/ChatPulse",
      githubIdleMinutes: 45
    },
    githubLastRunId: "999",
    githubLastActivityAt: "2026-09-02T07:00:00.000Z",
    githubLastAttemptAt: "2026-09-02T07:01:00.000Z",
    githubLastCheckedAt: "2026-09-02T07:01:00.000Z",
    githubActiveRunCount: 2,
    githubLastRestartAt: "2026-09-02T07:02:00.000Z",
    githubLastRestartKey: "run:999",
    githubRestartCount: 3,
    githubRestartGraceKey: "run:999",
    githubRestartGraceUntil: "2026-09-02T07:09:00.000Z",
    githubLastError: "secret-ish runtime diagnostic"
  };
  const config = createPortableConfig({ ...defaultState(), chats: [chat] }, "2026-09-02T07:10:00.000Z");
  assert.equal(config.chats[0].profile.githubWatchEnabled, true);
  assert.equal(config.chats[0].profile.githubWatchOnly, true);
  assert.equal(config.chats[0].profile.githubRepository, "MishkaStrategy/ChatPulse");
  assert.equal(config.chats[0].profile.githubIdleMinutes, 45);
  const serialized = JSON.stringify(config);
  for (const forbidden of [
    "githubLastRunId", "githubLastActivityAt", "githubLastAttemptAt", "githubLastCheckedAt",
    "githubActiveRunCount", "githubLastRestartAt", "githubLastRestartKey", "githubRestartCount",
    "githubRestartGraceKey", "githubRestartGraceUntil", "githubLastError",
    "githubToken", "github_pat_", "secret-ish runtime diagnostic", "run:999"
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

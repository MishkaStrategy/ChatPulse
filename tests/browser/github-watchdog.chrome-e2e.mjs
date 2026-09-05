import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";

const EXTENSION_PATH = path.resolve("chrome-extension");
const CHAT_URL = "https://chatgpt.com/c/chatpulse-browser-e2e";
const GITHUB_ORIGIN = "https://api.github.com/*";
const REPOSITORY = process.env.CHATPULSE_E2E_REPOSITORY || "MishkaStrategy/ChatPulse";
const COMMAND = "CHATPULSE_BROWSER_E2E_CONTINUE";
const IDLE_MINUTES = 10;
const WAIT_MS = 30_000;

const userDataDir = await mkdtemp(path.join(os.tmpdir(), "chatpulse-browser-e2e-"));
let context = null;

try {
  context = await launchExtension(userDataDir);
  let serviceWorker = await extensionServiceWorker(context);
  const extensionId = new URL(serviceWorker.url()).host;

  // Query extension APIs from a real extension document rather than Playwright's
  // service-worker utility world. This is the same execution surface used by
  // the production Control Center.
  const initialOptionsPage = await context.newPage();
  await initialOptionsPage.goto(`chrome-extension://${extensionId}/options/options.html`, {
    waitUntil: "domcontentloaded"
  });
  const permissionInitiallyGranted = await hasGithubPermission(initialOptionsPage);
  assert.equal(
    permissionInitiallyGranted,
    false,
    "api.github.com must not be granted at extension install time"
  );

  await context.close();
  context = null;

  // Chromium owns the native optional-permission confirmation bubble, which is
  // outside Playwright's page automation surface. Seed the exact browser profile
  // permission state that results from user acceptance, then exercise the real
  // production chrome.permissions.request() path from the Control Center UI.
  await seedGrantedOptionalHost(userDataDir, extensionId, GITHUB_ORIGIN);

  context = await launchExtension(userDataDir);
  serviceWorker = await extensionServiceWorker(context);
  assert.equal(new URL(serviceWorker.url()).host, extensionId, "extension id changed across profile restart");

  const githubRequests = [];
  context.on("request", (request) => {
    if (!request.url().includes("api.github.com/repos/") || !request.url().includes("/actions/runs")) return;
    githubRequests.push({
      method: request.method(),
      url: request.url(),
      headers: request.headers()
    });
  });

  await context.route("https://chatgpt.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: chatFixtureHtml()
    });
  });

  const chatPage = await context.newPage();
  await chatPage.goto(CHAT_URL, { waitUntil: "domcontentloaded" });
  await waitForContentScript(serviceWorker, CHAT_URL);

  const optionsPage = await context.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options/options.html`, {
    waitUntil: "domcontentloaded"
  });
  assert.equal(
    await hasGithubPermission(optionsPage),
    true,
    "seeded optional GitHub permission is not active in Chromium"
  );

  await optionsPage.locator("#addCurrentTopButton").click();
  const row = optionsPage.locator(".chat-row").first();
  await row.waitFor({ state: "visible", timeout: WAIT_MS });
  await row.locator("summary").click();

  await row.locator(".profile-command").fill(COMMAND);
  await row.locator(".profile-github-watch-enabled").check();
  await row.locator(".profile-github-repository").fill(REPOSITORY);
  await row.locator(".profile-github-idle").fill(String(IDLE_MINUTES));
  await row.locator(".save-profile").click();

  await waitFor(async () => {
    const state = await getState(optionsPage);
    const chat = state.chats[0];
    return chat?.profile?.githubWatchEnabled === true
      && chat.profile.githubRepository === REPOSITORY
      && chat.profile.githubIdleMinutes === IDLE_MINUTES;
  }, "watchdog profile was not saved through Control Center");

  // Saving an enabled watcher calls chrome.permissions.request() from the same
  // user gesture. Because this Chromium profile already represents user acceptance,
  // request() must resolve true without weakening the production manifest.
  assert.equal(
    await hasGithubPermission(optionsPage),
    true,
    "GitHub optional permission disappeared after profile save"
  );

  await optionsPage.locator("#toggleButton").click();

  const chatBaseline = await waitFor(async () => {
    const state = await getState(optionsPage);
    const chat = state.chats[0];
    if (!state.enabled) return null;
    if (chat?.lastError) throw new Error(`ChatGPT baseline failed: ${chat.lastError}; state=${JSON.stringify(chat)}`);
    return chat?.lastObservedFingerprint ? { state, chat } : null;
  }, "ChatGPT DOM baseline was not established by the loaded extension");
  assert.ok(chatBaseline.chat.lastObservedSessionId, "ChatGPT baseline session id missing");

  const baseline = await waitFor(async () => {
    const state = await getState(optionsPage);
    const chat = state.chats[0];
    if (chat?.githubLastError) {
      throw new Error(`GitHub watchdog baseline failed: ${chat.githubLastError}; state=${JSON.stringify(chat)}`);
    }
    return chat?.githubLastCheckedAt ? { state, chat } : null;
  }, "GitHub watchdog baseline was not established by the loaded extension");

  assert.ok(baseline.chat.githubWatchStartedAt, "watchdog start timestamp missing");
  assert.equal(baseline.chat.githubRestartCount, 0, "baseline must not restart the chat");
  assert.equal(await sentCount(chatPage), 0, "baseline unexpectedly sent a continuation");

  let restarted = null;
  for (let attempt = 0; attempt < 3 && !restarted; attempt += 1) {
    await makeWatchdogStale(optionsPage);
    const previousCheck = (await getState(optionsPage)).chats[0].githubLastCheckedAt;
    await optionsPage.locator("#checkButton").click();

    restarted = await waitFor(async () => {
      const state = await getState(optionsPage);
      const chat = state.chats[0];
      if (chat.githubLastError) throw new Error(`watchdog live fetch failed: ${chat.githubLastError}; state=${JSON.stringify(chat)}`);
      if (chat.githubRestartCount === 1) return { state, chat };
      if (chat.githubLastCheckedAt && chat.githubLastCheckedAt !== previousCheck) return null;
      return null;
    }, `watchdog did not complete stale check attempt ${attempt + 1}`, 15_000, false);

    if (!restarted) {
      const state = await getState(optionsPage);
      const chat = state.chats[0];
      // A new workflow run may legitimately appear while this CI job is running.
      // Re-age the newly observed activity marker and retry instead of treating
      // concurrent GitHub activity as a product failure.
      if (chat.githubRestartCount !== 0) {
        throw new Error(`unexpected restart count ${chat.githubRestartCount}`);
      }
    }
  }

  if (!restarted) {
    const state = await getState(optionsPage);
    throw new Error(`watchdog never restarted after three stable-marker attempts: ${JSON.stringify(state.chats[0])}`);
  }

  await waitFor(async () => (await sentCount(chatPage)) === 1, "restart command was not submitted to ChatGPT-origin fixture");
  assert.equal(await latestUserMessage(chatPage), COMMAND, "restart command text mismatch");
  assert.equal(restarted.chat.githubRestartCount, 1, "exactly one restart must be recorded");
  assert.ok(restarted.chat.githubLastRestartKey, "restart idempotency key missing");
  assert.equal(restarted.chat.continuationCount, 1, "restart must count as one real continuation");

  const restartKey = restarted.chat.githubLastRestartKey;
  const beforeSecondCheck = finalWatchSnapshot(await getState(optionsPage));
  await optionsPage.locator("#checkButton").click();
  await waitFor(async () => {
    const state = await getState(optionsPage);
    const current = finalWatchSnapshot(state);
    return current.lastCheckAt !== beforeSecondCheck.lastCheckAt ? state : null;
  }, "second watchdog check did not finish");
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  const finalState = await getState(optionsPage);
  const finalChat = finalState.chats[0];
  assert.equal(await sentCount(chatPage), 1, "same activity marker caused a duplicate restart send");
  assert.equal(finalChat.githubRestartCount, 1, "same activity marker incremented restart count twice");
  assert.equal(finalChat.githubLastRestartKey, restartKey, "restart key changed without new GitHub activity");

  assert.ok(githubRequests.length >= 2, "browser did not issue live GitHub Actions requests");
  for (const request of githubRequests) {
    assert.equal(request.method, "GET", "GitHub watchdog issued a non-GET request");
    assert.match(request.url, /\/actions\/runs\?per_page=1$/);
    assert.equal(Object.hasOwn(request.headers, "authorization"), false, "GitHub request sent Authorization header");
    assert.equal(Object.hasOwn(request.headers, "cookie"), false, "GitHub request sent browser cookies");
  }

  console.log(`browser_e2e_extension_id=${extensionId}`);
  console.log(`browser_e2e_repository=${REPOSITORY}`);
  console.log(`browser_e2e_github_requests=${githubRequests.length}`);
  console.log(`browser_e2e_restart_key=${restartKey}`);
  console.log("browser_e2e_result=PASS");
} finally {
  if (context) await context.close().catch(() => {});
  await rm(userDataDir, { recursive: true, force: true });
}

async function launchExtension(userDataDir) {
  return chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: "chromium",
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });
}

async function extensionServiceWorker(browserContext) {
  const existing = browserContext.serviceWorkers()[0];
  if (existing) return existing;
  return browserContext.waitForEvent("serviceworker", { timeout: WAIT_MS });
}

async function hasGithubPermission(extensionPage) {
  return extensionPage.evaluate(
    async (origin) => chrome.permissions.contains({ origins: [origin] }),
    GITHUB_ORIGIN
  );
}

async function waitForContentScript(serviceWorker, url) {
  await waitFor(async () => serviceWorker.evaluate(async (targetUrl) => {
    const tabs = await chrome.tabs.query({ url: targetUrl });
    if (!tabs.length || !Number.isInteger(tabs[0].id)) return false;
    try {
      const response = await chrome.tabs.sendMessage(tabs[0].id, { type: "CHATPULSE_PING" });
      return response?.ok === true;
    } catch {
      return false;
    }
  }, url), "production content script did not attach to ChatGPT-origin fixture");
}

async function getState(extensionPage) {
  const response = await extensionPage.evaluate(async () => chrome.runtime.sendMessage({ type: "GET_STATE" }));
  if (!response?.ok) throw new Error(response?.error || "GET_STATE failed");
  return response.state;
}

function finalWatchSnapshot(state) {
  return {
    lastCheckAt: state.lastCheckAt,
    githubLastCheckedAt: state.chats[0]?.githubLastCheckedAt,
    githubRestartCount: state.chats[0]?.githubRestartCount
  };
}

async function makeWatchdogStale(extensionPage) {
  const staleAt = new Date(Date.now() - (IDLE_MINUTES + 2) * 60_000).toISOString();
  await extensionPage.evaluate(async ({ staleAt }) => {
    const stored = await chrome.storage.local.get("chatpulseState");
    const state = stored.chatpulseState;
    if (!state?.chats?.length) throw new Error("chatpulseState missing chat");
    const chat = state.chats[0];
    if (!chat.githubLastCheckedAt) throw new Error("watchdog baseline missing");
    if (!chat.lastObservedFingerprint) throw new Error("normal ChatGPT baseline missing");
    chat.githubWatchStartedAt = staleAt;
    chat.githubLastActivityAt = staleAt;
    chat.lastCommandedFingerprint = chat.lastObservedFingerprint;
    chat.lastDispatchOutcome = "confirmed";
    chat.githubLastRestartAt = null;
    chat.githubLastRestartKey = null;
    chat.githubRestartCount = 0;
    await chrome.storage.local.set({ chatpulseState: state });
  }, { staleAt });
}

async function seedGrantedOptionalHost(userDataDir, extensionId, origin) {
  const preferencesPath = path.join(userDataDir, "Default", "Preferences");
  const preferences = JSON.parse(await readFile(preferencesPath, "utf8"));
  const settings = preferences?.extensions?.settings?.[extensionId];
  assert.ok(settings, `Chromium preferences missing extension settings for ${extensionId}`);

  for (const key of ["active_permissions", "granted_permissions", "runtime_granted_permissions"]) {
    const permissionSet = settings[key] ||= {};
    permissionSet.api ||= [];
    permissionSet.explicit_host ||= [];
    permissionSet.scriptable_host ||= [];
    if (!permissionSet.explicit_host.includes(origin)) permissionSet.explicit_host.push(origin);
  }

  await writeFile(preferencesPath, JSON.stringify(preferences), "utf8");
}

async function sentCount(page) {
  return page.evaluate(() => Number(globalThis.__chatPulseE2ESentCount || 0));
}

async function latestUserMessage(page) {
  return page.evaluate(() => {
    const users = [...document.querySelectorAll("[data-message-author-role='user']")];
    return users.at(-1)?.textContent?.trim() || "";
  });
}

async function waitFor(check, message, timeoutMs = WAIT_MS, throwOnTimeout = true) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      lastError = error;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!throwOnTimeout) return null;
  if (lastError) throw lastError;
  throw new Error(message);
}

function chatFixtureHtml() {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>ChatPulse E2E - ChatGPT</title></head>
<body>
  <main>
    <section id="messages">
      <article data-message-author-role="assistant" data-message-id="assistant-baseline">E2E assistant response complete.</article>
    </section>
    <textarea id="prompt-textarea" aria-label="Message ChatGPT" style="width:500px;height:80px"></textarea>
    <button data-testid="send-button" aria-label="Send" type="button" style="width:100px;height:40px">Send</button>
  </main>
  <script>
    globalThis.__chatPulseE2ESentCount = 0;
    document.querySelector('[data-testid="send-button"]').addEventListener('click', () => {
      const input = document.querySelector('#prompt-textarea');
      const text = input.value.trim();
      if (!text) return;
      const message = document.createElement('article');
      message.setAttribute('data-message-author-role', 'user');
      message.setAttribute('data-message-id', 'user-' + (globalThis.__chatPulseE2ESentCount + 1));
      message.textContent = text;
      document.querySelector('#messages').append(message);
      globalThis.__chatPulseE2ESentCount += 1;
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  <\/script>
</body>
</html>`;
}

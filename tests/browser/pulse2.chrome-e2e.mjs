import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";

const EXTENSION_PATH = path.resolve("chrome-extension");
const CHAT_URL = "https://chatgpt.com/c/pulse2-browser-e2e-initial";
const PROJECT_URL = "https://chatgpt.com/g/g-p-pulse2-browser-e2e/project";
const CREATED_CHAT_URL = "https://chatgpt.com/c/pulse2-browser-e2e-created";
const AUTO_COMMAND = "PULSE2_BROWSER_E2E_CONTINUE";
const START_MESSAGE = "PULSE2_BROWSER_E2E_START";
const WAIT_MS = 30_000;

const userDataDir = await mkdtemp(path.join(os.tmpdir(), "chatpulse-pulse2-browser-e2e-"));
let context = null;

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: "chromium",
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const serviceWorker = await extensionServiceWorker(context);
  const extensionId = new URL(serviceWorker.url()).host;

  await context.route("https://chatgpt.com/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: url.pathname.includes("g-p-pulse2-browser-e2e")
        ? projectFixtureHtml()
        : chatFixtureHtml()
    });
  });

  const pulse2Page = await context.newPage();
  await pulse2Page.goto(`chrome-extension://${extensionId}/pulse2/pulse2.html`, {
    waitUntil: "domcontentloaded"
  });

  const pulse1Before = await getPulse1State(pulse2Page);
  assert.equal(pulse1Before?.enabled, false, "Pulse 1.0 must begin stopped in isolated Pulse 2.0 E2E");

  await pulse2Page.locator("#chatUrlField").fill(CHAT_URL);
  await pulse2Page.locator("#projectUrlField").fill(PROJECT_URL);
  await pulse2Page.locator("#commandField").fill(AUTO_COMMAND);
  await pulse2Page.locator("#startMessageField").fill(START_MESSAGE);
  await pulse2Page.locator("#intervalField").selectOption("0.5");
  await pulse2Page.locator("#messagesPerCycleField").fill("1");
  await pulse2Page.locator("#maxCyclesField").fill("2");
  await pulse2Page.locator("#saveButton").click();

  await waitFor(async () => {
    const state = await getPulse2State(pulse2Page);
    return state.currentChatUrl === CHAT_URL
      && state.projectUrl === PROJECT_URL
      && state.messagesPerCycle === 1
      && state.maxCycles === 2
      ? state
      : null;
  }, "Pulse 2.0 settings were not saved through the isolated UI");

  await pulse2Page.locator("#toggleButton").click();

  await waitFor(async () => {
    const state = await getPulse2State(pulse2Page);
    return state?.enabled && Number.isInteger(state.tabId) ? state : null;
  }, "Pulse 2.0 did not create its autonomous managed tab");

  const initialChatPage = await waitForManagedChatGPTPage(context);
  await initialChatPage.route(PROJECT_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: projectFixtureHtml()
    });
  });
  await initialChatPage.goto(CHAT_URL, { waitUntil: "domcontentloaded" });
  await waitFor(
    async () => await initialChatPage.locator("[data-testid='profile-button']").count() === 1,
    "authenticated ChatGPT fixture was not installed in the managed tab"
  );

  await pulse2Page.locator("#checkButton").click();
  const baseline = await waitFor(async () => {
    const state = await getPulse2State(pulse2Page);
    if (state.lastError) throw new Error(`Pulse 2.0 baseline failed: ${state.lastError}`);
    return state.enabled && state.phase === "monitoring" && state.lastObservedFingerprint
      ? state
      : null;
  }, "Pulse 2.0 did not establish the initial assistant baseline");
  assert.equal(baseline.cycleNumber, 1);
  assert.equal(baseline.cycleContinuationCount, 0);

  await agePulse2Observation(pulse2Page);
  await pulse2Page.locator("#checkButton").click();

  const firstDispatch = await waitFor(async () => {
    const state = await getPulse2State(pulse2Page);
    if (state.lastError) throw new Error(`Pulse 2.0 first dispatch failed: ${state.lastError}`);
    return state.cycleContinuationCount === 1 && state.rotationPending === true
      ? state
      : null;
  }, "Pulse 2.0 did not record the configured N=1 auto-response");
  assert.equal(firstDispatch.totalContinuationCount, 1);
  assert.equal(await latestUserMessage(initialChatPage), AUTO_COMMAND, "Pulse 2.0 auto-response text mismatch");

  await appendAssistantMessage(initialChatPage, "assistant-after-auto-response", "Final response before rotation.");
  await pulse2Page.locator("#checkButton").click();
  await waitFor(async () => {
    const state = await getPulse2State(pulse2Page);
    return state.lastObservedFingerprint !== firstDispatch.lastObservedFingerprint ? state : null;
  }, "Pulse 2.0 did not observe the final assistant response before rotation");

  await agePulse2Observation(pulse2Page);
  await pulse2Page.locator("#checkButton").click();

  const captureWait = await waitFor(async () => {
    const state = await getPulse2State(pulse2Page);
    if (state.lastError) throw new Error(`Pulse 2.0 rotation failed: ${state.lastError}`);
    return state.phase === "capture-wait" && state.captureDueAt ? state : null;
  }, "Pulse 2.0 did not create the next project chat and enter capture wait");
  assert.equal(captureWait.completedCycles, 1);
  assert.ok(
    Date.parse(captureWait.captureDueAt) - Date.parse(captureWait.rotationStartedAt) >= 119_000,
    "Pulse 2.0 did not enforce the approximately two-minute URL capture delay"
  );

  const projectTab = await waitFor(async () => {
    const pages = context.pages();
    return pages.find((page) => page.url() === CREATED_CHAT_URL) || null;
  }, "project fixture never transitioned to the newly created persistent chat URL");
  assert.equal(await latestUserMessage(projectTab), START_MESSAGE, "new project chat start message mismatch");
  assert.equal(await projectNewChatClickCount(projectTab), 1, "Pulse 2.0 did not use the project New chat action exactly once");

  await expireCaptureDelayAndTrigger(serviceWorker);

  const captured = await waitFor(async () => {
    const state = await getPulse2State(pulse2Page);
    if (state.lastError) throw new Error(`Pulse 2.0 URL capture failed: ${state.lastError}`);
    return state.phase === "monitoring" && state.cycleNumber === 2
      && state.currentChatUrl === CREATED_CHAT_URL
      ? state
      : null;
  }, "Pulse 2.0 did not capture and adopt the new /c/... URL");

  assert.equal(captured.cycleContinuationCount, 0, "new cycle continuation counter was not reset");
  assert.equal(captured.history.length, 2, "rotation history does not contain both cycles");
  assert.equal(captured.history.at(-1).url, CREATED_CHAT_URL);
  assert.equal(captured.history.at(-1).source, "project");

  const pulse1After = await getPulse1State(pulse2Page);
  assert.equal(pulse1After.enabled, pulse1Before.enabled, "Pulse 2.0 mutated Pulse 1.0 enabled state");
  assert.deepEqual(pulse1After.chats, pulse1Before.chats, "Pulse 2.0 mutated Pulse 1.0 chat list/runtime");

  console.log(`pulse2_browser_e2e_extension_id=${extensionId}`);
  console.log(`pulse2_browser_e2e_initial_chat=${CHAT_URL}`);
  console.log(`pulse2_browser_e2e_created_chat=${CREATED_CHAT_URL}`);
  console.log("pulse2_browser_e2e_isolation=PASS");
  console.log("pulse2_browser_e2e_rotation=PASS");
  console.log("pulse2_browser_e2e_result=PASS");
} finally {
  if (context) await context.close().catch(() => {});
  await rm(userDataDir, { recursive: true, force: true });
}

async function extensionServiceWorker(browserContext) {
  const existing = browserContext.serviceWorkers()[0];
  if (existing) return existing;
  return browserContext.waitForEvent("serviceworker", { timeout: WAIT_MS });
}

async function getPulse2State(extensionPage) {
  return extensionPage.evaluate(async () => {
    const stored = await chrome.storage.local.get("chatpulse2State");
    return stored.chatpulse2State || null;
  });
}

async function getPulse1State(extensionPage) {
  return extensionPage.evaluate(async () => {
    const stored = await chrome.storage.local.get("chatpulseState");
    return stored.chatpulseState || { enabled: false, chats: [] };
  });
}

async function agePulse2Observation(extensionPage) {
  await extensionPage.evaluate(async () => {
    const stored = await chrome.storage.local.get("chatpulse2State");
    const state = stored.chatpulse2State;
    if (!state?.enabled || !state.lastObservedFingerprint) throw new Error("Pulse 2.0 observation baseline missing");
    state.lastObservedAt = new Date(Date.now() - 2 * 60_000).toISOString();
    state.nextCheckAt = new Date(Date.now() - 1_000).toISOString();
    await chrome.storage.local.set({ chatpulse2State: state });
  });
}

async function expireCaptureDelayAndTrigger(serviceWorker) {
  await serviceWorker.evaluate(async () => {
    const stored = await chrome.storage.local.get("chatpulse2State");
    const state = stored.chatpulse2State;
    if (state?.phase !== "capture-wait") throw new Error("Pulse 2.0 is not waiting to capture a new URL");
    state.captureDueAt = new Date(Date.now() - 1_000).toISOString();
    await chrome.storage.local.set({ chatpulse2State: state });
    await chrome.alarms.create("chatpulse-pulse2-capture", { when: Date.now() + 100 });
  });
}

async function appendAssistantMessage(page, id, text) {
  await page.evaluate(({ id, text }) => {
    const message = document.createElement("article");
    message.setAttribute("data-message-author-role", "assistant");
    message.setAttribute("data-message-id", id);
    message.textContent = text;
    document.querySelector("#messages").append(message);
  }, { id, text });
}

async function latestUserMessage(page) {
  return page.evaluate(() => {
    const users = [...document.querySelectorAll("[data-message-author-role='user']")];
    return users.at(-1)?.textContent?.trim() || "";
  });
}

async function projectNewChatClickCount(page) {
  return page.evaluate(() => Number(globalThis.__pulse2ProjectNewChatClicks || 0));
}

async function waitForManagedChatGPTPage(context) {
  return waitFor(async () => context.pages().find((page) => {
    try {
      return new URL(page.url()).hostname === "chatgpt.com";
    } catch {
      return false;
    }
  }) || null, "Pulse 2.0 managed ChatGPT page was not exposed to Playwright");
}

async function waitFor(check, message, timeoutMs = WAIT_MS) {
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
  if (lastError) throw lastError;
  throw new Error(message);
}

function chatFixtureHtml() {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Pulse 2.0 E2E - ChatGPT</title></head>
<body>
  <button data-testid="profile-button" type="button" style="width:40px;height:40px">Profile</button>
  <main>
    <section id="messages">
      <article data-message-author-role="assistant" data-message-id="assistant-baseline">Initial assistant response complete.</article>
    </section>
    <textarea id="prompt-textarea" aria-label="Message ChatGPT" style="width:500px;height:80px"></textarea>
    <button data-testid="send-button" aria-label="Send" type="button" style="width:100px;height:40px">Send</button>
  </main>
  <script>
    document.querySelector('[data-testid="send-button"]').addEventListener('click', () => {
      const input = document.querySelector('#prompt-textarea');
      const text = input.value.trim();
      if (!text) return;
      const message = document.createElement('article');
      message.setAttribute('data-message-author-role', 'user');
      message.setAttribute('data-message-id', 'user-' + Date.now());
      message.textContent = text;
      document.querySelector('#messages').append(message);
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  <\/script>
</body>
</html>`;
}

function projectFixtureHtml() {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Pulse 2.0 Project E2E - ChatGPT</title></head>
<body>
  <button data-testid="profile-button" type="button" style="width:40px;height:40px">Profile</button>
  <main>
    <h1>Project E2E</h1>
    <button id="new-chat" aria-label="New chat" type="button" style="width:120px;height:40px">New chat</button>
    <section id="composer-host"></section>
    <section id="messages"></section>
  </main>
  <script>
    globalThis.__pulse2ProjectNewChatClicks = 0;
    document.querySelector('#new-chat').addEventListener('click', () => {
      globalThis.__pulse2ProjectNewChatClicks += 1;
      document.querySelector('#composer-host').innerHTML = [
        '<textarea id="prompt-textarea" aria-label="Message ChatGPT" style="width:500px;height:80px"></textarea>',
        '<button data-testid="send-button" aria-label="Send" type="button" style="width:100px;height:40px">Send</button>'
      ].join('');
      document.querySelector('[data-testid="send-button"]').addEventListener('click', () => {
        const input = document.querySelector('#prompt-textarea');
        const text = input.value.trim();
        if (!text) return;
        const message = document.createElement('article');
        message.setAttribute('data-message-author-role', 'user');
        message.setAttribute('data-message-id', 'project-user-' + Date.now());
        message.textContent = text;
        document.querySelector('#messages').append(message);
        history.replaceState({}, '', '${CREATED_CHAT_URL}');
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  <\/script>
</body>
</html>`;
}

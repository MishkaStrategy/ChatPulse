import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";

const EXTENSION_PATH = path.resolve("chrome-extension");
const CHAT_URL = "https://chatgpt.com/c/pulse2-browser-e2e-initial";
const PROJECT_URL = "https://chatgpt.com/g/g-p-pulse2-browser-e2e/project";
const PROJECT_URL_2 = "https://chatgpt.com/g/g-p-pulse2-browser-e2e-two/project";
const CREATED_CHAT_URL = "https://chatgpt.com/c/pulse2-browser-e2e-created";
const AUTO_COMMAND = "PULSE2_BROWSER_E2E_CONTINUE";
const START_MESSAGE = "PULSE2_BROWSER_E2E_START";
const UNSAVED_DRAFT = "UNSAVED_DRAFT_MUST_SURVIVE_STATE_PUSH";
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
      body: url.pathname.includes("g-p-pulse2-browser-e2e") ? projectFixtureHtml() : chatFixtureHtml()
    });
  });

  const pulse2Page = await context.newPage();
  await pulse2Page.goto(`chrome-extension://${extensionId}/pulse2/pulse2.html`, { waitUntil: "domcontentloaded" });

  const pulse1Before = await getPulse1State(pulse2Page);
  assert.equal(pulse1Before?.enabled, false, "Pulse 1.0 must begin stopped in isolated Pulse 2.0 E2E");

  // Regression #1: a live state push must never overwrite unsaved text being edited.
  await pulse2Page.locator("#commandField").fill(UNSAVED_DRAFT);
  await sendBackgroundSettingsPatch(pulse2Page, { intervalMinutes: 10 });
  await pulse2Page.waitForTimeout(250);
  assert.equal(
    await pulse2Page.locator("#commandField").inputValue(),
    UNSAVED_DRAFT,
    "live state push overwrote the unsaved Pulse 2.0 form draft"
  );
  assert.equal(await pulse2Page.locator("#dirtyHint").isVisible(), true, "dirty draft indicator is not visible");

  // Regression #2 + #3: empty current chat is valid and more than one project can be persisted.
  await pulse2Page.locator("#routeNameField").fill("Primary project");
  await pulse2Page.locator("#chatUrlField").fill("");
  await pulse2Page.locator("#projectUrlField").fill(PROJECT_URL);
  await pulse2Page.locator("#commandField").fill(AUTO_COMMAND);
  await pulse2Page.locator("#startMessageField").fill(START_MESSAGE);
  await pulse2Page.locator("#intervalField").selectOption("0.5");
  await pulse2Page.locator("#messagesPerCycleField").fill("1");
  await pulse2Page.locator("#maxCyclesField").fill("2");
  await pulse2Page.locator("#addRouteButton").click();
  await pulse2Page.locator("#routeNameField").fill("Second project");
  await pulse2Page.locator("#projectUrlField").fill(PROJECT_URL_2);
  await pulse2Page.locator("#chatUrlField").fill("");
  await pulse2Page.locator("#saveButton").click();

  const multiRouteSaved = await waitFor(async () => {
    const saved = await getPulse2State(pulse2Page);
    return saved?.routes?.length === 2
      && saved.routes.every((route) => route.currentChatUrl === "")
      && saved.routes.some((route) => route.projectUrl === PROJECT_URL)
      && saved.routes.some((route) => route.projectUrl === PROJECT_URL_2)
      ? saved
      : null;
  }, "Pulse 2.0 did not save two routes with optional empty current chats");
  assert.equal(multiRouteSaved.enabled, false);

  // Keep the retained full rotation scenario deterministic with one existing chat.
  const firstTab = pulse2Page.locator(".route-tab").first();
  await firstTab.click();
  await pulse2Page.locator("#chatUrlField").fill(CHAT_URL);
  const secondTab = pulse2Page.locator(".route-tab").nth(1);
  await secondTab.click();
  await pulse2Page.locator("#removeRouteButton").click();
  await pulse2Page.locator("#saveButton").click();

  const singleSaved = await waitFor(async () => {
    const saved = await getPulse2State(pulse2Page);
    return saved?.routes?.length === 1 && saved.routes[0].currentChatUrl === CHAT_URL ? saved : null;
  }, "Pulse 2.0 retained route was not saved for full rotation E2E");
  const routeId = singleSaved.routes[0].id;

  await pulse2Page.locator("#toggleButton").click();
  await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    return running?.enabled && Number.isInteger(route?.tabId) ? running : null;
  }, "Pulse 2.0 did not create its autonomous managed tab");

  const initialChatPage = await waitForManagedChatGPTPage(context);
  await initialChatPage.route(PROJECT_URL, async (route) => {
    await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: projectFixtureHtml() });
  });
  await initialChatPage.goto(CHAT_URL, { waitUntil: "domcontentloaded" });
  await waitFor(
    async () => await initialChatPage.locator("[data-testid='profile-button']").count() === 1,
    "authenticated ChatGPT fixture was not installed in the managed tab"
  );

  await pulse2Page.locator("#checkButton").click();
  const baseline = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    if (route?.lastError) throw new Error(`Pulse 2.0 baseline failed: ${route.lastError}`);
    return running?.enabled && route?.phase === "monitoring" && route.lastObservedFingerprint ? route : null;
  }, "Pulse 2.0 did not establish the initial assistant baseline");
  assert.equal(baseline.cycleNumber, 1);
  assert.equal(baseline.cycleContinuationCount, 0);

  await agePulse2Observation(pulse2Page, routeId);
  await pulse2Page.locator("#checkButton").click();
  const firstDispatch = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    if (route?.lastError) throw new Error(`Pulse 2.0 first dispatch failed: ${route.lastError}`);
    return route?.cycleContinuationCount === 1 && route.rotationPending === true ? route : null;
  }, "Pulse 2.0 did not record the configured N=1 auto-response");
  assert.equal(firstDispatch.totalContinuationCount, 1);
  assert.equal(await latestUserMessage(initialChatPage), AUTO_COMMAND, "Pulse 2.0 auto-response text mismatch");

  await appendAssistantMessage(initialChatPage, "assistant-after-auto-response", "Final response before rotation.");
  await pulse2Page.locator("#checkButton").click();
  await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    return route?.lastObservedFingerprint !== firstDispatch.lastObservedFingerprint ? route : null;
  }, "Pulse 2.0 did not observe the final assistant response before rotation");

  await agePulse2Observation(pulse2Page, routeId);
  await pulse2Page.locator("#checkButton").click();
  const captureWait = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    if (route?.lastError) throw new Error(`Pulse 2.0 rotation failed: ${route.lastError}`);
    return route?.phase === "capture-wait" && route.captureDueAt ? route : null;
  }, "Pulse 2.0 did not create the next project chat and enter capture wait");
  assert.equal(captureWait.completedCycles, 1);
  assert.ok(Date.parse(captureWait.captureDueAt) - Date.parse(captureWait.rotationStartedAt) >= 119_000);

  const projectTab = await waitFor(async () => context.pages().find((page) => page.url() === CREATED_CHAT_URL) || null,
    "project fixture never transitioned to the newly created persistent chat URL");
  assert.equal(await latestUserMessage(projectTab), START_MESSAGE, "new project chat start message mismatch");
  assert.equal(await projectComposerActivationCount(projectTab), 1, "Pulse 2.0 did not activate the direct project composer exactly once");
  assert.equal(await projectTab.locator("#new-chat").count(), 0, "screenshot-like project fixture must not expose a legacy New chat button");

  await expireCaptureDelayAndTrigger(serviceWorker, routeId);
  const captured = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    if (route?.lastError) throw new Error(`Pulse 2.0 URL capture failed: ${route.lastError}`);
    return route?.phase === "monitoring" && route.cycleNumber === 2 && route.currentChatUrl === CREATED_CHAT_URL ? route : null;
  }, "Pulse 2.0 did not capture and adopt the new /c/... URL");
  assert.equal(captured.cycleContinuationCount, 0);
  assert.equal(captured.history.length, 2);
  assert.equal(captured.history.at(-1).source, "project");

  const pulse1After = await getPulse1State(pulse2Page);
  assert.equal(pulse1After.enabled, pulse1Before.enabled, "Pulse 2.0 mutated Pulse 1.0 enabled state");
  assert.deepEqual(pulse1After.chats, pulse1Before.chats, "Pulse 2.0 mutated Pulse 1.0 chat list/runtime");

  console.log(`pulse2_browser_e2e_extension_id=${extensionId}`);
  console.log("pulse2_browser_e2e_form_draft=PASS");
  console.log("pulse2_browser_e2e_optional_chat_save=PASS");
  console.log("pulse2_browser_e2e_multi_route_save=PASS");
  console.log("pulse2_browser_e2e_rotation=PASS");
  console.log("pulse2_browser_e2e_isolation=PASS");
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
  return extensionPage.evaluate(async () => (await chrome.storage.local.get("chatpulse2State")).chatpulse2State || null);
}

async function getPulse1State(extensionPage) {
  return extensionPage.evaluate(async () => (await chrome.storage.local.get("chatpulseState")).chatpulseState || { enabled: false, chats: [] });
}

async function sendBackgroundSettingsPatch(extensionPage, patch) {
  await extensionPage.evaluate(async (patchValue) => new Promise((resolve, reject) => {
    const port = chrome.runtime.connect({ name: "chatpulse-pulse2" });
    const requestId = `e2e-${Date.now()}`;
    const timeout = setTimeout(() => { port.disconnect(); reject(new Error("background patch timeout")); }, 5000);
    port.onMessage.addListener((message) => {
      if (message?.kind !== "response" || message.requestId !== requestId) return;
      clearTimeout(timeout);
      port.disconnect();
      message.ok ? resolve() : reject(new Error(message.error || "background patch failed"));
    });
    port.postMessage({ requestId, type: "UPDATE_SETTINGS", patch: patchValue });
  }), patch);
}

async function agePulse2Observation(extensionPage, routeId) {
  await extensionPage.evaluate(async (id) => {
    const stored = await chrome.storage.local.get("chatpulse2State");
    const state = stored.chatpulse2State;
    const route = state.routes.find((item) => item.id === id);
    if (!route?.lastObservedFingerprint) throw new Error("Pulse 2.0 observation baseline missing");
    route.lastObservedAt = new Date(Date.now() - 2 * 60_000).toISOString();
    route.nextCheckAt = new Date(Date.now() - 1_000).toISOString();
    await chrome.storage.local.set({ chatpulse2State: state });
  }, routeId);
}

async function expireCaptureDelayAndTrigger(serviceWorker, routeId) {
  await serviceWorker.evaluate(async (id) => {
    const stored = await chrome.storage.local.get("chatpulse2State");
    const state = stored.chatpulse2State;
    const route = state.routes.find((item) => item.id === id);
    if (route?.phase !== "capture-wait") throw new Error("Pulse 2.0 route is not waiting to capture a new URL");
    route.captureDueAt = new Date(Date.now() - 1_000).toISOString();
    await chrome.storage.local.set({ chatpulse2State: state });
    await chrome.alarms.create("chatpulse-pulse2-capture", { when: Date.now() + 100 });
  }, routeId);
}

async function appendAssistantMessage(page, id, text) {
  await page.evaluate(({ messageId, messageText }) => {
    const message = document.createElement("article");
    message.setAttribute("data-message-author-role", "assistant");
    message.setAttribute("data-message-id", messageId);
    message.textContent = messageText;
    document.querySelector("#messages").append(message);
  }, { messageId: id, messageText: text });
}

async function latestUserMessage(page) {
  return page.evaluate(() => [...document.querySelectorAll("[data-message-author-role='user']")].at(-1)?.textContent?.trim() || "");
}

async function projectComposerActivationCount(page) {
  return page.evaluate(() => Number(globalThis.__pulse2ProjectComposerActivations || 0));
}

async function waitForManagedChatGPTPage(browserContext) {
  return waitFor(async () => browserContext.pages().find((page) => {
    try { return new URL(page.url()).hostname === "chatgpt.com"; } catch { return false; }
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
  return `<!doctype html><html><head><meta charset="utf-8"><title>Pulse 2.0 E2E</title></head><body>
  <button data-testid="profile-button" type="button" style="width:40px;height:40px">Profile</button>
  <main><section id="messages"><article data-message-author-role="assistant" data-message-id="assistant-baseline">Initial assistant response complete.</article></section>
  <textarea id="prompt-textarea" aria-label="Message ChatGPT" style="width:500px;height:80px"></textarea>
  <button data-testid="send-button" aria-label="Send" type="button" style="width:100px;height:40px">Send</button></main>
  <script>document.querySelector('[data-testid="send-button"]').addEventListener('click',()=>{const input=document.querySelector('#prompt-textarea');const text=input.value.trim();if(!text)return;const m=document.createElement('article');m.setAttribute('data-message-author-role','user');m.setAttribute('data-message-id','user-'+Date.now());m.textContent=text;document.querySelector('#messages').append(m);input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));});<\/script>
  </body></html>`;
}

function projectFixtureHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Pulse 2.0 Project E2E</title></head><body>
  <button data-testid="profile-button" type="button" style="width:40px;height:40px">Profile</button>
  <main>
    <h1>Модульная Стратегия</h1>
    <div id="project-composer-shell" data-placeholder="Новый чат в Модульная Стратегия" style="width:760px;height:76px;border:1px solid #444;border-radius:24px;display:flex;align-items:center;padding:0 24px;cursor:text">
      <span>Новый чат в Модульная Стратегия</span>
    </div>
    <section id="composer-host"></section>
    <section id="messages"></section>
  </main>
  <script>
  globalThis.__pulse2ProjectComposerActivations=0;
  document.querySelector('#project-composer-shell').addEventListener('click',()=>{
    globalThis.__pulse2ProjectComposerActivations+=1;
    document.querySelector('#project-composer-shell').remove();
    document.querySelector('#composer-host').innerHTML='<textarea id="prompt-textarea" aria-label="Message ChatGPT" style="width:500px;height:80px"></textarea><button data-testid="send-button" aria-label="Send" type="button" style="width:100px;height:40px">Send</button>';
    document.querySelector('[data-testid="send-button"]').addEventListener('click',()=>{
      const input=document.querySelector('#prompt-textarea');
      const text=input.value.trim();
      if(!text)return;
      const m=document.createElement('article');
      m.setAttribute('data-message-author-role','user');
      m.setAttribute('data-message-id','project-user-'+Date.now());
      m.textContent=text;
      document.querySelector('#messages').append(m);
      history.replaceState({},'','${CREATED_CHAT_URL}');
      input.value='';
      input.dispatchEvent(new Event('input',{bubbles:true}));
    });
  });
  <\/script>
  </body></html>`;
}

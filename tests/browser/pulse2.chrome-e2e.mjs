import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";

const EXTENSION_PATH = path.resolve("chrome-extension");
const CHAT_URL = "https://chatgpt.com/c/pulse2-browser-e2e-initial";
const PROJECT_URL = "https://chatgpt.com/g/g-p-pulse2-browser-e2e/project";
const PROJECT_URL_2 = "https://chatgpt.com/g/g-p-pulse2-browser-e2e-two/project";
const CREATED_CHAT_URL = "https://chatgpt.com/g/g-p-pulse2-browser-e2e/c/pulse2-browser-e2e-created";
const UNRELATED_CHAT_URL = "https://chatgpt.com/c/pulse2-browser-e2e-unrelated";
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

  // Regression #4: recover a persisted "rotating" route even if the immediate post-START work was lost.
  const firstTab = pulse2Page.locator(".route-tab").first();
  await firstTab.click();
  const secondTab = pulse2Page.locator(".route-tab").nth(1);
  await secondTab.click();
  await pulse2Page.locator("#removeRouteButton").click();
  await pulse2Page.locator("#saveButton").click();

  const blankSingleSaved = await waitFor(async () => {
    const saved = await getPulse2State(pulse2Page);
    return saved?.routes?.length === 1 && saved.routes[0].currentChatUrl === "" ? saved : null;
  }, "Pulse 2.0 blank single route was not saved for rotation recovery E2E");
  const routeId = blankSingleSaved.routes[0].id;

  const recoveryProjectPage = await context.newPage();
  await recoveryProjectPage.goto(UNRELATED_CHAT_URL, { waitUntil: "domcontentloaded" });
  await waitFor(
    async () => await recoveryProjectPage.locator("[data-testid='profile-button']").count() === 1,
    "controlled unrelated-chat fixture was not installed before recovery"
  );
  const recoveryTabId = await tabIdForUrl(pulse2Page, UNRELATED_CHAT_URL);
  assert.ok(Number.isInteger(recoveryTabId), "controlled project fixture has no Chrome tab id");

  await pulse2Page.bringToFront();
  assert.notEqual(
    await activeTabId(pulse2Page),
    recoveryTabId,
    "recovery project tab must begin in the background for the foreground-activation regression"
  );

  await seedPersistedRotationAndTriggerRecovery(pulse2Page, routeId, recoveryTabId);
  const recoveredCaptureWait = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    if (route?.lastError) throw new Error(`Pulse 2.0 recovery rotation failed: ${route.lastError}`);
    return running?.enabled
      && route?.phase === "capture-wait"
      && route.captureDueAt
      && route.lastCheckAt
      ? route
      : null;
  }, "Pulse 2.0 rotation recovery alarm did not advance the persisted rotating route");

  const recoveredProjectTab = await waitFor(async () =>
    context.pages().find((page) => page.url() === CREATED_CHAT_URL) || null,
  "rotation recovery never transitioned the screenshot-style project to a persistent chat URL");
  assert.equal(await latestUserMessage(recoveredProjectTab), START_MESSAGE, "recovered first project chat start message mismatch");
  assert.equal(await projectComposerActivationCount(recoveredProjectTab), 1, "recovery did not activate the direct project composer exactly once");
  assert.equal(await recoveredProjectTab.locator("#new-chat").count(), 0, "recovery fixture must not expose a legacy New chat button");
  assert.equal(
    await activeTabId(pulse2Page),
    recoveredCaptureWait.tabId,
    "rotation recovery must foreground the managed Project tab before composer lookup"
  );
  assert.ok(Date.parse(recoveredCaptureWait.captureDueAt) - Date.parse(recoveredCaptureWait.lastCheckAt) >= 119_000);

  const recoveryPulseUiTabId = await tabIdForUrl(pulse2Page, pulse2Page.url());
  assert.ok(Number.isInteger(recoveryPulseUiTabId), "Pulse 2.0 UI tab id missing before recovery capture");
  await pulse2Page.bringToFront();
  await expireCaptureDelayAndTrigger(serviceWorker, routeId);
  const recoveredInitialChat = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    if (route?.lastError) throw new Error(`Pulse 2.0 recovered URL capture failed: ${route.lastError}`);
    return route?.phase === "monitoring"
      && route.cycleNumber === 1
      && route.currentChatUrl === CREATED_CHAT_URL
      ? route
      : null;
  }, "Pulse 2.0 did not adopt the recovered first project chat as cycle 1");
  assert.equal(recoveredInitialChat.history.length, 1);
  assert.equal(recoveredInitialChat.history[0].source, "project-initial");
  assert.equal(
    recoveredInitialChat.lastPageVisibility,
    "visible",
    "recovery URL capture inspected the new chat while it was still backgrounded"
  );
  await waitFor(
    async () => await activeTabId(pulse2Page) === recoveryPulseUiTabId,
    "recovery URL capture did not restore the previous Pulse 2.0 UI tab"
  );

  await sendPulse2Request(pulse2Page, "STOP");
  await waitFor(async () => (await getPulse2State(pulse2Page))?.enabled === false, "Pulse 2.0 did not stop after recovery regression");

  // Keep the retained full rotation scenario deterministic with one existing chat.
  await firstTab.click();
  await pulse2Page.locator("#chatUrlField").fill(CHAT_URL);
  await pulse2Page.locator("#saveButton").click();

  const singleSaved = await waitFor(async () => {
    const saved = await getPulse2State(pulse2Page);
    return saved?.routes?.length === 1 && saved.routes[0].currentChatUrl === CHAT_URL ? saved : null;
  }, "Pulse 2.0 retained route was not saved for full rotation E2E");

  await pulse2Page.locator("#toggleButton").click();
  const retainedRunning = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    return running?.enabled && Number.isInteger(route?.tabId) ? running : null;
  }, "Pulse 2.0 did not create its autonomous managed tab");

  const retainedTabId = retainedRunning.routes.find((item) => item.id === routeId).tabId;
  const retainedFixtureUrl = `${CHAT_URL}?fixture=retained`;
  await navigateManagedTab(pulse2Page, retainedTabId, retainedFixtureUrl);
  const initialChatPage = await waitFor(
    async () => context.pages().find((page) => page.url() === retainedFixtureUrl) || null,
    "route-owned managed tab did not navigate to the retained authenticated fixture"
  );
  await initialChatPage.route(PROJECT_URL, async (route) => {
    await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: projectFixtureHtml() });
  });
  await waitFor(
    async () => await initialChatPage.locator("[data-testid='profile-button']").count() === 1,
    "authenticated ChatGPT fixture was not installed in the route-owned managed tab"
  );

  const pulse2TabId = await tabIdForUrl(pulse2Page, pulse2Page.url());
  assert.ok(Number.isInteger(pulse2TabId), "Pulse 2.0 UI tab id missing");

  await sendPulse2Request(pulse2Page, "CHECK_NOW", { routeId });
  const baseline = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    if (route?.lastError) throw new Error(`Pulse 2.0 baseline failed: ${route.lastError}`);
    return running?.enabled && route?.phase === "monitoring" && route.lastObservedFingerprint ? route : null;
  }, "Pulse 2.0 did not establish the initial assistant baseline");
  assert.equal(baseline.cycleNumber, 1);
  assert.equal(baseline.cycleContinuationCount, 0);

  // Prepare a separately rendered copy of the same current chat. If the managed
  // tab disappears, Pulse should adopt this exact unclaimed tab instead of
  // opening another duplicate.
  const recoverySparePage = await context.newPage();
  await recoverySparePage.goto(CHAT_URL, { waitUntil: "domcontentloaded" });
  await waitFor(
    async () => await recoverySparePage.locator("[data-testid='profile-button']").count() === 1,
    "controlled spare current-chat fixture was not rendered"
  );
  await recoverySparePage.route(PROJECT_URL, async (route) => {
    await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: projectFixtureHtml() });
  });
  const recoverySpareTabId = await tabIdForUrl(pulse2Page, CHAT_URL);
  assert.ok(Number.isInteger(recoverySpareTabId), "spare current-chat tab id missing");

  // Adversarial regression: closing the managed chat must not kill the route.
  await initialChatPage.close();
  await pulse2Page.bringToFront();
  await agePulse2Observation(pulse2Page, routeId);
  await triggerMonitorAlarm(serviceWorker);
  const firstDispatch = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    if (route?.lastError) throw new Error(`Pulse 2.0 first dispatch failed: ${route.lastError}`);
    return route?.cycleContinuationCount === 1 && route.rotationPending === true ? route : null;
  }, "Pulse 2.0 did not record the configured N=1 auto-response");
  assert.equal(firstDispatch.totalContinuationCount, 1);
  assert.notEqual(firstDispatch.tabId, retainedTabId, "closed managed chat tab id was not replaced");
  assert.equal(
    firstDispatch.tabId,
    recoverySpareTabId,
    "Pulse 2.0 did not adopt the existing unclaimed copy of the lost current chat"
  );
  const recoveredMonitoringPage = recoverySparePage;
  assert.equal(await latestUserMessage(recoveredMonitoringPage), AUTO_COMMAND, "Pulse 2.0 auto-response text mismatch after managed-tab recovery");
  assert.equal(
    firstDispatch.lastPageVisibility,
    "visible",
    "alarm-driven monitoring inspected the managed chat while it was still backgrounded"
  );
  await waitFor(
    async () => await activeTabId(pulse2Page) === pulse2TabId,
    "alarm-driven monitoring did not restore the user's previous Pulse 2.0 tab"
  );

  await appendAssistantMessage(recoveredMonitoringPage, "assistant-after-auto-response", "Final response before rotation.");
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
  await waitFor(
    async () => await pulse2Page.locator("#openCurrentButton").isDisabled(),
    "Open Current Chat must be disabled while the route is waiting to capture a new chat URL"
  );
  await assert.rejects(
    () => sendPulse2Request(pulse2Page, "OPEN_CURRENT_CHAT", { routeId }),
    /Дождитесь завершения создания нового чата/,
    "background engine allowed Open Current Chat to replace the managed rotation tab"
  );

  const projectTab = await waitFor(async () => context.pages().find((page) => page.url() === CREATED_CHAT_URL) || null,
    "project fixture never transitioned to the newly created persistent chat URL");
  assert.equal(await latestUserMessage(projectTab), START_MESSAGE, "new project chat start message mismatch");
  assert.equal(await projectComposerActivationCount(projectTab), 1, "Pulse 2.0 did not activate the direct project composer exactly once");
  assert.equal(await projectTab.locator("#new-chat").count(), 0, "screenshot-like project fixture must not expose a legacy New chat button");
  assert.equal(
    await activeTabId(pulse2Page),
    captureWait.tabId,
    "ordinary rotation must foreground the managed Project tab before composer lookup"
  );

  // Adversarial regression: capture-wait must never adopt a chat outside the selected project.
  await projectTab.evaluate((url) => history.replaceState({}, "", url), UNRELATED_CHAT_URL);
  await expireCaptureDelayAndTrigger(serviceWorker, routeId);
  const rejectedUnrelatedCapture = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    return route?.phase === "capture-wait"
      && route.captureAttempts === 1
      && route.currentChatUrl === CHAT_URL
      ? route
      : null;
  }, "Pulse 2.0 capture-wait adopted or failed to reject an unrelated ChatGPT chat");
  assert.match(rejectedUnrelatedCapture.lastError || "", /Новая ссылка чата ещё не появилась/);

  await projectTab.evaluate((url) => history.replaceState({}, "", url), CREATED_CHAT_URL);
  await pulse2Page.bringToFront();
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
  assert.equal(
    captured.lastPageVisibility,
    "visible",
    "URL capture inspected the newly created chat while it was still backgrounded"
  );
  await waitFor(
    async () => await activeTabId(pulse2Page) === pulse2TabId,
    "URL capture did not restore the previous Pulse 2.0 UI tab"
  );

  // Adversarial regression: if the user switches tabs during a service check,
  // focus restoration must not steal focus back afterwards.
  await pulse2Page.bringToFront();
  const guardedCheck = sendPulse2Request(pulse2Page, "CHECK_NOW", { routeId });
  await waitFor(
    async () => await activeTabId(pulse2Page) === captured.tabId,
    "manual focus-guard check never foregrounded the managed chat"
  );
  const userChoicePage = await context.newPage();
  await userChoicePage.goto("about:blank");
  await userChoicePage.bringToFront();
  const userChoiceTabId = await tabIdForUrl(pulse2Page, "about:blank");
  assert.ok(Number.isInteger(userChoiceTabId), "manual user-choice tab id missing");
  await guardedCheck;
  assert.equal(
    await activeTabId(pulse2Page),
    userChoiceTabId,
    "Pulse 2.0 stole focus back after the user manually switched tabs"
  );
  await userChoicePage.close();

  // Adversarial regression: Stop -> Start must reuse the same valid managed tab.
  const managedBeforeRestart = (await getPulse2State(pulse2Page)).routes.find((item) => item.id === routeId).tabId;
  const tabsBeforeRestart = await chatgptTabIds(pulse2Page);
  await sendPulse2Request(pulse2Page, "STOP");
  await waitFor(async () => (await getPulse2State(pulse2Page))?.enabled === false, "Pulse 2.0 did not stop before restart-reuse test");
  await sendPulse2Request(pulse2Page, "START");
  const restartedRoute = await waitFor(async () => {
    const running = await getPulse2State(pulse2Page);
    const route = running?.routes?.find((item) => item.id === routeId);
    return running?.enabled && route?.tabId === managedBeforeRestart ? route : null;
  }, "Pulse 2.0 did not reuse the existing managed tab after Stop -> Start");
  assert.equal(restartedRoute.tabId, managedBeforeRestart);
  assert.deepEqual(
    await chatgptTabIds(pulse2Page),
    tabsBeforeRestart,
    "Stop -> Start created a duplicate ChatGPT managed tab"
  );

  await sendPulse2Request(pulse2Page, "STOP");
  await waitFor(async () => (await getPulse2State(pulse2Page))?.enabled === false, "Pulse 2.0 did not stop before Open Current Chat test");
  await pulse2Page.bringToFront();
  await waitFor(async () => !(await pulse2Page.locator("#openCurrentButton").isDisabled()), "Open Current Chat button stayed disabled");
  const tabsBeforeOpenCurrent = await chatgptTabIds(pulse2Page);
  await pulse2Page.locator("#openCurrentButton").click();
  await waitFor(
    async () => await activeTabId(pulse2Page) === managedBeforeRestart,
    "Open Current Chat did not activate the engine-managed tab"
  );
  assert.deepEqual(
    await chatgptTabIds(pulse2Page),
    tabsBeforeOpenCurrent,
    "Open Current Chat created a duplicate tab instead of reusing the managed tab"
  );

  const pulse1After = await getPulse1State(pulse2Page);
  assert.equal(pulse1After.enabled, pulse1Before.enabled, "Pulse 2.0 mutated Pulse 1.0 enabled state");
  assert.deepEqual(pulse1After.chats, pulse1Before.chats, "Pulse 2.0 mutated Pulse 1.0 chat list/runtime");

  console.log(`pulse2_browser_e2e_extension_id=${extensionId}`);
  console.log("pulse2_browser_e2e_form_draft=PASS");
  console.log("pulse2_browser_e2e_optional_chat_save=PASS");
  console.log("pulse2_browser_e2e_multi_route_save=PASS");
  console.log("pulse2_browser_e2e_rotation_recovery=PASS");
  console.log("pulse2_browser_e2e_unrelated_chat_recovery_guard=PASS");
  console.log("pulse2_browser_e2e_project_foreground=PASS");
  console.log("pulse2_browser_e2e_overnight_monitor_alarm=PASS");
  console.log("pulse2_browser_e2e_monitor_focus_restore=PASS");
  console.log("pulse2_browser_e2e_capture_foreground=PASS");
  console.log("pulse2_browser_e2e_capture_focus_restore=PASS");
  console.log("pulse2_browser_e2e_closed_tab_recovery=PASS");
  console.log("pulse2_browser_e2e_lost_tab_adoption=PASS");
  console.log("pulse2_browser_e2e_manual_focus_guard=PASS");
  console.log("pulse2_browser_e2e_restart_tab_reuse=PASS");
  console.log("pulse2_browser_e2e_open_current_rotation_guard=PASS");
  console.log("pulse2_browser_e2e_unrelated_capture_guard=PASS");
  console.log("pulse2_browser_e2e_open_current_reuse=PASS");
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
  await sendPulse2Request(extensionPage, "UPDATE_SETTINGS", { patch });
}

async function sendPulse2Request(extensionPage, type, payload = {}) {
  return extensionPage.evaluate(async ({ requestType, requestPayload }) => new Promise((resolve, reject) => {
    const port = chrome.runtime.connect({ name: "chatpulse-pulse2" });
    const requestId = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const timeout = setTimeout(() => {
      port.disconnect();
      reject(new Error(`background request timeout: ${requestType}`));
    }, 5000);
    port.onMessage.addListener((message) => {
      if (message?.kind !== "response" || message.requestId !== requestId) return;
      clearTimeout(timeout);
      port.disconnect();
      message.ok ? resolve(message) : reject(new Error(message.error || `background request failed: ${requestType}`));
    });
    port.postMessage({ requestId, type: requestType, ...requestPayload });
  }), { requestType: type, requestPayload: payload });
}

async function seedPersistedRotationAndTriggerRecovery(extensionPage, routeId, tabId) {
  await extensionPage.evaluate(async ({ id, managedTabId }) => {
    const stored = await chrome.storage.local.get("chatpulse2State");
    const state = stored.chatpulse2State;
    const route = state.routes.find((item) => item.id === id);
    if (!route) throw new Error("Pulse 2.0 recovery route missing");
    const now = new Date().toISOString();

    state.enabled = true;
    state.phase = "running";
    state.sessionId = `e2e-recovery-${Date.now()}`;
    state.controlRevision = Number(state.controlRevision || 0) + 1;
    state.lastError = null;
    Object.assign(route, {
      currentChatUrl: "",
      phase: "rotating",
      initializingChat: true,
      cycleNumber: 1,
      completedCycles: 0,
      cycleContinuationCount: 0,
      totalContinuationCount: 0,
      rotationPending: false,
      tabId: managedTabId,
      checkInProgress: false,
      lastObservedFingerprint: null,
      lastObservedAt: null,
      lastCommandedFingerprint: null,
      lastCommandAt: null,
      lastDispatchOutcome: null,
      lastCheckAt: null,
      nextCheckAt: null,
      rotationStartedAt: now,
      captureDueAt: null,
      captureAttempts: 0,
      lastCreatedChatAt: null,
      lastError: null,
      stopReason: null,
      history: []
    });

    await chrome.storage.local.set({ chatpulse2State: state });
    await chrome.alarms.create("chatpulse-pulse2-rotation", { when: Date.now() + 100 });
  }, { id: routeId, managedTabId: tabId });
}

async function tabIdForUrl(extensionPage, url) {
  return extensionPage.evaluate(async (targetUrl) => {
    const tabs = await chrome.tabs.query({});
    return tabs.find((tab) => tab.url === targetUrl)?.id ?? null;
  }, url);
}

async function activeTabId(extensionPage) {
  return extensionPage.evaluate(async () => {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tabs[0]?.id ?? null;
  });
}

async function chatgptTabIds(extensionPage) {
  return extensionPage.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    return tabs
      .filter((tab) => {
        try { return new URL(tab.url || "").hostname === "chatgpt.com"; } catch { return false; }
      })
      .map((tab) => tab.id)
      .filter(Number.isInteger)
      .sort((left, right) => left - right);
  });
}

async function navigateManagedTab(extensionPage, tabId, url) {
  await extensionPage.evaluate(async ({ managedTabId, targetUrl }) => {
    await chrome.tabs.update(managedTabId, { url: targetUrl, active: false });
  }, { managedTabId: tabId, targetUrl: url });
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

async function triggerMonitorAlarm(serviceWorker) {
  await serviceWorker.evaluate(async () => {
    await chrome.alarms.create("chatpulse-pulse2-monitor", { when: Date.now() + 100 });
  });
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

async function waitForManagedChatGPTPage(browserContext, excludedPages = new Set()) {
  return waitFor(async () => browserContext.pages().find((page) => {
    if (excludedPages.has(page)) return false;
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

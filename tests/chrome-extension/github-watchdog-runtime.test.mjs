import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const workerPath = fileURLToPath(new URL("../../chrome-extension/background/service-worker-v2.js", import.meta.url));
const worker = await readFile(workerPath, "utf8");

test("GitHub watchdog uses a distinct alarm and lossless shared serialization", () => {
  assert.match(worker, /chatpulse-github-actions-watchdog/);
  assert.match(worker, /if \(source\.startsWith\("github-watchdog"\)\)/);
  assert.match(worker, /const previous = activeCheck/);
  assert.match(worker, /previous\.catch\(\(\) => \{\}\)/);
  assert.match(worker, /then\(\(\) => performCheck\(source, allowWhenStopped, onlyChatId\)\)/);
  assert.match(worker, /if \(activeCheck === tracked\) activeCheck = null/);
  assert.doesNotMatch(worker, /if \(activeCheck\) return activeCheck/);
});

test("GitHub API failures are recorded and never mapped directly to a restart", () => {
  const start = worker.indexOf("async function performGithubWatchdog");
  const end = worker.indexOf("async function attemptGithubWatchdogRestart", start);
  const block = worker.slice(start, end);
  assert.ok(block.includes("recordGithubWatchError"));
  assert.ok(block.includes("fetchLatestGithubWorkflowRun"));
  assert.ok(block.includes("githubWatchdogDecision"));
  const catchIndex = block.indexOf("} catch (error)");
  const persistIndex = block.indexOf("await persistAndPublish(merged)");
  const restartListIndex = block.indexOf("const restartIds");
  assert.ok(catchIndex >= 0);
  assert.ok(persistIndex >= 0 && restartListIndex > persistIndex, "observations must be durable before restart selection");
  assert.ok(block.includes("successfulRepositories.has(profile.githubRepository)"), "failed API polls must never select restart candidates");
});

test("watchdog restart preserves run counters and uses durable dispatch checkpoint", () => {
  const start = worker.indexOf("async function attemptGithubWatchdogRestart");
  const end = worker.indexOf("async function persistSingleRuntimeChat", start);
  const block = worker.slice(start, end);
  assert.equal(block.includes("startChatRun("), false, "watchdog restart must not reset runStartedAt/counter");
  assert.ok(block.includes("completionGuardReason"));
  assert.ok(block.includes("hasDraft"));
  assert.ok(block.includes('"already-continued"'));
  assert.ok(block.includes("recordDispatch("));
  assert.ok(block.includes("recordGithubRestart("));
  assert.ok(block.includes("persistDispatchCheckpoint("));
  assert.ok(block.indexOf("recordGithubRestart(") < block.indexOf("persistDispatchCheckpoint("));
});

test("live watchdog send gate requires same session, control revision and master engine", () => {
  const start = worker.indexOf("async function attemptGithubWatchdogRestart");
  const end = worker.indexOf("async function persistSingleRuntimeChat", start);
  const block = worker.slice(start, end);
  assert.ok(block.includes("stillSameControl"));
  assert.ok(block.includes("stillSameSession"));
  assert.ok(block.includes("state.enabled && chat.enabled"));
  assert.ok(block.includes("liveStall.restartKey !== stall.restartKey"));
});

test("configured GitHub repositories are deduplicated and bounded", () => {
  assert.ok(worker.includes("const groups = new Map()"));
  assert.ok(worker.includes("MAX_GITHUB_WATCHED_REPOSITORIES"));
  assert.ok(worker.includes("assertGithubWatchCapacity(state)"));
});

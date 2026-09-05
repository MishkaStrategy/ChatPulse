import assert from "node:assert/strict";
import test from "node:test";

const backing = {};
const accessLevels = [];

globalThis.chrome = {
  storage: {
    local: {
      async setAccessLevel(value) {
        accessLevels.push(value);
      },
      async get(key) {
        return { [key]: backing[key] };
      },
      async set(patch) {
        Object.assign(backing, patch);
      }
    }
  }
};

const {
  clearGithubToken,
  GITHUB_CREDENTIALS_KEY,
  listGithubTokenRepositories,
  saveGithubToken
} = await import("../../chrome-extension/background/github-actions.js?github-token-security");

test("GitHub credential storage is restricted to trusted extension contexts", async () => {
  await saveGithubToken("MishkaStrategy/Elza", "github_pat_TEST_ONLY_12345678901234567890");
  assert.ok(accessLevels.some((value) => value?.accessLevel === "TRUSTED_CONTEXTS"));
  assert.ok(backing[GITHUB_CREDENTIALS_KEY]);
});

test("GitHub credential store is repository keyed and public listing never returns token values", async () => {
  const secret = "github_pat_TEST_ONLY_abcdefghijklmnopqrstuvwxyz";
  const result = await saveGithubToken("MishkaStrategy/Elza", secret);
  assert.deepEqual(result, { repository: "mishkastrategy/elza", tokenConfigured: true });
  assert.deepEqual(await listGithubTokenRepositories(), ["mishkastrategy/elza"]);
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(JSON.stringify(await listGithubTokenRepositories()).includes(secret), false);
  assert.equal(backing[GITHUB_CREDENTIALS_KEY].tokens["mishkastrategy/elza"], secret);
});

test("GitHub credential can be removed without touching ChatPulse runtime state", async () => {
  backing.chatpulseState = { marker: "keep-me" };
  await clearGithubToken("MishkaStrategy/Elza");
  assert.deepEqual(await listGithubTokenRepositories(), []);
  assert.deepEqual(backing.chatpulseState, { marker: "keep-me" });
});

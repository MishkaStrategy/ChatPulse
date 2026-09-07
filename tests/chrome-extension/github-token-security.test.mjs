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
  clearGlobalGithubToken,
  GITHUB_CREDENTIALS_KEY,
  hasGlobalGithubToken,
  listGithubTokenRepositories,
  saveGithubToken,
  saveGlobalGithubToken,
  verifyGithubTokenAccess,
  verifyGlobalGithubTokenAccess
} = await import("../../chrome-extension/background/github-actions.js?github-token-security");

function successFetch(calls) {
  return async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ workflow_runs: [] })
    };
  };
}

test("GitHub credential storage is restricted to trusted extension contexts", async () => {
  await saveGithubToken("MishkaStrategy/Elza", "github_pat_TEST_ONLY_12345678901234567890");
  assert.ok(accessLevels.some((value) => value?.accessLevel === "TRUSTED_CONTEXTS"));
  assert.ok(backing[GITHUB_CREDENTIALS_KEY]);
});

test("GitHub credential store keeps repository tokens private and public listing never returns values", async () => {
  const secret = "github_pat_TEST_ONLY_abcdefghijklmnopqrstuvwxyz";
  const result = await saveGithubToken("MishkaStrategy/Elza", secret);
  assert.deepEqual(result, { repository: "mishkastrategy/elza", tokenConfigured: true });
  assert.deepEqual(await listGithubTokenRepositories(), ["mishkastrategy/elza"]);
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(JSON.stringify(await listGithubTokenRepositories()).includes(secret), false);
  assert.equal(backing[GITHUB_CREDENTIALS_KEY].tokens["mishkastrategy/elza"], secret);
});

test("one shared PAT is stored once, exposed only as a boolean and can authenticate any repository", async () => {
  const secret = "github_pat_TEST_ONLY_GLOBAL_abcdefghijklmnopqrstuvwxyz";
  const result = await saveGlobalGithubToken(secret);
  assert.deepEqual(result, { tokenConfigured: true });
  assert.equal(await hasGlobalGithubToken(), true);
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(backing[GITHUB_CREDENTIALS_KEY].version, 2);
  assert.equal(backing[GITHUB_CREDENTIALS_KEY].globalToken, secret);

  const calls = [];
  const verified = await verifyGlobalGithubTokenAccess(
    "MishkaStrategy/AnotherPrivateRepo",
    undefined,
    successFetch(calls)
  );
  assert.equal(verified.repository, "MishkaStrategy/AnotherPrivateRepo");
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${secret}`);
});

test("repository-specific token overrides shared PAT and clearing it falls back to the shared PAT", async () => {
  const globalSecret = "github_pat_TEST_ONLY_GLOBAL_12345678901234567890";
  const repositorySecret = "github_pat_TEST_ONLY_REPO_12345678901234567890";
  await saveGlobalGithubToken(globalSecret);
  await saveGithubToken("MishkaStrategy/Elza", repositorySecret);

  const overrideCalls = [];
  await verifyGithubTokenAccess("MishkaStrategy/Elza", undefined, successFetch(overrideCalls));
  assert.equal(overrideCalls[0].init.headers.Authorization, `Bearer ${repositorySecret}`);

  await clearGithubToken("MishkaStrategy/Elza");
  const fallbackCalls = [];
  await verifyGithubTokenAccess("MishkaStrategy/Elza", undefined, successFetch(fallbackCalls));
  assert.equal(fallbackCalls[0].init.headers.Authorization, `Bearer ${globalSecret}`);
});

test("legacy v1 repository tokens remain readable after shared-PAT support is introduced", async () => {
  const legacySecret = "github_pat_TEST_ONLY_LEGACY_12345678901234567890";
  backing[GITHUB_CREDENTIALS_KEY] = {
    version: 1,
    tokens: { "mishkastrategy/legacy": legacySecret }
  };
  const calls = [];
  await verifyGithubTokenAccess("MishkaStrategy/Legacy", undefined, successFetch(calls));
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${legacySecret}`);
  assert.deepEqual(await listGithubTokenRepositories(), ["mishkastrategy/legacy"]);
  assert.equal(await hasGlobalGithubToken(), false);
});

test("shared PAT can be removed without touching repository tokens or ChatPulse runtime state", async () => {
  backing.chatpulseState = { marker: "keep-me" };
  await saveGithubToken("MishkaStrategy/Elza", "github_pat_TEST_ONLY_REPO_KEEP_12345678901234567890");
  await saveGlobalGithubToken("github_pat_TEST_ONLY_GLOBAL_REMOVE_12345678901234567890");
  await clearGlobalGithubToken();
  assert.equal(await hasGlobalGithubToken(), false);
  assert.deepEqual(await listGithubTokenRepositories(), ["mishkastrategy/elza", "mishkastrategy/legacy"]);
  assert.deepEqual(backing.chatpulseState, { marker: "keep-me" });
});

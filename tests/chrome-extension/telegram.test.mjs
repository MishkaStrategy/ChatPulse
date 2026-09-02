import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = new URL('../../chrome-extension/', import.meta.url).pathname.replace(/\/$/, '');
const data = {};
let permissionGranted = true;
let lastRequest = null;
let sendCount = 0;
let storageWrites = 0;

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

globalThis.chrome = {
  storage: {
    local: {
      async get(key) {
        if (typeof key === 'string') return { [key]: clone(data[key]) };
        return clone(data);
      },
      async set(patch) {
        storageWrites += 1;
        Object.assign(data, clone(patch));
      }
    }
  },
  permissions: {
    async contains() {
      return permissionGranted;
    }
  }
};

globalThis.fetch = async (url, options) => {
  sendCount += 1;
  lastRequest = { url: String(url), options: clone({ ...options, signal: undefined }) };
  return {
    ok: true,
    status: 200,
    async json() {
      return { ok: true, result: { message_id: 1 } };
    }
  };
};

const telegramUrl = `${pathToFileURL(`${root}/background/telegram.js`).href}?test=${Date.now()}`;
const telegram = await import(telegramUrl);
const token = '123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef_123456789';

let publicConfig = await telegram.updateTelegramConfig({
  telegramEnabled: true,
  telegramChatId: '123456789',
  telegramBotToken: token
});
assert.equal(publicConfig.enabled, true);
assert.equal(publicConfig.chatId, '123456789');
assert.equal(publicConfig.tokenConfigured, true);
assert.equal(publicConfig.permissionGranted, true);
assert.equal(Object.hasOwn(publicConfig, 'botToken'), false, 'public config must never expose bot token');
assert.equal(data.chatpulseTelegramConfig.botToken, token, 'token is stored only in extension local storage');

sendCount = 0;
await telegram.notifyTelegramContinuation({
  chatTitle: 'Рабочий чат',
  outcome: 'confirmed'
});
assert.equal(sendCount, 1);
assert.ok(lastRequest.url.startsWith('https://api.telegram.org/bot'));
const requestBody = JSON.parse(lastRequest.options.body);
assert.equal(requestBody.chat_id, '123456789');
assert.ok(requestBody.text.includes('Рабочий чат'));
assert.ok(requestBody.text.includes('команда продолжения отправлена'));
assert.equal(requestBody.text.includes('https://chatgpt.com'), false);
assert.equal(requestBody.text.includes(token), false);

await telegram.sendTelegramTest();
assert.equal(sendCount, 2);

const attached = await telegram.attachTelegramState({ enabled: false, chats: [] });
assert.equal(attached.telegram.tokenConfigured, true);
assert.equal(Object.hasOwn(attached.telegram, 'botToken'), false);

permissionGranted = false;
publicConfig = await telegram.getTelegramPublicConfig();
assert.equal(publicConfig.permissionGranted, false);
await assert.rejects(
  telegram.sendTelegramTest(),
  /Разрешите доступ к api\.telegram\.org/
);
await assert.rejects(
  telegram.updateTelegramConfig({ telegramEnabled: true }),
  /Разрешите доступ к api\.telegram\.org/
);

const writesBeforeUnrelatedPatch = storageWrites;
publicConfig = await telegram.updateTelegramConfig({ theme: 'preview', intervalMinutes: 10, stopPhrase: 'готово' });
assert.equal(publicConfig.enabled, true);
assert.equal(publicConfig.permissionGranted, false);
assert.equal(storageWrites, writesBeforeUnrelatedPatch, 'unrelated settings must not rewrite or validate Telegram config');

console.log(JSON.stringify({
  telegram_config_privacy: 'PASS',
  telegram_send: 'PASS',
  telegram_permission_gate: 'PASS',
  unrelated_settings_isolation: 'PASS',
  tests: 'PASS'
}, null, 2));

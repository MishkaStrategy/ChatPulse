const TELEGRAM_CONFIG_KEY = "chatpulseTelegramConfig";
export const TELEGRAM_ORIGIN = "https://api.telegram.org/*";
const TELEGRAM_API_BASE = "https://api.telegram.org";
const SEND_TIMEOUT_MS = 10_000;
const TELEGRAM_PATCH_KEYS = new Set([
  "telegramEnabled",
  "telegramChatId",
  "telegramBotToken"
]);

export async function attachTelegramState(state) {
  return {
    ...state,
    telegram: await getTelegramPublicConfig()
  };
}

export async function getTelegramPublicConfig() {
  const config = await loadTelegramConfig();
  return {
    enabled: config.enabled,
    chatId: config.chatId,
    tokenConfigured: Boolean(config.botToken),
    permissionGranted: await hasTelegramPermission()
  };
}

export async function updateTelegramConfig(patch = {}) {
  const hasTelegramPatch = Object.keys(patch).some((key) => TELEGRAM_PATCH_KEYS.has(key));
  if (!hasTelegramPatch) return getTelegramPublicConfig();

  const current = await loadTelegramConfig();
  const next = { ...current };

  if (typeof patch.telegramChatId === "string") {
    next.chatId = patch.telegramChatId.trim();
  }
  if (typeof patch.telegramBotToken === "string" && patch.telegramBotToken.trim()) {
    next.botToken = patch.telegramBotToken.trim();
  }
  if (typeof patch.telegramEnabled === "boolean") {
    next.enabled = patch.telegramEnabled;
  }

  if (next.enabled) {
    assertValidChatId(next.chatId);
    assertValidBotToken(next.botToken);
    if (!(await hasTelegramPermission())) {
      throw new Error("Разрешите доступ к api.telegram.org в настройках Telegram ChatPulse.");
    }
  }

  await chrome.storage.local.set({ [TELEGRAM_CONFIG_KEY]: next });
  return getTelegramPublicConfig();
}

export async function sendTelegramTest() {
  const config = await requireEnabledTelegramConfig();
  await sendTelegramMessage(config, "ChatPulse: тестовое уведомление успешно.");
  return { sent: true };
}

export async function notifyTelegramContinuation({ chatTitle, outcome }) {
  return notifyTelegramEvent({ chatTitle, event: "continuation", outcome });
}

export async function notifyTelegramEvent({ chatTitle, event, outcome = null }) {
  const config = await loadTelegramConfig();
  if (!config.enabled) return { sent: false };
  if (!(await hasTelegramPermission())) {
    throw new Error("доступ к api.telegram.org отозван");
  }
  assertValidChatId(config.chatId);
  assertValidBotToken(config.botToken);

  const safeTitle = String(chatTitle || "Чат ChatGPT")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160) || "Чат ChatGPT";
  const status = eventMessage(event, outcome);
  await sendTelegramMessage(config, `ChatPulse · ${safeTitle}\n${status}`);
  return { sent: true };
}

async function requireEnabledTelegramConfig() {
  const config = await loadTelegramConfig();
  if (!config.enabled) throw new Error("Сначала включите Telegram-уведомления.");
  if (!(await hasTelegramPermission())) {
    throw new Error("Разрешите доступ к api.telegram.org.");
  }
  assertValidChatId(config.chatId);
  assertValidBotToken(config.botToken);
  return config;
}

async function loadTelegramConfig() {
  const stored = await chrome.storage.local.get(TELEGRAM_CONFIG_KEY);
  const raw = stored?.[TELEGRAM_CONFIG_KEY];
  return {
    enabled: raw?.enabled === true,
    chatId: typeof raw?.chatId === "string" ? raw.chatId.trim() : "",
    botToken: typeof raw?.botToken === "string" ? raw.botToken.trim() : ""
  };
}

async function hasTelegramPermission() {
  try {
    return await chrome.permissions.contains({ origins: [TELEGRAM_ORIGIN] });
  } catch {
    return false;
  }
}

function eventMessage(event, outcome) {
  return {
    continuation: outcome === "confirmed"
      ? "команда продолжения отправлена."
      : "кнопка отправки нажата; повтор для этого ответа заблокирован.",
    "stop-phrase": "задача остановлена: обнаружена стоп-фраза.",
    "continuation-limit": "задача остановлена: достигнут лимит продолжений.",
    "runtime-limit": "задача остановлена: достигнут лимит времени.",
    "automation-error": "автоматика встретила ошибку; подробности доступны локально в Control Center.",
    "task-started": "режим «до завершения» запущен."
  }[event] || "изменилось состояние автоматизации. Откройте Control Center для подробностей.";
}

function assertValidChatId(value) {
  const chatId = String(value || "").trim();
  if (!/^-?\d{1,20}$/.test(chatId) && !/^@[A-Za-z0-9_]{5,32}$/.test(chatId)) {
    throw new Error("Укажите Telegram chat ID или @channel_username.");
  }
}

function assertValidBotToken(value) {
  const token = String(value || "").trim();
  if (!/^\d{5,20}:[A-Za-z0-9_-]{20,}$/.test(token)) {
    throw new Error("Укажите корректный token Telegram-бота от BotFather.");
  }
}

async function sendTelegramMessage(config, text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: String(text).slice(0, 4096)
      }),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true) {
      const description = typeof payload?.description === "string"
        ? payload.description.slice(0, 180)
        : `HTTP ${response.status}`;
      throw new Error(`Telegram API: ${description}`);
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Telegram API не ответил за 10 секунд.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

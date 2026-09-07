import { normalizeChatURL } from "./model-v2.js";

export function replaceChatURLInState(state, chatId, rawURL) {
  const normalizedURL = normalizeChatURL(rawURL);
  if (!normalizedURL) {
    throw new Error("Укажите ссылку на конкретный чат ChatGPT.");
  }

  const chats = Array.isArray(state?.chats) ? state.chats : [];
  const index = chats.findIndex((chat) => chat?.id === chatId);
  if (index < 0) throw new Error("Чат не найден.");

  const duplicate = chats.find((chat, chatIndex) => chatIndex !== index && chat?.url === normalizedURL);
  if (duplicate) {
    throw new Error(`Эта ссылка уже используется чатом «${duplicate.title || "ChatGPT"}».`);
  }

  const current = chats[index];
  if (current.url === normalizedURL) {
    return { state, chat: current, changed: false };
  }

  const updated = {
    ...current,
    url: normalizedURL,
    controlRevision: Number(current.controlRevision || 0) + 1,
    nextEligibleAt: null,
    tabId: null,
    lastDecision: null,
    lastObservedFingerprint: null,
    lastCommandedFingerprint: null,
    lastObservedAt: null,
    lastCommandAt: null,
    lastDispatchOutcome: null,
    lastObservedSessionId: null,
    lastSnapshotAt: null,
    lastHardRefreshAt: null,
    lastRecoveryAt: null,
    lastRecoveryReason: null,
    staleRecoveries: 0,
    lastStoppedAt: null,
    lastStopReason: null,
    lastError: null
  };

  return {
    state: {
      ...state,
      chats: chats.map((chat, chatIndex) => chatIndex === index ? updated : chat)
    },
    chat: updated,
    changed: true
  };
}

#!/usr/bin/env python3
from pathlib import Path


def replace_once(path_str, old, new, label):
    path = Path(path_str)
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one block, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")
    print(f"patched: {label}")


replace_once(
    "chrome-extension/lib/model-v2.js",
    '''export function recordDispatch(chat, fingerprint, outcome, at = new Date().toISOString()) {
  return {
    ...chat,
    continuationCount: nonNegativeInteger(chat.continuationCount) + 1,
    lastCommandedFingerprint: fingerprint,
    lastCommandAt: at,
    lastDispatchOutcome: outcome,
    lastError: outcome === "confirmed" ? null : "Отправка нажата, но DOM не подтвердил сообщение"
  };
}

export function mergeRuntimeState(observedState, latestState) {''',
    '''export function recordDispatch(chat, fingerprint, outcome, at = new Date().toISOString()) {
  return {
    ...chat,
    continuationCount: nonNegativeInteger(chat.continuationCount) + 1,
    lastCommandedFingerprint: fingerprint,
    lastCommandAt: at,
    lastDispatchOutcome: outcome,
    lastError: outcome === "confirmed" ? null : "Отправка нажата, но DOM не подтвердил сообщение"
  };
}

export function mergeDispatchCheckpoint(runtimeChat, latestChat) {
  const sameControlRevision = nonNegativeInteger(runtimeChat?.controlRevision)
    === nonNegativeInteger(latestChat?.controlRevision);
  const runtimeRunStartedAt = stringOrNull(runtimeChat?.runStartedAt);
  const latestRunStartedAt = stringOrNull(latestChat?.runStartedAt);
  const canAdoptRunStart = sameControlRevision && !latestRunStartedAt && Boolean(runtimeRunStartedAt);
  const sameRun = runtimeRunStartedAt === latestRunStartedAt || canAdoptRunStart;
  const merged = {
    ...latestChat,
    ...(sameControlRevision ? {
      runStartedAt: canAdoptRunStart ? runtimeRunStartedAt : latestChat.runStartedAt,
      continuationCount: sameRun
        ? Math.max(nonNegativeInteger(latestChat?.continuationCount), nonNegativeInteger(runtimeChat?.continuationCount))
        : nonNegativeInteger(latestChat?.continuationCount),
      tabId: runtimeChat.tabId,
      lastObservedFingerprint: runtimeChat.lastObservedFingerprint,
      lastObservedAt: runtimeChat.lastObservedAt,
      lastObservedSessionId: runtimeChat.lastObservedSessionId,
      lastSnapshotAt: runtimeChat.lastSnapshotAt,
      lastHardRefreshAt: runtimeChat.lastHardRefreshAt,
      lastRecoveryAt: runtimeChat.lastRecoveryAt,
      lastRecoveryReason: runtimeChat.lastRecoveryReason,
      staleRecoveries: runtimeChat.staleRecoveries,
      lastDecision: runtimeChat.lastDecision,
      nextEligibleAt: runtimeChat.nextEligibleAt
    } : {}),
    lastCommandedFingerprint: runtimeChat.lastCommandedFingerprint,
    lastCommandAt: runtimeChat.lastCommandAt,
    lastDispatchOutcome: runtimeChat.lastDispatchOutcome,
    lastError: runtimeChat.lastError
  };
  return merged;
}

export function mergeRuntimeState(observedState, latestState) {''',
    "model dispatch checkpoint merge",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''  isChatDue,
  mergeRuntimeState,
  normalizeChatProfile,''',
    '''  isChatDue,
  mergeDispatchCheckpoint,
  mergeRuntimeState,
  normalizeChatProfile,''',
    "service worker import",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''      state = appendLog({
        ...state,
        enabled: true
      }, "info", `Задача «${state.chats[index].title}» запущена до условия завершения`);
      state = await notifyChatEvent(state, state.chats[index], "task-started");
      state = await configureAlarm(state);
      await persistAndPublish(state);
      void runCheck("task-start");''',
    '''      state = appendLog({
        ...state,
        enabled: true
      }, "info", `Задача «${state.chats[index].title}» запущена до условия завершения`);
      state = await configureAlarm(state);
      await persistAndPublish(state);
      state = await notifyChatEvent(state, state.chats[index], "task-started");
      await persistAndPublish(state);
      void runCheck("task-start");''',
    "persist task start before Telegram",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''    chat = prepareChatRun(chat);
    observedState.chats[index] = chat;

    const preCheckGuard = completionGuardReason(chat, profile);''',
    '''    chat = prepareChatRun(chat);
    observedState.chats[index] = chat;
    await persistRunStartCheckpoint(chat);

    const preCheckGuard = completionGuardReason(chat, profile);''',
    "persist run start identity",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''      observedState = appendLog(
        observedState,
        outcome === "confirmed" ? "info" : "warning",
        outcome === "confirmed"
          ? `Команда отправлена в «${chat.title}» · продолжение ${observedState.chats[index].continuationCount}`
          : `Кнопка отправки нажата в «${chat.title}»; повтор для ответа заблокирован · продолжение ${observedState.chats[index].continuationCount}`
      );
      observedState = await notifyChatEvent(
        observedState,
        observedState.chats[index],
        "continuation",
        outcome
      );

      const postDispatchGuard = completionGuardReason(observedState.chats[index], profile);
      if (postDispatchGuard) {
        observedState.chats[index] = applyCompletion(observedState.chats[index], postDispatchGuard);
        observedState = appendLog(
          observedState,
          "info",
          `${chat.title}: ${completionDescription(postDispatchGuard)}`
        );
        observedState = await notifyChatEvent(
          observedState,
          observedState.chats[index],
          postDispatchGuard
        );
      }''',
    '''      const checkpoint = await persistDispatchCheckpoint(observedState.chats[index]);
      observedState.chats[index] = checkpoint.chat;
      observedState = appendLog(
        observedState,
        outcome === "confirmed" ? "info" : "warning",
        outcome === "confirmed"
          ? `Команда отправлена в «${chat.title}» · продолжение ${observedState.chats[index].continuationCount}`
          : `Кнопка отправки нажата в «${chat.title}»; повтор для ответа заблокирован · продолжение ${observedState.chats[index].continuationCount}`
      );
      observedState = await notifyChatEvent(
        observedState,
        observedState.chats[index],
        "continuation",
        outcome
      );

      if (checkpoint.guard) {
        observedState = appendLog(
          observedState,
          "info",
          `${chat.title}: ${completionDescription(checkpoint.guard)}`
        );
        observedState = await notifyChatEvent(
          observedState,
          observedState.chats[index],
          checkpoint.guard
        );
      }''',
    "persist dispatch before notification and current-profile guard",
)

replace_once(
    "chrome-extension/background/service-worker-v2.js",
    '''async function notifyChatEvent(state, chat, event, outcome = null) {''',
    '''async function persistRunStartCheckpoint(runtimeChat) {
  const latestState = await loadState();
  const index = latestState.chats.findIndex((candidate) => candidate.id === runtimeChat.id);
  if (index < 0) return;
  const latestChat = latestState.chats[index];
  const sameControlRevision = Number(latestChat.controlRevision || 0)
    === Number(runtimeChat.controlRevision || 0);
  if (!sameControlRevision || latestChat.runStartedAt || !runtimeChat.runStartedAt) return;
  latestState.chats[index] = { ...latestChat, runStartedAt: runtimeChat.runStartedAt };
  await saveState(latestState);
}

async function persistDispatchCheckpoint(runtimeChat) {
  const latestState = await loadState();
  const index = latestState.chats.findIndex((candidate) => candidate.id === runtimeChat.id);
  if (index < 0) return { chat: runtimeChat, guard: null };

  let checkpointChat = mergeDispatchCheckpoint(runtimeChat, latestState.chats[index]);
  latestState.chats[index] = checkpointChat;
  const currentProfile = effectiveChatProfile(latestState, checkpointChat);
  const guard = checkpointChat.enabled
    ? completionGuardReason(checkpointChat, currentProfile)
    : null;
  if (guard) {
    checkpointChat = applyCompletion(checkpointChat, guard);
    latestState.chats[index] = checkpointChat;
  }
  await saveState(latestState);
  return { chat: checkpointChat, guard };
}

async function notifyChatEvent(state, chat, event, outcome = null) {''',
    "checkpoint persistence helpers",
)

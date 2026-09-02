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
    "README.md",
    '''Без guard ChatPulse не запускает автономную задачу. При запуске только выбранный чат получает новый безопасный baseline и новый счётчик. При достижении stop/limit ChatPulse отключает только этот чат и фиксирует точную причину в Control Center.

Счётчик увеличивается только после того, как `recordDispatch()` уже зафиксировал результат отправки для `at-most-once`. Поэтому лимит `10` не может привести к одиннадцатой команде.''',
    '''Без guard ChatPulse не запускает автономную задачу. При запуске только выбранный чат получает новый безопасный baseline и новый счётчик. Если обычное наблюдение было остановлено, ChatPulse включает `taskOnly` engine: проверяется только выбранная активная задача, а остальные обычные чаты не просыпаются. Если обычное наблюдение уже работало, оно продолжает работать как раньше.

Верхняя кнопка **Остановить / Остановить всё** — master-stop. Она отключает фоновый engine целиком и завершает активные task-mode запуски с причиной `global-stop`. Ручной Stop задачи или общий master-stop повышают `controlRevision`, поэтому старая in-flight проверка не может воскресить завершённую задачу или отправить по устаревшему состоянию.

При достижении stop/limit ChatPulse отключает только этот чат и фиксирует точную причину в Control Center. Счётчик увеличивается только после того, как `recordDispatch()` уже зафиксировал результат отправки для `at-most-once`, причём dispatch checkpoint сохраняется локально до Telegram/network уведомления. Поэтому лимит `10` не может привести к одиннадцатой команде.''',
    "README taskOnly/master-stop contract",
)

replace_once(
    "SECURITY.md",
    '''The **run until completion** mode is rejected unless the effective profile has at least one completion guard: stop phrase, continuation limit or runtime limit. Starting a task resets only that chat's run counter/baseline and does not erase the global safety state of other chats.''',
    '''The **run until completion** mode is rejected unless the effective profile has at least one completion guard: stop phrase, continuation limit or runtime limit. Starting a task resets only that chat's run counter/baseline and does not erase the global safety state of other chats. If ordinary monitoring is off, the engine enters `taskOnly` mode and schedules only active task chats; unrelated enabled chats remain dormant. The top Stop action is still a master stop: it turns the engine off and closes active task mode without disabling the chat itself. Manual/global task stop advances `controlRevision`, invalidating any older in-flight task snapshot.''',
    "SECURITY taskOnly/master-stop boundary",
)

replace_once(
    "SECURITY.md",
    '''A continuation limit is checked before dispatch and again immediately after `recordDispatch()`. The count advances only after the dispatch outcome has been fixed, so a limit of `N` permits at most `N` commands, never `N+1`. Runtime limits are checked before a new send.''',
    '''A continuation limit is checked before dispatch and again immediately after `recordDispatch()`. The count advances only after the dispatch outcome has been fixed, so a limit of `N` permits at most `N` commands, never `N+1`. Runtime limits are checked before a new send. The resulting fingerprint/outcome checkpoint is persisted to local storage before Telegram or other network notification work; a concurrent profile edit keeps the newer profile/control state while still accounting for the real same-run dispatch.''',
    "SECURITY durable dispatch boundary",
)

replace_once(
    "CHANGELOG.md",
    '''- add guarded **run until completion** mode that refuses to start without a stop phrase, continuation limit or runtime limit;
- add schema v4 runtime fields for task progress, completion reason, per-chat scheduling and control-revision-safe profile changes;''',
    '''- add guarded **run until completion** mode that refuses to start without a stop phrase, continuation limit or runtime limit;
- add isolated `taskOnly` engine mode when a task starts from master-stop, so unrelated ordinary chats stay dormant; keep the top Stop action as a full master-stop for active tasks and ordinary monitoring;
- persist at-most-once dispatch fingerprints/counts before Telegram/network notification work and invalidate stale task checks on manual/global stop;
- add schema v4 runtime fields for task progress, completion reason, per-chat scheduling and control-revision-safe profile changes;''',
    "CHANGELOG final safety bullets",
)

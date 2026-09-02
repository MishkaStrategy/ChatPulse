#!/usr/bin/env python3
from pathlib import Path

path = Path("chrome-extension/background/service-worker-v2.js")
text = path.read_text(encoding="utf-8")
old = '''      state = appendLog({
        ...state,
        enabled: true,
        sessionId: createSessionId()
      }, "info", `Задача «${state.chats[index].title}» запущена до условия завершения`);'''
new = '''      state = appendLog({
        ...state,
        enabled: true
      }, "info", `Задача «${state.chats[index].title}» запущена до условия завершения`);'''
count = text.count(old)
if count != 1:
    raise SystemExit(f"Expected one START_TASK global session block, found {count}")
path.write_text(text.replace(old, new), encoding="utf-8")
print("START_TASK now resets only selected chat baseline")

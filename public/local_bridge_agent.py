import asyncio
import json
import urllib.request
import httpx
import re
import sys
import os
from playwright.async_api import async_playwright

# ИСПОЛЬЗУЕМ 127.0.0.1 ДЛЯ НАДЕЖНОСТИ
SERVER_URL = "http://127.0.0.1:8000"
DEBUG_HOST = "http://127.0.0.1:9333" 
PERPLEXITY_URL = "https://www.perplexity.ai/"

def get_ws_url():
    try:
        print(f"🔍 Проверка браузера на {DEBUG_HOST}...")
        with urllib.request.urlopen(f"{DEBUG_HOST}/json/version", timeout=2) as r:
            data = json.loads(r.read().decode())
            return data["webSocketDebuggerUrl"]
    except Exception as e:
        print(f"❌ Браузер не отвечает. Ошибка: {e}")
        return None

async def worker(context, job):
    # Код воркера без изменений (как в прошлом сообщении)
    # ... (пропустим для краткости, он верный) ...
    pass

async def main():
    print("====================================")
    print("🚀 ЗАПУСК АГЕНТА LOCAL BRIDGE")
    print("====================================")

    ws = get_ws_url()
    if not ws:
        print("\nКРИТИЧЕСКАЯ ОШИБКА:")
        print(f"Не удалось подключиться к Opera на порту 9333.")
        print("-" * 40)
        print("КАК ИСПРАВИТЬ:")
        print("1. Полностью закройте Opera (проверьте Диспетчер задач).")
        print("2. Запустите её через 'Выполнить' (Win+R) командой:")
        print("   opera.exe --remote-debugging-port=9333")
        print("-" * 40)
        return # Выход из функции

    async with async_playwright() as p:
        try:
            print("🔗 Подключение к браузеру...")
            browser = await p.chromium.connect_over_cdp(ws)
            ctx = browser.contexts[0]
            print("✅ Успешно! Ожидание задач от сервера...")
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                while True:
                    try:
                        res = await client.get(f"{SERVER_URL}/agent-api/get-job")
                        if res.status_code == 200:
                            job = res.json()
                            if job.get("type") == "translate":
                                # Тут ваша логика перевода...
                                print(f"\n🔥 Задача принята!")
                                # ...
                        else:
                            print(f"⚠️ Сервер ответил: {res.status_code}")
                    except httpx.ConnectError:
                        print("📡 Ошибка: Сервер (server.py) не запущен.")
                    except Exception as e:
                        print(f"⚠️ Ошибка в цикле: {e}")
                    
                    await asyncio.sleep(4)
        except Exception as e:
            print(f"❌ Ошибка Playwright: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Остановка пользователем.")
    except Exception as e:
        print(f"\n💥 КРИТИЧЕСКАЯ ОШИБКА ПРИЛОЖЕНИЯ: {e}")
    finally:
        print("\n" + "="*40)
        input("Нажмите ENTER, чтобы закрыть это окно...")
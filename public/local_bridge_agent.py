import asyncio
import json
import urllib.request
import httpx
import re
import sys
import os
from playwright.async_api import async_playwright

# Настройки подключения
SERVER_URL = "http://127.0.0.1:8000"
DEBUG_HOST = "http://127.0.0.1:9333" 
PERPLEXITY_URL = "https://www.perplexity.ai/"
RULATE_BASE = "https://tl.rulate.ru"

def get_ws_url():
    try:
        print(f"🔍 Проверка браузера на {DEBUG_HOST}...")
        with urllib.request.urlopen(f"{DEBUG_HOST}/json/version", timeout=2) as r:
            data = json.loads(r.read().decode())
            return data["webSocketDebuggerUrl"]
    except Exception as e:
        print(f"❌ Браузер не отвечает. Ошибка: {e}")
        return None

async def translate_worker(page, job):
    """Воркер для перевода через Perplexity"""
    results = []
    chapters = job.get("chapters", [])
    glossary = job.get("glossary", [])
    prompt = job.get("prompt", "")
    
    for ch in chapters:
        try:
            print(f"  📝 Перевод: {ch['title']}")
            
            # Формируем запрос
            glossary_text = "\n".join([f"{g.get('original','')} = {g.get('russian_translation', g.get('russian-translation', ''))}" for g in glossary])
            full_prompt = f"{prompt}\n\nГлоссарий:\n{glossary_text}\n\nТекст для перевода:\n{ch.get('original_text', '')}"
            
            # Отправляем в Perplexity
            await page.goto(PERPLEXITY_URL)
            await page.wait_for_selector("textarea", timeout=10000)
            await page.fill("textarea", full_prompt)
            await page.keyboard.press("Enter")
            
            # Ждём ответ
            await asyncio.sleep(15)
            
            # Получаем результат (упрощённо - нужно адаптировать под актуальную разметку)
            response_el = await page.query_selector(".prose")
            translated = await response_el.inner_text() if response_el else ""
            
            results.append({
                "id": ch["id"],
                "translated_text": translated
            })
            print(f"  ✅ Переведено: {ch['title']}")
            
        except Exception as e:
            print(f"  ❌ Ошибка перевода {ch['title']}: {e}")
            results.append({
                "id": ch["id"],
                "translated_text": f"[ОШИБКА ПЕРЕВОДА: {e}]"
            })
    
    return results

async def publish_chapter(page, book_url, chapter, settings):
    """Публикация одной главы на Rulate"""
    try:
        print(f"  📤 Публикация: {chapter['title']}")
        
        # 1. Открываем страницу книги
        await page.goto(book_url)
        await asyncio.sleep(2)
        
        # 2. Клик на "Добавить главы" -> "Одну главу"
        add_btn = await page.query_selector("text=Добавить главы")
        if add_btn:
            await add_btn.click()
            await asyncio.sleep(1)
        
        one_chapter = await page.query_selector("text=Одну главу")
        if one_chapter:
            await one_chapter.click()
            await asyncio.sleep(2)
        
        # 3. Заполняем форму создания главы
        # Название
        title_input = await page.query_selector("input[name='title'], input#title, input[placeholder*='название']")
        if title_input:
            await title_input.fill(chapter['title'])
        
        # Статус "Готов" 
        if settings.get('chapter_status') == 'ready':
            status_select = await page.query_selector("select[name='status'], select#status")
            if status_select:
                await status_select.select_option(label="Готов")
        
        # Галочка "Отложенная глава"
        if settings.get('delayed_chapter'):
            delayed_cb = await page.query_selector("input[type='checkbox'][name*='delay'], input[type='checkbox']#delayed")
            if delayed_cb:
                await delayed_cb.check()
        
        # Галочка "Подписка"
        if settings.get('subscription_only'):
            sub_cb = await page.query_selector("input[type='checkbox'][name*='subscr'], input[type='checkbox'][name*='paid']")
            if sub_cb:
                await sub_cb.check()
        
        # 4. Сохраняем главу
        save_btn = await page.query_selector("button:has-text('Сохранить'), input[type='submit'][value='Сохранить']")
        if save_btn:
            await save_btn.click()
            await asyncio.sleep(3)
        
        # 5. Ищем кнопку "импортировать текст" и кликаем
        import_link = await page.query_selector("a:has-text('импортировать'), a:has-text('Импортировать')")
        if import_link:
            await import_link.click()
            await asyncio.sleep(2)
        
        # 6. Вставляем текст перевода
        text_area = await page.query_selector("textarea")
        if text_area:
            await text_area.fill(chapter['translated_text'])
        
        # 7. Жмём "Далее"
        next_btn = await page.query_selector("button:has-text('Далее'), input[type='submit'][value='Далее']")
        if next_btn:
            await next_btn.click()
            await asyncio.sleep(2)
        
        # 8. Ставим галочку "Добавить как перевод"
        if settings.get('add_as_translation'):
            translation_cb = await page.query_selector("input[type='checkbox']:near(:text('как перевод'))")
            if translation_cb:
                await translation_cb.check()
        
        # 9. Финальное сохранение
        final_save = await page.query_selector("button:has-text('Сохранить'), input[type='submit'][value='Сохранить']")
        if final_save:
            await final_save.click()
            await asyncio.sleep(2)
        
        # Получаем ID главы из URL (если возможно)
        current_url = page.url
        rulate_chapter_id = None
        match = re.search(r'/(\d+)(?:/|$)', current_url)
        if match:
            rulate_chapter_id = match.group(1)
        
        print(f"  ✅ Опубликовано: {chapter['title']}")
        return {"success": True, "rulate_chapter_id": rulate_chapter_id}
        
    except Exception as e:
        print(f"  ❌ Ошибка публикации {chapter['title']}: {e}")
        return {"success": False, "error": str(e)}

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
        return

    async with async_playwright() as p:
        try:
            print("🔗 Подключение к браузеру...")
            browser = await p.chromium.connect_over_cdp(ws)
            ctx = browser.contexts[0]
            print("✅ Успешно! Ожидание задач от сервера...")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                while True:
                    try:
                        res = await client.get(f"{SERVER_URL}/agent-api/get-job")
                        if res.status_code == 200:
                            job = res.json()
                            job_type = job.get("type")
                            
                            if job_type == "translate":
                                print(f"\n🔥 Задача на ПЕРЕВОД: {len(job.get('chapters', []))} глав")
                                page = await ctx.new_page()
                                try:
                                    results = await translate_worker(page, job)
                                    await client.post(f"{SERVER_URL}/agent-api/submit-job", json={
                                        "type": "translate",
                                        "project_id": job.get("pid"),
                                        "results": results
                                    })
                                    print(f"✅ Перевод завершён: {len(results)} глав")
                                finally:
                                    await page.close()
                            
                            elif job_type == "publish":
                                print(f"\n📤 Задача на ПУБЛИКАЦИЮ: {len(job.get('chapters', []))} глав")
                                print(f"   URL книги: {job.get('book_url')}")
                                page = await ctx.new_page()
                                try:
                                    for chapter in job.get("chapters", []):
                                        result = await publish_chapter(
                                            page, 
                                            job.get("book_url"), 
                                            chapter, 
                                            job.get("settings", {})
                                        )
                                        await client.post(f"{SERVER_URL}/agent-api/submit-job", json={
                                            "type": "publish",
                                            "project_id": job.get("project_id"),
                                            "chapter_id": chapter["id"],
                                            "success": result.get("success", False),
                                            "rulate_chapter_id": result.get("rulate_chapter_id"),
                                            "error": result.get("error")
                                        })
                                    print(f"✅ Публикация завершена")
                                finally:
                                    await page.close()
                            
                            elif job_type != "empty":
                                print(f"⚠️ Неизвестный тип задачи: {job_type}")
                        else:
                            print(f"⚠️ Сервер ответил: {res.status_code}")
                    except httpx.ConnectError:
                        print("📡 Сервер (server.py) не запущен. Ожидание...")
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
        print(f"\n💥 КРИТИЧЕСКАЯ ОШИБКА: {e}")
    finally:
        print("\n" + "="*40)
        input("Нажмите ENTER, чтобы закрыть это окно...")

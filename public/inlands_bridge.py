#!/usr/bin/env python3
"""
InLands Bridge Agent
Локальный агент для перевода через Perplexity / Google AI Studio
"""

import asyncio
import json
import urllib.request
import time
import re
import os
import sys

# --- БЛОК БЕЗОПАСНОГО ИМПОРТА ---
try:
    import httpx
    from playwright.async_api import async_playwright
    from markdownify import markdownify as md
except ImportError as e:
    print(f"\n❌ ОШИБКА: Не установлена библиотека {e.name}")
    print("Выполните команду установки в терминале:")
    print("pip install httpx playwright markdownify && playwright install chromium")
    input("\nНажмите Enter, чтобы выйти...")
    sys.exit(1)

# --- КОНФИГУРАЦИЯ АГЕНТА ---
SERVER_URL = "http://localhost:5173"  # URL локального сервера
AGENT_API_KEY = "local_agent_key"
POLLING_INTERVAL = 3
DEBUG_HOST = "http://127.0.0.1:9222"

PERPLEXITY_URL = "https://www.perplexity.ai/"
AISTUDIO_URL = "https://aistudio.google.com/prompts/new_chat"

# КОЛИЧЕСТВО ОДНОВРЕМЕННЫХ ВКЛАДОК (ЗАДАЧ)
MAX_CONCURRENT_JOBS = 3


async def send_log(job_id, message, log_type="info", details=None):
    """Отправляет лог на сервер"""
    url = f"{SERVER_URL}/api/agent/log"
    headers = {"X-Agent-API-Key": AGENT_API_KEY}
    payload = {
        "job_id": job_id,
        "message": message,
        "type": log_type
    }
    if details:
        payload["details"] = details
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(url, json=payload, headers=headers)
    except Exception as e:
        print(f"⚠️ Лог не отправлен: {e}")
    print(f"[{job_id[:8] if job_id else 'SYSTEM'}] {message}")


def get_web_socket_debugger_url():
    """Получает URL отладчика браузера"""
    try:
        with urllib.request.urlopen(f"{DEBUG_HOST}/json/version") as response:
            data = json.loads(response.read().decode())
            return data.get("webSocketDebuggerUrl")
    except Exception:
        return None


async def create_page_safe(context):
    """Безопасно создаёт новую страницу"""
    try:
        page = await context.new_page()
        await page.wait_for_load_state()
        return page
    except Exception as e:
        print(f"❌ Ошибка создания страницы: {e}")
        return None


async def perplexity_worker(context, full_prompt, task_id):
    """Воркер для Perplexity AI"""
    await send_log(task_id, "🟢 [Perplexity] Запускаю браузер...", "info")
    page = await create_page_safe(context)
    if not page:
        await send_log(task_id, "❌ Не удалось создать страницу в браузере.", "error")
        return None
    
    try:
        await page.goto(PERPLEXITY_URL)
        try:
            await page.wait_for_selector("div.relative.flex", timeout=15000)
        except:
            await send_log(task_id, "⚠️ Сайт грузится долго, пробую продолжить...", "warning")
        
        await page.wait_for_timeout(1500)

        # Выбор модели Gemini 3 Pro
        if not await page.locator("button[aria-label='Gemini 3 Pro']").is_visible():
            model_btn = page.locator("button[aria-label='Выбрать модель'], button:has(use[xlink*='pplx-icon-cpu'])").first
            if await model_btn.is_visible():
                await model_btn.click()
                await page.wait_for_timeout(500)
                await page.locator("text=Gemini 3 Pro").first.click()
                await page.mouse.click(0, 0)

        # Отключение веб-поиска
        focus_btn = page.locator("button[aria-label='Источники'], button:has(use[xlink*='pplx-icon-world'])").first
        if await focus_btn.is_visible():
            await focus_btn.click()
            await page.wait_for_timeout(300)
            web_row = page.locator("div[role='menuitemcheckbox']").filter(has_text="Веб")
            web_switch = web_row.locator("button[role='switch']")
            if await web_switch.is_visible():
                if await web_switch.get_attribute("data-state") == "checked":
                    await web_switch.click()
            await page.mouse.click(0, 0)

        # Ввод промпта
        await send_log(task_id, f"✍️ Вставляю текст ({len(full_prompt)} символов)...", "info")
        await page.click("#ask-input")
        await page.fill("#ask-input", full_prompt)
        await page.wait_for_timeout(300)
        await page.keyboard.type(" ")
        await page.wait_for_timeout(500)
        
        submit_btn = page.locator("button:has(use[xlink*='pplx-icon-arrow-up']), button[aria-label='Submit']").last
        if await submit_btn.is_visible() and await submit_btn.is_enabled():
            await submit_btn.click()
        else:
            await page.keyboard.press("Enter")

        # Ожидание ответа
        await send_log(task_id, "⏳ Генерация ответа (может занять время)...", "warning")
        answer_locator = page.locator(".prose").last
        await answer_locator.wait_for(state="visible", timeout=600000)
        
        prev_len = 0
        html_content = ""
        stability_counter = 0
        REQUIRED_STABILITY = 6
        
        for i in range(600):
            await page.wait_for_timeout(2000)
            try:
                html_content = await answer_locator.inner_html()
            except:
                continue
            
            curr_len = len(html_content)
            if i % 15 == 0 and curr_len > 0:
                print(f"[{task_id[:8]}] ... {curr_len} символов")
            
            if curr_len == prev_len and curr_len > 100:
                stability_counter += 1
            else:
                stability_counter = 0
            
            if stability_counter >= REQUIRED_STABILITY:
                await send_log(task_id, "✅ Генерация стабильна и завершена.", "success")
                break
            prev_len = curr_len

        markdown_text = md(html_content, heading_style="ATX").strip()
        return markdown_text

    except Exception as e:
        await send_log(task_id, f"❌ Ошибка Playwright (Perplexity): {e}", "error")
        return None
    finally:
        if page:
            await page.close()


async def aistudio_worker(context, full_prompt, task_id):
    """Воркер для Google AI Studio"""
    await send_log(task_id, "🔵 [AI Studio] Запуск...", "info")
    page = await create_page_safe(context)
    if not page:
        await send_log(task_id, "❌ Не удалось создать страницу.", "error")
        return None
    
    try:
        await page.goto(AISTUDIO_URL, wait_until="domcontentloaded", timeout=60000)
        
        try:
            await page.wait_for_selector("textarea", state="visible", timeout=20000)
        except:
            await send_log(task_id, "⚠️ Поле ввода не найдено. Вы авторизованы?", "error")
            return None
        
        await page.wait_for_timeout(1500)
        
        await send_log(task_id, f"✍️ Вставка промпта...", "info")
        await page.evaluate('''(text) => {
            const el = document.querySelector('textarea.textarea') || document.querySelector('textarea');
            if(el) {
                el.value = text;
                el.dispatchEvent(new Event('input', {bubbles: true}));
                el.dispatchEvent(new Event('change', {bubbles: true}));
            }
        }''', full_prompt)
        
        await page.wait_for_timeout(1000)
        
        run_btn = page.locator("button[aria-label='Run'], button.run-button").first
        
        if await run_btn.is_visible() and await run_btn.is_enabled():
            await run_btn.click()
            await send_log(task_id, "🚀 Run нажат...", "info")
        else:
            await page.locator("textarea").press("Control+Enter")
            
        await send_log(task_id, "⏳ Ожидание ответа...", "warning")
        await page.wait_for_timeout(3000)
        
        prev_len = 0
        stability_counter = 0
        REQUIRED_STABILITY = 15
        current_html = ""
        
        for i in range(1200):
            await page.wait_for_timeout(2000)
            
            current_html = await page.evaluate('''() => {
                const chatContainer = document.querySelector('ms-autoscroll-container');
                if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
                
                let modelTurn = document.querySelector('ms-autoscroll-container ms-chat-turn:last-of-type');
                if (!modelTurn || modelTurn.querySelector('[data-turn-role="User"]')) {
                    const allModelTurns = Array.from(document.querySelectorAll('ms-chat-turn[data-turn-role="Model"]'));
                    if (allModelTurns.length > 0) modelTurn = allModelTurns[allModelTurns.length - 1];
                    else return "";
                }
                
                let fullHtml = "";
                let responseChunks = Array.from(modelTurn.querySelectorAll('ms-prompt-chunk'));
                
                if (responseChunks.length === 0) {
                    const turnContent = modelTurn.querySelector('.turn-content');
                    if (turnContent) fullHtml = turnContent.innerHTML;
                } else {
                    fullHtml = responseChunks.map(chunk => chunk.innerHTML).join('');
                }
                
                return fullHtml;
            }''')
            
            curr_len = len(current_html)
            
            if curr_len > 100 and curr_len == prev_len:
                stability_counter += 1
            elif curr_len != prev_len:
                stability_counter = 0
            
            if "===КОНЕЦ===" in current_html:
                if stability_counter >= 2:
                    await send_log(task_id, "✅ Маркер завершения найден.", "success")
                    break
            elif stability_counter >= REQUIRED_STABILITY:
                await send_log(task_id, "✅ Генерация стабильна.", "success")
                break
                
            prev_len = curr_len
        
        if current_html:
            final_text = md(current_html, heading_style="ATX").strip()
        else:
            final_text = ""

        return final_text
        
    except Exception as e:
        await send_log(task_id, f"❌ Ошибка AI Studio: {e}", "error")
        return None
    finally:
        if page:
            await page.close()


async def get_job_from_server():
    """Получает задачу с сервера"""
    url = f"{SERVER_URL}/api/agent/get-job"
    headers = {"X-Agent-API-Key": AGENT_API_KEY}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "new_job":
                    return data
    except Exception as e:
        pass
    return None


async def submit_job_to_server(job_id, results=None, error_message=None):
    """Отправляет результат на сервер"""
    url = f"{SERVER_URL}/api/agent/submit-job"
    headers = {"X-Agent-API-Key": AGENT_API_KEY}
    payload = {"job_id": job_id}
    
    if error_message:
        payload["error_message"] = error_message
        print(f"[{job_id[:8]}] 📤 Отправка ОШИБКИ: {error_message}")
    else:
        payload["results"] = results
        print(f"[{job_id[:8]}] 📤 Отправка результата")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            await client.post(url, json=payload, headers=headers)
            print(f"[{job_id[:8]}] ✅ Данные приняты сервером.")
    except Exception as e:
        print(f"[{job_id[:8]}] ❌ Не удалось отправить результат: {e}")


async def process_job(context, job):
    """Обрабатывает одну задачу"""
    job_id = job["job_id"]
    provider = job.get("provider", "perplexity")
    prompt = job.get("prompt", "")
    
    await send_log(job_id, f"📋 Получена задача: {provider}", "info")
    
    if provider == "perplexity":
        result = await perplexity_worker(context, prompt, job_id)
    elif provider == "google_ai_studio":
        result = await aistudio_worker(context, prompt, job_id)
    else:
        await send_log(job_id, f"❌ Неизвестный провайдер: {provider}", "error")
        await submit_job_to_server(job_id, error_message=f"Unknown provider: {provider}")
        return
    
    if result:
        await submit_job_to_server(job_id, results=result)
    else:
        await submit_job_to_server(job_id, error_message="Failed to get response")


async def main():
    """Главная функция агента"""
    print("=" * 50)
    print("  InLands Bridge Agent")
    print("=" * 50)
    print(f"Сервер: {SERVER_URL}")
    print(f"Интервал опроса: {POLLING_INTERVAL}с")
    print("=" * 50)
    
    ws_url = get_web_socket_debugger_url()
    if not ws_url:
        print("\n❌ ОШИБКА: Браузер не найден!")
        print("Убедитесь что браузер запущен с флагом --remote-debugging-port=9222")
        input("\nНажмите Enter для выхода...")
        return
    
    print(f"✅ Браузер найден: {ws_url[:50]}...")
    
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(ws_url)
        context = browser.contexts[0] if browser.contexts else await browser.new_context()
        
        print("\n🟢 InLands Bridge Agent запущен!")
        print("Ожидание задач...\n")
        
        active_tasks = []
        
        while True:
            # Очистка завершённых задач
            active_tasks = [t for t in active_tasks if not t.done()]
            
            # Получение новых задач
            if len(active_tasks) < MAX_CONCURRENT_JOBS:
                job = await get_job_from_server()
                if job:
                    task = asyncio.create_task(process_job(context, job))
                    active_tasks.append(task)
            
            await asyncio.sleep(POLLING_INTERVAL)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Агент остановлен.")

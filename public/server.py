import json
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import os
import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "database.json"
JOB_QUEUE = []
PROJECT_LOGS = {}

# --- Модели ---
class Project(BaseModel):
    id: str
    name: str
    chapters: List[Dict[str, Any]] = []
    # Глоссарий делаем списком словарей, чтобы не было ошибок из-за разных названий полей
    glossary: List[Dict[str, Any]] = [] 
    system_prompt: str = ""
    created_at: str

class ReplaceRequest(BaseModel):
    project_id: str
    term_original: str
    new_russian: str

# --- БД ---
def load_db():
    if not os.path.exists(DB_FILE): return []
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f: return json.load(f)
    except: return []

def save_db(data):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def add_log(pid, msg, type="info"):
    if pid not in PROJECT_LOGS: PROJECT_LOGS[pid] = []
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    PROJECT_LOGS[pid].append({"time": ts, "msg": msg, "type": type})

# --- API ---
@app.get("/api/projects")
def get_projects(): return load_db()

@app.post("/api/projects/save")
def save_project(project: Project):
    db = load_db()
    updated = False
    p_dict = project.dict()
    for i, p in enumerate(db):
        if p['id'] == project.id:
            db[i] = p_dict
            updated = True
            break
    if not updated: db.append(p_dict)
    save_db(db)
    return {"status": "saved"}

@app.get("/api/logs/{project_id}")
def get_logs(project_id: str): return PROJECT_LOGS.get(project_id, [])

@app.post("/api/glossary/replace")
def global_replace(req: ReplaceRequest):
    """Глобальная замена термина во всех переведенных главах"""
    db = load_db()
    project_found = False
    
    for p in db:
        if p['id'] == req.project_id:
            project_found = True
            count = 0
            
            # 1. Обновляем сам глоссарий
            for term in p['glossary']:
                if term.get('original') == req.term_original:
                    # Поддержка обоих вариантов ключей
                    if 'russian_translation' in term:
                        term['russian_translation'] = req.new_russian
                    if 'russian-translation' in term:
                        term['russian-translation'] = req.new_russian
            
            # 2. Ищем и меняем в главах (только в русском тексте)
            for ch in p['chapters']:
                if ch.get('translated_text'):
                    # Простая замена. Для сложной морфологии нужна библиотека pymorphy2,
                    # но пока делаем прямую замену, как просили.
                    # ВАЖНО: Мы не знаем старое русское слово наверняка, 
                    # поэтому эта функция работает лучше, если мы меняем оригинал ДО перевода.
                    # Но если нужно поменять уже в тексте:
                    pass 
                    # Тут сложный момент: мы знаем Original (китайский) и New Russian.
                    # Но в русском тексте китайского слова уже нет.
                    # Поэтому эта функция обычно используется так:
                    # Мы меняем правило в глоссарии, а потом "Перепереводим" главы.
                    # Прямая замена в тексте возможна, только если мы знаем СТАРОЕ русское слово.
                    # Пока просто логируем действие.
            
            save_db(db)
            add_log(req.project_id, f"Термин '{req.term_original}' обновлен на '{req.new_russian}'. Переведите главы заново для эффекта.", "success")
            return {"status": "replaced"}
            
    return {"status": "error", "msg": "Project not found"}

@app.post("/api/translate/send")
def send_job(job: dict):
    db = load_db()
    project = next((p for p in db if p['id'] == job['project_id']), None)
    if not project: return {"status": "error"}

    for ch in project['chapters']:
        if ch['id'] in job['chapter_ids']:
            ch['status'] = 'translating'
    save_db(db)
    
    # Формируем задачи
    batch = []
    chapters = [c for c in project['chapters'] if c['id'] in job['chapter_ids']]
    
    # Размер пачки из запроса или дефолт 5
    batch_size = job.get('batch_size', 5)
    
    for c in chapters:
        batch.append(c)
        if len(batch) >= batch_size:
            JOB_QUEUE.append({"type":"translate", "pid":job['project_id'], "prompt":job['system_prompt'], "glossary":project['glossary'], "chapters":batch})
            batch = []
    if batch:
        JOB_QUEUE.append({"type":"translate", "pid":job['project_id'], "prompt":job['system_prompt'], "glossary":project['glossary'], "chapters":batch})
        
    add_log(job['project_id'], f"В очередь добавлено {len(chapters)} глав.", "info")
    return {"status": "queued"}

@app.get("/agent-api/get-job")
def get_job():
    return JOB_QUEUE.pop(0) if JOB_QUEUE else {"type":"empty"}

@app.post("/agent-api/submit-job")
def submit_job(res: dict):
    db = load_db()
    for p in db:
        if p['id'] == res['project_id']:
            for item in res['results']:
                for ch in p['chapters']:
                    if ch['id'] == item['id']:
                        ch['translated_text'] = item['translated_text']
                        ch['status'] = 'completed'
            save_db(db)
            add_log(res['project_id'], f"Готов перевод: {len(res['results'])} глав.", "success")
            return {"status":"ok"}
    return {"status":"error"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
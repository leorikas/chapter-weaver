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
PUBLISH_QUEUE = []
PROJECT_LOGS = {}

# --- Модели ---
class Project(BaseModel):
    id: str
    name: str
    chapters: List[Dict[str, Any]] = []
    glossary: List[Dict[str, Any]] = [] 
    system_prompt: str = ""
    created_at: str
    rulate_settings: Optional[Dict[str, Any]] = None

class ReplaceRequest(BaseModel):
    project_id: str
    term_original: str
    new_russian: str

class PublishJobRequest(BaseModel):
    project_id: str
    chapter_ids: List[str]
    book_url: str
    chapter_status: str = "ready"
    delayed_chapter: bool = True
    subscription_only: bool = True
    add_as_translation: bool = True

class RulateSettingsRequest(BaseModel):
    project_id: str
    book_url: str
    chapter_status: str = "ready"
    delayed_chapter: bool = True
    subscription_only: bool = True
    add_as_translation: bool = True

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
            
            for term in p['glossary']:
                if term.get('original') == req.term_original:
                    if 'russian_translation' in term:
                        term['russian_translation'] = req.new_russian
                    if 'russian-translation' in term:
                        term['russian-translation'] = req.new_russian
            
            save_db(db)
            add_log(req.project_id, f"Термин '{req.term_original}' обновлен на '{req.new_russian}'.", "success")
            return {"status": "replaced"}
            
    return {"status": "error", "msg": "Project not found"}

# --- API настроек Rulate ---
@app.get("/api/rulate/settings/{project_id}")
def get_rulate_settings(project_id: str):
    db = load_db()
    for p in db:
        if p['id'] == project_id:
            return p.get('rulate_settings', {
                "book_url": "",
                "chapter_status": "ready",
                "delayed_chapter": True,
                "subscription_only": True,
                "add_as_translation": True
            })
    return {"error": "Project not found"}

@app.post("/api/rulate/settings")
def save_rulate_settings(req: RulateSettingsRequest):
    db = load_db()
    for p in db:
        if p['id'] == req.project_id:
            p['rulate_settings'] = {
                "book_url": req.book_url,
                "chapter_status": req.chapter_status,
                "delayed_chapter": req.delayed_chapter,
                "subscription_only": req.subscription_only,
                "add_as_translation": req.add_as_translation
            }
            save_db(db)
            add_log(req.project_id, f"Настройки Rulate сохранены", "success")
            return {"status": "saved"}
    return {"status": "error", "msg": "Project not found"}

# --- API перевода ---
@app.post("/api/translate/send")
def send_job(job: dict):
    db = load_db()
    project = next((p for p in db if p['id'] == job['project_id']), None)
    if not project: return {"status": "error"}

    for ch in project['chapters']:
        if ch['id'] in job['chapter_ids']:
            ch['status'] = 'translating'
    save_db(db)
    
    batch = []
    chapters = [c for c in project['chapters'] if c['id'] in job['chapter_ids']]
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

# --- API публикации на Rulate ---
@app.post("/api/publish/send")
def send_publish_job(req: PublishJobRequest):
    db = load_db()
    chapters_to_publish = []
    
    for p in db:
        if p['id'] == req.project_id:
            for ch in p['chapters']:
                if ch['id'] in req.chapter_ids:
                    ch['status'] = 'publishing'
                    chapters_to_publish.append({
                        "id": ch['id'],
                        "number": ch.get('number', 0),
                        "title": ch['title'],
                        "translated_text": ch.get('translated_text', '')
                    })
            save_db(db)
            break
    
    if not chapters_to_publish:
        return {"status": "error", "msg": "No chapters found"}
    
    PUBLISH_QUEUE.append({
        "type": "publish",
        "project_id": req.project_id,
        "book_url": req.book_url,
        "settings": {
            "chapter_status": req.chapter_status,
            "delayed_chapter": req.delayed_chapter,
            "subscription_only": req.subscription_only,
            "add_as_translation": req.add_as_translation
        },
        "chapters": chapters_to_publish
    })
    
    add_log(req.project_id, f"Публикация: {len(chapters_to_publish)} глав → {req.book_url}", "info")
    return {"status": "queued", "count": len(chapters_to_publish)}

@app.get("/api/publish/status/{project_id}")
def get_publish_status(project_id: str):
    pending = [j for j in PUBLISH_QUEUE if j.get("project_id") == project_id]
    return {"pending_jobs": len(pending), "total_queue": len(PUBLISH_QUEUE)}

# --- Agent API ---
@app.get("/agent-api/get-job")
def get_job():
    # Приоритет: публикация, потом перевод
    if PUBLISH_QUEUE:
        return PUBLISH_QUEUE.pop(0)
    if JOB_QUEUE:
        return JOB_QUEUE.pop(0)
    return {"type": "empty"}

@app.post("/agent-api/submit-job")
def submit_job(res: dict):
    db = load_db()
    job_type = res.get("type", "translate")
    
    if job_type == "translate":
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
    
    elif job_type == "publish":
        for p in db:
            if p['id'] == res.get('project_id'):
                for ch in p['chapters']:
                    if ch['id'] == res.get('chapter_id'):
                        if res.get('success'):
                            ch['status'] = 'published'
                            ch['rulate_chapter_id'] = res.get('rulate_chapter_id')
                            add_log(res['project_id'], f"Опубликовано: {ch['title']}", "success")
                        else:
                            ch['status'] = 'completed'
                            add_log(res['project_id'], f"Ошибка публикации: {ch['title']} - {res.get('error')}", "error")
                save_db(db)
                return {"status": "ok"}
    
    return {"status":"error"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "queues": {"translate": len(JOB_QUEUE), "publish": len(PUBLISH_QUEUE)}}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

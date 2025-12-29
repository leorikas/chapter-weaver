// API клиент для работы с локальным Python сервером
import { RulateSettings, PublishJobRequest } from '@/types';

const API_BASE = 'http://127.0.0.1:8000';

export interface ApiProject {
  id: string;
  name: string;
  chapters: ApiChapter[];
  glossary: GlossaryEntry[];
  system_prompt: string;
  created_at: string;
  rulate_settings?: RulateSettings;
}

export interface ApiChapter {
  id: string;
  title: string;
  original_text?: string;
  translated_text?: string;
  status: 'pending' | 'translating' | 'completed' | 'publishing' | 'published';
  rulate_chapter_id?: string;
}

export interface GlossaryEntry {
  original: string;
  'english-translation': string;
  'russian-translation': string;
  'alt-russian-translation': string;
  gender: 'masc' | 'femn' | 'neut';
}

export interface LogEntry {
  time: string;
  msg: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface TranslateJobRequest {
  project_id: string;
  chapter_ids: string[];
  system_prompt: string;
  batch_size?: number;
  provider?: 'google' | 'local_bridge' | 'openrouter';
  target_service?: 'perplexity' | 'google_ai_studio';
  model?: string;
  chapters_content?: string;
  glossary?: GlossaryEntry[];
}

export interface TranslateJobResponse {
  status: string;
  job_id?: string;
  message?: string;
}

// Получить все проекты
export async function getProjects(): Promise<ApiProject[]> {
  const res = await fetch(`${API_BASE}/api/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

// Сохранить проект
export async function saveProject(project: ApiProject): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/projects/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to save project');
  return res.json();
}

// Получить логи проекта
export async function getLogs(projectId: string): Promise<LogEntry[]> {
  const res = await fetch(`${API_BASE}/api/logs/${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

// Отправить задачу на перевод
export async function sendTranslateJob(job: TranslateJobRequest): Promise<TranslateJobResponse> {
  const res = await fetch(`${API_BASE}/api/translate/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to send translate job: ${errorText}`);
  }
  return res.json();
}

// Получить статус задачи
export async function getTranslateJobStatus(jobId: string): Promise<{ status: string; progress?: number; result?: any }> {
  const res = await fetch(`${API_BASE}/api/translate/status/${jobId}`);
  if (!res.ok) throw new Error('Failed to get job status');
  return res.json();
}

// Обновить глоссарий проекта
export async function updateProjectGlossary(
  projectId: string, 
  glossary: GlossaryEntry[]
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/glossary`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ glossary }),
  });
  if (!res.ok) throw new Error('Failed to update glossary');
  return res.json();
}

// Глобальная замена термина
export async function replaceGlossaryTerm(
  projectId: string,
  termOriginal: string,
  newRussian: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/glossary/replace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      term_original: termOriginal,
      new_russian: newRussian,
    }),
  });
  if (!res.ok) throw new Error('Failed to replace term');
  return res.json();
}

// Agent API endpoints
export async function getAgentJob(): Promise<any> {
  const res = await fetch(`${API_BASE}/agent-api/get-job`);
  if (!res.ok) throw new Error('Failed to get job');
  return res.json();
}

export async function submitAgentJob(result: {
  project_id: string;
  results: { id: string; translated_text: string }[];
}): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/agent-api/submit-job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });
  if (!res.ok) throw new Error('Failed to submit job');
  return res.json();
}

// Проверка доступности сервера
export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Получить завершённые переводы для проекта
export interface CompletedTranslation {
  chapter_id: string;
  translated_text: string;
  glossary?: GlossaryEntry[];
}

export async function getCompletedTranslations(projectId: string): Promise<CompletedTranslation[]> {
  try {
    const res = await fetch(`${API_BASE}/api/translate/completed/${projectId}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// Подтвердить получение перевода
export async function acknowledgeTranslation(projectId: string, chapterIds: string[]): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/translate/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, chapter_ids: chapterIds }),
    });
  } catch {
    // Игнорируем ошибки
  }
}

// === Rulate Settings API ===

export async function getRulateSettings(projectId: string): Promise<RulateSettings> {
  try {
    const res = await fetch(`${API_BASE}/api/rulate/settings/${projectId}`);
    if (res.ok) {
      const data = await res.json();
      return {
        bookUrl: data.book_url || '',
        chapterStatus: data.chapter_status || 'ready',
        delayedChapter: data.delayed_chapter ?? true,
        subscriptionOnly: data.subscription_only ?? true,
        addAsTranslation: data.add_as_translation ?? true,
      };
    }
  } catch {
    // Return defaults
  }
  return {
    bookUrl: '',
    chapterStatus: 'ready',
    delayedChapter: true,
    subscriptionOnly: true,
    addAsTranslation: true,
  };
}

export async function saveRulateSettings(projectId: string, settings: RulateSettings): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/rulate/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        book_url: settings.bookUrl,
        chapter_status: settings.chapterStatus,
        delayed_chapter: settings.delayedChapter,
        subscription_only: settings.subscriptionOnly,
        add_as_translation: settings.addAsTranslation,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// === Publish API ===

export async function sendPublishJob(request: PublishJobRequest): Promise<{ status: string; count?: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/publish/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (res.ok) {
      return await res.json();
    }
    return { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

export async function getPublishStatus(projectId: string): Promise<{ pending_jobs: number; total_queue: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/publish/status/${projectId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Ignore
  }
  return { pending_jobs: 0, total_queue: 0 };
}

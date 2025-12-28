import { Chapter } from '@/types';
import { GlossaryEntry, sendTranslateJob } from './api';

export interface TranslationSettings {
  provider: 'google' | 'local_bridge' | 'openrouter';
  targetService?: 'perplexity' | 'google_ai_studio';
  model: string;
  batchSize: number;
  cleanAfterTranslation: boolean;
  convertMarkdown: boolean;
}

export interface TranslationBatch {
  chapterIds: string[];
  chapters: Chapter[];
  glossary: GlossaryEntry[];
}

// Форматирует главы для отправки на перевод с маркерами
export function formatChaptersForTranslation(chapters: Chapter[]): string {
  return chapters.map((chapter, index) => {
    const chapterContent = [
      `===CHAPTER-START|ID:${chapter.id}|===`,
      chapter.originalText || '',
      `===CHAPTER-END|ID:${chapter.id}|===`,
    ].join('\n');
    return chapterContent;
  }).join('\n');
}

// Форматирует глоссарий для отправки
export function formatGlossaryForTranslation(glossary: GlossaryEntry[]): string {
  if (glossary.length === 0) return '';
  
  return `===GLOSSARY-JSON===\n${JSON.stringify(glossary, null, 2)}\n===КОНЕЦ===`;
}

// Полный формат сообщения для отправки на перевод
export function createTranslationPayload(
  chapters: Chapter[], 
  glossary: GlossaryEntry[], 
  systemPrompt: string
): { content: string; systemPrompt: string } {
  const chaptersText = formatChaptersForTranslation(chapters);
  const glossaryText = formatGlossaryForTranslation(glossary);
  
  const content = glossaryText 
    ? `${chaptersText}\n${glossaryText}`
    : chaptersText;
  
  return { content, systemPrompt };
}

// Разбивает главы на пачки по batchSize
export function splitIntoBatches(chapters: Chapter[], batchSize: number): Chapter[][] {
  const batches: Chapter[][] = [];
  for (let i = 0; i < chapters.length; i += batchSize) {
    batches.push(chapters.slice(i, i + batchSize));
  }
  return batches;
}

// Извлекает глоссарий из ответа перевода
export function extractGlossaryFromResponse(responseText: string): GlossaryEntry[] {
  const glossaryMatch = responseText.match(/===GLOSSARY-JSON===\s*([\s\S]*?)\s*===КОНЕЦ===/);
  if (!glossaryMatch) return [];
  
  try {
    const glossaryJson = glossaryMatch[1].trim();
    const parsed = JSON.parse(glossaryJson);
    
    if (!Array.isArray(parsed)) return [];
    
    return parsed.map((item: any) => ({
      original: item.original || '',
      'english-translation': item['english-translation'] || '',
      'russian-translation': item['russian-translation'] || '',
      'alt-russian-translation': item['alt-russian-translation'] || 'Нет',
      gender: item.gender || 'neut',
    }));
  } catch (error) {
    console.error('Failed to parse glossary from response:', error);
    return [];
  }
}

// Извлекает переведенные главы из ответа
export function extractChaptersFromResponse(responseText: string): { id: string; translatedText: string }[] {
  const chapters: { id: string; translatedText: string }[] = [];
  const chapterRegex = /===CHAPTER-START\|ID:([^|]+)\|===([\s\S]*?)===CHAPTER-END\|ID:\1\|===/g;
  
  let match;
  while ((match = chapterRegex.exec(responseText)) !== null) {
    const id = match[1];
    const content = match[2].trim();
    chapters.push({ id, translatedText: content });
  }
  
  return chapters;
}

// Объединяет новые термины глоссария с существующими (без дубликатов по original)
export function mergeGlossaries(existing: GlossaryEntry[], newEntries: GlossaryEntry[]): GlossaryEntry[] {
  const existingOriginals = new Set(existing.map(e => e.original));
  const uniqueNewEntries = newEntries.filter(entry => !existingOriginals.has(entry.original));
  
  return [...existing, ...uniqueNewEntries];
}

// Отправляет пакет глав на перевод
export async function sendBatchForTranslation(
  projectId: string,
  chapters: Chapter[],
  glossary: GlossaryEntry[],
  systemPrompt: string,
  settings: TranslationSettings
): Promise<void> {
  const chapterIds = chapters.map(c => c.id);
  
  await sendTranslateJob({
    project_id: projectId,
    chapter_ids: chapterIds,
    system_prompt: systemPrompt,
    batch_size: settings.batchSize,
  });
}

// Главная функция запуска перевода
export async function startTranslation(
  projectId: string,
  chapters: Chapter[],
  glossary: GlossaryEntry[],
  systemPrompt: string,
  settings: TranslationSettings,
  onBatchSent?: (batchIndex: number, totalBatches: number) => void,
  onError?: (error: Error, batchIndex: number) => void
): Promise<void> {
  const batches = splitIntoBatches(chapters, settings.batchSize);
  
  for (let i = 0; i < batches.length; i++) {
    try {
      await sendBatchForTranslation(
        projectId,
        batches[i],
        glossary,
        systemPrompt,
        settings
      );
      
      onBatchSent?.(i + 1, batches.length);
    } catch (error) {
      onError?.(error as Error, i);
      throw error;
    }
  }
}

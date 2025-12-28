import { Chapter } from '@/types';

/**
 * Парсит TXT файл и разделяет на главы по паттерну 第X章
 */
export function parseChaptersFromText(
  text: string, 
  projectId: string,
  startNumber: number = 1
): Chapter[] {
  const chapters: Chapter[] = [];
  
  // Паттерн для поиска глав: 第X章 (с возможным заголовком)
  // Также поддерживает: 第一章, 第二章 и т.д. (китайские цифры)
  const chapterPattern = /^(第[一二三四五六七八九十百千\d]+章[^\n]*)/gm;
  
  const matches = text.matchAll(chapterPattern);
  const matchArray = Array.from(matches);
  
  if (matchArray.length === 0) {
    // Если нет глав, возвращаем весь текст как одну главу
    return [{
      id: `ch_${Date.now()}_1`,
      projectId,
      number: startNumber,
      title: 'Глава без названия',
      originalText: text.trim(),
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    }];
  }
  
  for (let i = 0; i < matchArray.length; i++) {
    const match = matchArray[i];
    const title = match[1].trim();
    const startIndex = match.index!;
    const endIndex = i < matchArray.length - 1 
      ? matchArray[i + 1].index! 
      : text.length;
    
    const content = text.slice(startIndex, endIndex).trim();
    
    chapters.push({
      id: `ch_${Date.now()}_${i + 1}`,
      projectId,
      number: startNumber + i,
      title,
      originalText: content,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    });
  }
  
  return chapters;
}

/**
 * Находит все китайские иероглифы в тексте
 */
export function findChineseCharacters(text: string): Array<{
  char: string;
  position: number;
  context: string;
}> {
  const results: Array<{ char: string; position: number; context: string }> = [];
  
  // Паттерн для китайских иероглифов (CJK Unified Ideographs)
  const chinesePattern = /[\u4e00-\u9fff]/g;
  
  let match;
  while ((match = chinesePattern.exec(text)) !== null) {
    const position = match.index;
    const start = Math.max(0, position - 15);
    const end = Math.min(text.length, position + 15);
    const context = (start > 0 ? '...' : '') + 
                   text.slice(start, end).replace(/\n/g, ' ') + 
                   (end < text.length ? '...' : '');
    
    results.push({
      char: match[0],
      position,
      context,
    });
  }
  
  return results;
}

/**
 * Проверяет, содержит ли текст китайские иероглифы
 */
export function hasChineseCharacters(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * Подсчитывает количество китайских иероглифов в тексте
 */
export function countChineseCharacters(text: string): number {
  const matches = text.match(/[\u4e00-\u9fff]/g);
  return matches ? matches.length : 0;
}

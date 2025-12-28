export interface GlossaryTerm {
  id: string;
  original: string;
  englishTranslation: string;
  russianTranslation: string;
  altRussianTranslation: string;
  gender: 'masc' | 'femn' | 'neut' | null;
}

/**
 * Формат JSON для экспорта/импорта глоссария
 */
export interface GlossaryJsonEntry {
  original: string;
  'english-translation': string;
  'russian-translation': string;
  'alt-russian-translation': string;
  gender: 'masc' | 'femn' | 'neut';
}

/**
 * Экспортирует глоссарий в JSON строку
 */
export function exportGlossaryToJson(terms: GlossaryTerm[]): string {
  const jsonEntries: GlossaryJsonEntry[] = terms.map(term => ({
    original: term.original,
    'english-translation': term.englishTranslation,
    'russian-translation': term.russianTranslation,
    'alt-russian-translation': term.altRussianTranslation || 'Нет',
    gender: term.gender || 'neut',
  }));
  return JSON.stringify(jsonEntries, null, 2);
}

/**
 * Импортирует глоссарий из JSON строки
 */
export function importGlossaryFromJson(jsonString: string): GlossaryTerm[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid glossary format: expected array');
    }
    
    return parsed.map((item: any, index: number) => ({
      id: `imported_${Date.now()}_${index}`,
      original: item.original || '',
      englishTranslation: item['english-translation'] || item.englishTranslation || '',
      russianTranslation: item['russian-translation'] || item.russianTranslation || '',
      altRussianTranslation: item['alt-russian-translation'] || item.altRussianTranslation || '',
      gender: item.gender || null,
    }));
  } catch (error) {
    throw new Error('Failed to parse glossary JSON');
  }
}

/**
 * Скачивает глоссарий как JSON файл
 */
export function downloadGlossary(terms: GlossaryTerm[], filename: string = 'glossary.json') {
  const json = exportGlossaryToJson(terms);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Читает файл глоссария
 */
export function readGlossaryFile(file: File): Promise<GlossaryTerm[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const terms = importGlossaryFromJson(content);
        resolve(terms);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

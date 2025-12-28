export interface GlossaryTerm {
  id: string;
  original: string;
  english: string;
  russian: string;
  alternatives: string;
  isProperName: boolean;
  gender: 'M' | 'F' | 'N' | null;
  animacy: 'animate' | 'inanimate' | null;
  number: 'singular' | 'plural' | null;
  description: string;
}

/**
 * Экспортирует глоссарий в JSON строку
 */
export function exportGlossaryToJson(terms: GlossaryTerm[]): string {
  return JSON.stringify(terms, null, 2);
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
      id: item.id || `imported_${Date.now()}_${index}`,
      original: item.original || '',
      english: item.english || '',
      russian: item.russian || '',
      alternatives: item.alternatives || '',
      isProperName: item.isProperName || false,
      gender: item.gender || null,
      animacy: item.animacy || null,
      number: item.number || null,
      description: item.description || '',
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

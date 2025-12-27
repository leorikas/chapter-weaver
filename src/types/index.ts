export interface Project {
  id: string;
  title: string;
  rulateUrl?: string;
  sourceUrl?: string;
  createdAt: string;
  status: 'in_progress' | 'completed' | 'paused';
  totalChapters: number;
  translatedChapters: number;
  views: number;
  bookmarks: number;
  income: number;
}

export interface Chapter {
  id: string;
  projectId: string;
  number: number;
  title: string;
  originalText?: string;
  translatedText?: string;
  status: 'pending' | 'translating' | 'translated' | 'published';
  createdAt: string;
}

export interface TranslationSettings {
  provider: 'google' | 'local_bridge' | 'openrouter';
  targetService?: 'perplexity' | 'google_ai_studio';
  model: string;
  batchSize: number;
  cleanAfterTranslation: boolean;
  convertMarkdownToHtml: boolean;
}

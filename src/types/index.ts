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
  rulateSettings?: RulateSettings;
}

export interface Chapter {
  id: string;
  projectId: string;
  number: number;
  title: string;
  originalText?: string;
  translatedText?: string;
  status: 'pending' | 'translating' | 'translated' | 'publishing' | 'published';
  createdAt: string;
  rulateChapterId?: string;
}

export interface TranslationSettings {
  provider: 'google' | 'local_bridge' | 'openrouter';
  targetService?: 'perplexity' | 'google_ai_studio';
  model: string;
  batchSize: number;
  cleanAfterTranslation: boolean;
  convertMarkdownToHtml: boolean;
}

export interface RulateSettings {
  bookUrl: string;
  chapterStatus: 'ready' | 'draft';
  delayedChapter: boolean;
  subscriptionOnly: boolean;
  addAsTranslation: boolean;
}

export interface PublishJobRequest {
  project_id: string;
  chapter_ids: string[];
  book_url: string;
  chapter_status: string;
  delayed_chapter: boolean;
  subscription_only: boolean;
  add_as_translation: boolean;
}

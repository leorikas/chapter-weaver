import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockProjects, mockChapters } from '@/lib/mockData';
import { ChapterList } from '@/components/ChapterList';
import { ActionBar } from '@/components/ActionBar';
import { BulkUploadDialog } from '@/components/BulkUploadDialog';
import { TranslateDialog } from '@/components/TranslateDialog';
import { GlossaryDialog } from '@/components/GlossaryDialog';
import { FindHieroglyphsDialog } from '@/components/FindHieroglyphsDialog';
import { LogsPanel, LogEntry } from '@/components/LogsPanel';
import { ServerStatusIndicator } from '@/components/ServerStatusIndicator';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  Filter, 
  CheckSquare, 
  Languages, 
  Sparkles, 
  Settings, 
  AlertTriangle,
  ArrowUpDown,
  Upload,
  Plus,
  Download,
  RefreshCw,
  BookOpen,
  ScrollText
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Chapter } from '@/types';
import { toast } from 'sonner';
import { 
  getLogs, 
  GlossaryEntry, 
  sendTranslateJob, 
  getCompletedTranslations, 
  acknowledgeTranslation 
} from '@/lib/api';
import { 
  TranslationSettings, 
  splitIntoBatches, 
  formatChaptersForTranslation,
  formatGlossaryForTranslation,
  extractGlossaryFromResponse,
  mergeGlossaries,
} from '@/lib/translationService';

// Стандартный системный промпт
const DEFAULT_SYSTEM_PROMPT = `Ты — профессиональный переводчик китайских веб-романов на русский язык. Твоя задача:

1. Переводи текст естественно и литературно, сохраняя стиль оригинала
2. Используй глоссарий для перевода имён, названий и терминов
3. Сохраняй форматирование: **жирный**, *курсив*, диалоги
4. Не добавляй свои комментарии или пояснения
5. Сохраняй маркеры глав: ===CHAPTER-START|ID:X|=== и ===CHAPTER-END|ID:X|===
6. После перевода добавь новые термины в глоссарий в формате JSON`;

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = mockProjects.find(p => p.id === id);
  const [chapters, setChapters] = useState<Chapter[]>(mockChapters.filter(c => c.projectId === id));
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'translated' | 'pending'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isFindHieroglyphsOpen, setIsFindHieroglyphsOpen] = useState(false);
  const [isLogsPanelOpen, setIsLogsPanelOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [chaptersWithHieroglyphs, setChaptersWithHieroglyphs] = useState<string[]>([]);

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Проект не найден</p>
      </div>
    );
  }

  const filteredChapters = chapters.filter(ch => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'translated') return ch.status === 'translated';
    return ch.status === 'pending';
  });

  const selectedChapterNumbers = selectedChapters
    .map(id => chapters.find(c => c.id === id)?.number || 0)
    .filter(n => n > 0);

  const handleSelectAll = () => {
    if (selectedChapters.length === filteredChapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(filteredChapters.map(c => c.id));
    }
  };

  const handleUpload = (newChapters: Chapter[]) => {
    setChapters([...chapters, ...newChapters]);
    toast.success(`Добавлено ${newChapters.length} глав`);
  };

  const fetchLogs = useCallback(async () => {
    if (!id) return;
    try {
      const serverLogs = await getLogs(id);
      const formattedLogs: LogEntry[] = serverLogs.map((log, index) => ({
        id: `log_${index}`,
        timestamp: log.time,
        message: log.msg,
        type: log.type,
      }));
      setLogs(formattedLogs);
    } catch (error) {
      console.log('Server not available, using empty logs');
    }
  }, [id]);

  useEffect(() => {
    if (isLogsPanelOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [isLogsPanelOpen, fetchLogs]);

  // Автоматическое получение завершённых переводов
  const fetchCompletedTranslations = useCallback(async () => {
    if (!id) return;
    
    try {
      const completed = await getCompletedTranslations(id);
      
      if (completed.length > 0) {
        const updatedChapterIds: string[] = [];
        let newGlossaryEntries: GlossaryEntry[] = [];
        
        setChapters(prev => prev.map(chapter => {
          const translation = completed.find(c => c.chapter_id === chapter.id);
          if (translation) {
            updatedChapterIds.push(chapter.id);
            
            // Извлекаем глоссарий из перевода
            if (translation.glossary) {
              newGlossaryEntries = [...newGlossaryEntries, ...translation.glossary];
            }
            
            return {
              ...chapter,
              translatedText: translation.translated_text,
              status: 'translated' as const,
            };
          }
          return chapter;
        }));
        
        // Обновляем глоссарий новыми терминами
        if (newGlossaryEntries.length > 0) {
          setGlossary(prev => mergeGlossaries(prev, newGlossaryEntries));
          toast.success(`Добавлено ${newGlossaryEntries.length} новых терминов в глоссарий`);
        }
        
        // Подтверждаем получение
        if (updatedChapterIds.length > 0) {
          await acknowledgeTranslation(id, updatedChapterIds);
          toast.success(`Получен перевод ${updatedChapterIds.length} глав`);
        }
      }
    } catch (error) {
      console.log('Failed to fetch completed translations:', error);
    }
  }, [id]);

  // Проверяем завершённые переводы каждые 5 секунд
  useEffect(() => {
    fetchCompletedTranslations();
    const interval = setInterval(fetchCompletedTranslations, 5000);
    return () => clearInterval(interval);
  }, [fetchCompletedTranslations]);

  const handleClearLogs = () => {
    setLogs([]);
    toast.success('Логи очищены');
  };

  const handleTranslate = async (settings: TranslationSettings) => {
    if (selectedChapters.length === 0) {
      toast.error('Выберите главы для перевода');
      return;
    }
    
    setIsTranslating(true);
    
    try {
      // Получаем выбранные главы
      const chaptersToTranslate = chapters.filter(c => selectedChapters.includes(c.id));
      
      // Разбиваем на пачки
      const batches = splitIntoBatches(chaptersToTranslate, settings.batchSize);
      
      toast.info(`Отправка ${batches.length} пачек на перевод...`);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Форматируем контент глав
        const chaptersContent = formatChaptersForTranslation(batch);
        
        // Глоссарий для текущей пачки (используем весь глоссарий проекта)
        const glossaryContent = formatGlossaryForTranslation(glossary);
        
        const fullContent = glossaryContent 
          ? `${chaptersContent}\n${glossaryContent}`
          : chaptersContent;
        
        // Отправляем пачку на перевод
        await sendTranslateJob({
          project_id: id!,
          chapter_ids: batch.map(c => c.id),
          system_prompt: systemPrompt,
          batch_size: settings.batchSize,
          provider: settings.provider,
          target_service: settings.targetService,
          model: settings.model,
          chapters_content: fullContent,
          glossary: glossary,
        });
        
        // Обновляем статус глав на "translating"
        setChapters(prev => prev.map(c => 
          batch.some(b => b.id === c.id) 
            ? { ...c, status: 'translating' as const }
            : c
        ));
        
        toast.success(`Пачка ${i + 1}/${batches.length} отправлена`);
      }
      
      toast.success(`Все ${batches.length} пачек отправлены на перевод`);
      setIsTranslateOpen(false);
      setSelectedChapters([]);
      
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(`Ошибка перевода: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDelete = () => {
    setChapters(chapters.filter(c => !selectedChapters.includes(c.id)));
    setSelectedChapters([]);
    toast.success('Главы удалены');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Logs Panel */}
      {isLogsPanelOpen && (
        <LogsPanel
          projectTitle={project.title}
          logs={logs}
          onClearLogs={handleClearLogs}
          onClose={() => setIsLogsPanelOpen(false)}
        />
      )}
      
      <div className="flex-1 p-6 lg:p-8 pb-24">
        <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <div className="flex items-center gap-2">
            <ServerStatusIndicator />
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Импорт
            </Button>
          </div>
        </div>

        {/* Project Info */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{project.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Создан: {project.createdAt}</span>
            <Button variant="ghost" size="sm" className="gap-1">
              <RefreshCw className="w-4 h-4" />
              Check
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-foreground">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Список глав</span>
            </div>

            <div className="h-6 w-px bg-border" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  {filterStatus === 'all' ? 'Все' : filterStatus === 'translated' ? 'Переведённые' : 'Непереведённые'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>Все</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('translated')}>Переведённые</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('pending')}>Непереведённые</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant={selectedChapters.length === filteredChapters.length ? 'default' : 'secondary'} 
              size="sm"
              onClick={handleSelectAll}
            >
              <CheckSquare className="w-4 h-4" />
            </Button>

            <div className="h-6 w-px bg-border" />

            <Button 
              variant="gradient" 
              size="sm"
              onClick={() => setIsTranslateOpen(true)}
              disabled={selectedChapters.length === 0}
            >
              <Languages className="w-4 h-4 mr-2" />
              Перевести
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="warning" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Очистка
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Очистить перевод</DropdownMenuItem>
                <DropdownMenuItem>Удалить форматирование</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="secondary" size="icon">
              <Settings className="w-4 h-4" />
            </Button>

            <Button 
              variant="secondary" 
              size="icon"
              onClick={() => setIsFindHieroglyphsOpen(true)}
              disabled={selectedChapters.length === 0}
              title="Найти иероглифы в переводе"
            >
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </Button>

            <Button variant="secondary" size="icon">
              <ArrowUpDown className="w-4 h-4" />
            </Button>

            <Button 
              variant="accent" 
              size="icon"
              onClick={() => setIsUploadOpen(true)}
            >
              <Upload className="w-4 h-4" />
            </Button>

            <Button 
              variant="secondary" 
              size="icon"
              onClick={() => setIsGlossaryOpen(true)}
              title="Открыть глоссарий проекта"
              className="bg-warning/20 hover:bg-warning/30"
            >
              <BookOpen className="w-4 h-4 text-warning" />
            </Button>

            <Button 
              variant={isLogsPanelOpen ? 'default' : 'secondary'} 
              size="icon"
              onClick={() => setIsLogsPanelOpen(!isLogsPanelOpen)}
              title="Логи перевода"
            >
              <ScrollText className="w-4 h-4" />
            </Button>

            <Button variant="secondary" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chapters */}
        {filteredChapters.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Главы не найдены</p>
            <Button 
              variant="gradient" 
              className="mt-4"
              onClick={() => setIsUploadOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Загрузить файл
            </Button>
          </div>
        ) : (
          <ChapterList
            chapters={filteredChapters}
            selectedChapters={selectedChapters}
            onSelectionChange={setSelectedChapters}
            chaptersWithHieroglyphs={chaptersWithHieroglyphs}
          />
        )}

        {/* Action Bar */}
        <ActionBar
          selectedCount={selectedChapters.length}
          onRename={() => toast.info('Переименование')}
          onDownload={() => toast.success('Скачивание начато')}
          onDelete={handleDelete}
        />

        {/* Dialogs */}
        <BulkUploadDialog
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onUpload={handleUpload}
          projectId={id!}
          existingChaptersCount={chapters.length}
        />

        <TranslateDialog
          open={isTranslateOpen}
          onOpenChange={setIsTranslateOpen}
          selectedCount={selectedChapters.length}
          selectedChapterNumbers={selectedChapterNumbers}
          onTranslate={handleTranslate}
          isTranslating={isTranslating}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          glossary={glossary}
          onGlossaryChange={setGlossary}
        />

        <GlossaryDialog
          open={isGlossaryOpen}
          onOpenChange={setIsGlossaryOpen}
          projectTitle={project.title}
        />

        <FindHieroglyphsDialog
          open={isFindHieroglyphsOpen}
          onOpenChange={setIsFindHieroglyphsOpen}
          selectedChapters={selectedChapters}
          chapters={chapters}
          onChaptersWithHieroglyphsFound={setChaptersWithHieroglyphs}
        />
        </div>
      </div>
    </div>
  );
}

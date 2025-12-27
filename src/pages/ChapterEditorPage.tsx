import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockChapters, mockProjects } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlossaryDialog } from '@/components/GlossaryDialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Save,
  Pause,
  PenLine,
  BookOpen,
  Sparkles,
  Languages,
  CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';

export default function ChapterEditorPage() {
  const { projectId, chapterId } = useParams();
  const navigate = useNavigate();
  
  const project = mockProjects.find(p => p.id === projectId);
  const chapter = mockChapters.find(c => c.id === chapterId);
  const allChapters = mockChapters.filter(c => c.projectId === projectId);
  const currentIndex = allChapters.findIndex(c => c.id === chapterId);

  const [originalText, setOriginalText] = useState(chapter?.originalText || `第1章 我的系统

林白睁开眼时。

"哈啊，主人♡"

他一个翻身猛地弹起，甩掉脸上糊了一缕柔软的长布。

那不是布。

是粉发。

而它的上方，赫然坐着一个人类女性。

不——不完全是人类。

那身衣服怎么看都是cosplay：

巫女短裙、白色过膝袜、呆毛。

"......"

林白眉角银眼一抽，摸向枕刀，冷声道：

"你是谁。"

那女孩似乎毫无防备地眨了眨眼，微歪着头，双眼亮晶晶：

"我是结！是节牙的鹤鸣！"`);
  
  const [translatedText, setTranslatedText] = useState(chapter?.translatedText || '');
  const [chapterTitle, setChapterTitle] = useState(chapter?.title || '');
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-pro');
  const [selectedApiKey, setSelectedApiKey] = useState('кузнец');
  const [systemPrompt, setSystemPrompt] = useState(`I. Твоя Роль: Гениальный Писатель-переводчик

Ты — мастер художественного слова, чьи работы стоят в одном ряду с лучшими переводами мировой фэнтези-литературы...`);

  const [timer, setTimer] = useState(0);

  const handlePrevChapter = () => {
    if (currentIndex > 0) {
      navigate(`/project/${projectId}/chapter/${allChapters[currentIndex - 1].id}`);
    }
  };

  const handleNextChapter = () => {
    if (currentIndex < allChapters.length - 1) {
      navigate(`/project/${projectId}/chapter/${allChapters[currentIndex + 1].id}`);
    }
  };

  const handleSave = () => {
    toast.success('Изменения сохранены');
  };

  const handleTranslate = () => {
    toast.info('Перевод запущен...');
    // Here would be the bridge agent connection
  };

  const countStats = (text: string) => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const paragraphs = text.trim() ? text.split(/\n\n+/).length : 0;
    return { chars, words, paragraphs };
  };

  const originalStats = countStats(originalText);
  const translatedStats = countStats(translatedText);

  if (!project || !chapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Глава не найдена</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="font-semibold text-foreground">Проект: {project.title}</h1>
          <p className="text-sm text-muted-foreground">Редактирование главы: {chapter.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Время: {timer.toFixed(1)}с</span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevChapter}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNextChapter}
            disabled={currentIndex === allChapters.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate(`/project/${projectId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к главам
          </Button>
          <Button variant="destructive" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Сохранить изменения
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Original Text Panel */}
        <div className="flex-1 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Оригинал</h2>
            <div className="text-sm text-muted-foreground">
              Символы: {originalStats.chars} | Слова: {originalStats.words} | Абзацы: {originalStats.paragraphs}
            </div>
          </div>
          <div className="flex-1 p-4">
            <Textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              className="h-full resize-none bg-secondary/30 border-border font-mono text-sm"
              placeholder="Вставьте оригинальный текст..."
            />
          </div>
        </div>

        {/* Translation Panel */}
        <div className="flex-1 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Перевод</h2>
            <div className="text-sm text-muted-foreground">
              Символы: {translatedStats.chars} | Слова: {translatedStats.words} | Абзацы: {translatedStats.paragraphs}
            </div>
          </div>
          <div className="flex-1 p-4">
            <Textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              className="h-full resize-none bg-secondary/30 border-border font-mono text-sm"
              placeholder="Перевод появится здесь..."
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex flex-col bg-card">
          {/* Chapter Title */}
          <div className="p-4 border-b border-border">
            <Label className="text-sm text-muted-foreground mb-2 block">Название главы</Label>
            <Input
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {/* Actions */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="secondary" size="icon">
                <Pause className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="icon">
                <PenLine className="w-4 h-4" />
              </Button>
              <Button 
                variant="secondary" 
                size="icon"
                onClick={() => setIsGlossaryOpen(true)}
                className="bg-warning/20 hover:bg-warning/30"
              >
                <BookOpen className="w-4 h-4 text-warning" />
              </Button>
              <Button variant="secondary" size="icon" className="bg-accent/20 hover:bg-accent/30">
                <Sparkles className="w-4 h-4 text-accent" />
              </Button>
              <Button variant="destructive" size="icon">
                <Languages className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="icon">
                <CheckSquare className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="success" className="w-full" onClick={handleTranslate}>
              <Languages className="w-4 h-4 mr-2" />
              Перевести
            </Button>
          </div>

          {/* System Prompt */}
          <div className="p-4 border-b border-border flex-1 flex flex-col">
            <Label className="text-sm text-muted-foreground mb-2 block">Системный промпт</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="flex-1 resize-none bg-secondary/30 border-border text-xs"
            />
            <Button variant="warning" size="sm" className="mt-2 self-start">
              Сохранить промпт
            </Button>
          </div>

          {/* Model Selection */}
          <div className="p-4 border-b border-border">
            <Label className="text-sm text-muted-foreground mb-2 block">Модель</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="claude-3">Claude 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* API Key */}
          <div className="p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">API Ключ</Label>
            <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="кузнец">кузнец</SelectItem>
                <SelectItem value="default">default</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <GlossaryDialog
        open={isGlossaryOpen}
        onOpenChange={setIsGlossaryOpen}
        projectTitle={project.title}
      />
    </div>
  );
}

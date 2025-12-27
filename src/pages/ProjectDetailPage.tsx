import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockProjects, mockChapters } from '@/lib/mockData';
import { ChapterList } from '@/components/ChapterList';
import { ActionBar } from '@/components/ActionBar';
import { BulkUploadDialog } from '@/components/BulkUploadDialog';
import { TranslateDialog } from '@/components/TranslateDialog';
import { GlossaryDialog } from '@/components/GlossaryDialog';
import { FindHieroglyphsDialog } from '@/components/FindHieroglyphsDialog';
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
  BookOpen
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Chapter } from '@/types';
import { toast } from 'sonner';

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

  const handleUpload = (file: File, mode: 'auto' | 'manual') => {
    // Simulate parsing file and adding chapters
    const newChapters: Chapter[] = [
      {
        id: `ch${chapters.length + 1}`,
        projectId: id!,
        number: chapters.length + 1,
        title: '第7章 新的开始',
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `ch${chapters.length + 2}`,
        projectId: id!,
        number: chapters.length + 2,
        title: '第8章 意外的相遇',
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
      },
    ];
    setChapters([...chapters, ...newChapters]);
    toast.success(`Добавлено ${newChapters.length} глав из файла ${file.name}`);
  };

  const handleTranslate = (settings: any) => {
    toast.success(`Начат перевод ${selectedChapters.length} глав`);
    console.log('Translation settings:', settings);
  };

  const handleDelete = () => {
    setChapters(chapters.filter(c => !selectedChapters.includes(c.id)));
    setSelectedChapters([]);
    toast.success('Главы удалены');
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <div className="flex items-center gap-2">
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
        />

        <TranslateDialog
          open={isTranslateOpen}
          onOpenChange={setIsTranslateOpen}
          selectedCount={selectedChapters.length}
          selectedChapterNumbers={selectedChapterNumbers}
          onTranslate={handleTranslate}
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
        />
      </div>
    </div>
  );
}

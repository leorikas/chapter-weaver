import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '@/types';
import { mockProjects } from '@/lib/mockData';
import { StatCard } from '@/components/StatCard';
import { ProjectCard } from '@/components/ProjectCard';
import { NewProjectDialog } from '@/components/NewProjectDialog';
import { EditProjectDialog } from '@/components/EditProjectDialog';
import { RulateCookiesDialog } from '@/components/RulateCookiesDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Bookmark, DollarSign, Plus, Search, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isCookiesOpen, setIsCookiesOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [rulateCookies, setRulateCookies] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    in_progress: true,
    completed: true,
    paused: true,
  });

  const totalViews = projects.reduce((sum, p) => sum + p.views, 0);
  const totalBookmarks = projects.reduce((sum, p) => sum + p.bookmarks, 0);
  const totalIncome = projects.reduce((sum, p) => sum + p.income, 0);

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const projectsByStatus = {
    in_progress: filteredProjects.filter(p => p.status === 'in_progress'),
    completed: filteredProjects.filter(p => p.status === 'completed'),
    paused: filteredProjects.filter(p => p.status === 'paused'),
  };

  const toggleSection = (status: string) => {
    setExpandedSections(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const handleNewProject = (data: { title: string; rulateUrl: string; sourceUrl: string }) => {
    const newProject: Project = {
      id: String(projects.length + 1),
      title: data.title,
      rulateUrl: data.rulateUrl,
      sourceUrl: data.sourceUrl,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      totalChapters: 0,
      translatedChapters: 0,
      views: 0,
      bookmarks: 0,
      income: 0,
    };
    setProjects([newProject, ...projects]);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsEditProjectOpen(true);
  };

  const handleSaveProject = (updated: Project) => {
    setProjects(projects.map(p => p.id === updated.id ? updated : p));
    toast.success('Проект обновлён');
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleSaveCookies = (cookies: string) => {
    setRulateCookies(cookies);
    toast.success('Куки сохранены');
  };

  const statusLabels: Record<string, string> = {
    in_progress: 'В работе',
    completed: 'Завершённые',
    paused: 'На паузе',
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Мои Проекты</h1>
            <p className="text-muted-foreground mt-1">Переводи просто!</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Найти проект..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsCookiesOpen(true)}>
                    <Settings className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Настройки Rulate</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="gradient" onClick={() => setIsNewProjectOpen(true)}>
              <Plus className="w-4 h-4" />
              Новый проект
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Всего просмотров"
            value={totalViews}
            icon={<Eye className="w-6 h-6" />}
          />
          <StatCard
            label="Все закладки"
            value={totalBookmarks}
            icon={<Bookmark className="w-6 h-6" />}
          />
          <StatCard
            label="Общий доход"
            value={totalIncome.toFixed(2)}
            suffix="₽"
            icon={<DollarSign className="w-6 h-6" />}
          />
        </div>

        {/* Sort */}
        <div className="flex justify-end mb-4">
          <Button variant="secondary" className="gap-2">
            По дате
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Project Sections */}
        {Object.entries(projectsByStatus).map(([status, statusProjects]) => (
          statusProjects.length > 0 && (
            <div key={status} className="mb-6">
              <button
                className="flex items-center gap-3 mb-4 group"
                onClick={() => toggleSection(status)}
              >
                <div className={`w-1 h-6 rounded-full ${
                  status === 'in_progress' ? 'bg-warning' :
                  status === 'completed' ? 'bg-success' : 'bg-muted-foreground'
                }`} />
                <h2 className="text-xl font-semibold text-foreground">
                  {statusLabels[status]}
                </h2>
                <span className="bg-secondary px-2 py-0.5 rounded-full text-sm text-muted-foreground">
                  {statusProjects.length}
                </span>
                {expandedSections[status] 
                  ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  : <ChevronDown className="w-5 h-5 text-muted-foreground" />
                }
              </button>

              {expandedSections[status] && (
                <div className="space-y-3">
                  {statusProjects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      index={index}
                      onClick={() => navigate(`/project/${project.id}`)}
                      onEdit={() => handleEditProject(project)}
                      onDelete={() => handleDeleteProject(project.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        ))}

        <NewProjectDialog
          open={isNewProjectOpen}
          onOpenChange={setIsNewProjectOpen}
          onSubmit={handleNewProject}
        />

        <EditProjectDialog
          open={isEditProjectOpen}
          onOpenChange={setIsEditProjectOpen}
          project={editingProject}
          onSave={handleSaveProject}
        />

        <RulateCookiesDialog
          open={isCookiesOpen}
          onOpenChange={setIsCookiesOpen}
          cookies={rulateCookies}
          onSave={handleSaveCookies}
        />
      </div>
    </div>
  );
}

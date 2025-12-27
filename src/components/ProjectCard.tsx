import { useState } from 'react';
import { Project } from '@/types';
import { Eye, Bookmark, RefreshCw, ExternalLink, Link, PenLine, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface ProjectCardProps {
  project: Project;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, index, onClick, onDelete }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const progress = (project.translatedChapters / project.totalChapters) * 100;
  const isComplete = progress === 100;

  return (
    <div
      className="project-card animate-fade-in cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">#{project.id}</span>
          <span className="text-muted-foreground text-sm">📅 {project.createdAt}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="bg-secondary text-foreground text-sm px-3 py-1 rounded-md border border-border"
            value={project.status}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="in_progress">В работе</option>
            <option value="completed">Завершён</option>
            <option value="paused">На паузе</option>
          </select>
          
          {isHovered && (
            <div className="flex items-center gap-1 animate-fade-in">
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <Link className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <PenLine className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-3 hover:text-primary transition-colors">
        {project.title}
      </h3>

      <div className="flex items-center gap-2 mb-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          isComplete ? 'bg-success/20 text-success' : 'bg-secondary'
        }`}>
          <span className="font-medium">{project.translatedChapters}</span>
          <span className="text-muted-foreground">/</span>
          <span>{project.totalChapters}</span>
        </div>
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? 'bg-success' : 'progress-bar'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {project.rulateUrl && (
          <a 
            href={project.rulateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="w-2 h-2 rounded-full bg-destructive" />
            Rulate
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {project.views}
        </div>
        <div className="flex items-center gap-1">
          <Bookmark className="w-4 h-4" />
          {project.bookmarks}
        </div>
        <div className="flex items-center gap-1 text-success">
          {project.income.toFixed(2)}
          <span className="text-xs">₽</span>
        </div>
        <button 
          className="p-1 hover:bg-secondary rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

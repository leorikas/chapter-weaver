import { Chapter } from '@/types';
import { Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

interface ChapterListProps {
  chapters: Chapter[];
  selectedChapters: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ChapterList({ chapters, selectedChapters, onSelectionChange }: ChapterListProps) {
  const navigate = useNavigate();

  const toggleChapter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedChapters.includes(id)) {
      onSelectionChange(selectedChapters.filter(c => c !== id));
    } else {
      onSelectionChange([...selectedChapters, id]);
    }
  };

  const openChapter = (chapter: Chapter) => {
    navigate(`/project/${chapter.projectId}/chapter/${chapter.id}`);
  };

  const isSelected = (id: string) => selectedChapters.includes(id);

  return (
    <div className="space-y-2">
      {chapters.map((chapter, index) => (
        <div
          key={chapter.id}
          className={`chapter-item animate-fade-in flex items-center gap-4 ${
            isSelected(chapter.id) ? 'chapter-selected' : ''
          }`}
          style={{ animationDelay: `${index * 0.03}s` }}
          onClick={() => openChapter(chapter)}
        >
          <div 
            className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
              isSelected(chapter.id) 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary border border-border hover:border-primary/50'
            }`}
            onClick={(e) => toggleChapter(chapter.id, e)}
          >
            {isSelected(chapter.id) && <Check className="w-4 h-4" />}
          </div>
          
          <div className="flex-1">
            <h4 className={`font-medium ${
              chapter.status === 'translated' ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {chapter.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              Дата: {chapter.createdAt}
            </p>
          </div>
          
          {chapter.status === 'translated' && (
            <div className="w-2 h-2 rounded-full bg-success" />
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              openChapter(chapter);
            }}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

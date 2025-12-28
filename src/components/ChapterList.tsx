import { Chapter } from '@/types';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

interface ChapterListProps {
  chapters: Chapter[];
  selectedChapters: string[];
  onSelectionChange: (ids: string[]) => void;
  chaptersWithHieroglyphs?: string[]; // ID глав с найденными иероглифами
}

export function ChapterList({ 
  chapters, 
  selectedChapters, 
  onSelectionChange,
  chaptersWithHieroglyphs = [],
}: ChapterListProps) {
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
  const hasHieroglyphs = (id: string) => chaptersWithHieroglyphs.includes(id);

  return (
    <div className="space-y-2">
      {chapters.map((chapter, index) => (
        <div
          key={chapter.id}
          className={`chapter-item animate-fade-in flex items-center gap-4 ${
            isSelected(chapter.id) ? 'chapter-selected' : ''
          } ${hasHieroglyphs(chapter.id) ? 'border-destructive bg-destructive/10' : ''}`}
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
              hasHieroglyphs(chapter.id) 
                ? 'text-destructive' 
                : chapter.status === 'translated' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
            }`}>
              {chapter.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              Дата: {chapter.createdAt}
            </p>
          </div>
          
          {chapter.status === 'translating' && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          
          {chapter.status === 'translated' && !hasHieroglyphs(chapter.id) && (
            <div className="w-2 h-2 rounded-full bg-success" />
          )}
          
          {hasHieroglyphs(chapter.id) && (
            <div className="text-xs text-destructive font-medium px-2 py-1 bg-destructive/20 rounded">
              Иероглифы
            </div>
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

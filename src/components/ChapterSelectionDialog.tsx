import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { ArrowLeft } from 'lucide-react';

export interface ParsedChapter {
  id: string;
  title: string;
  preview: string;
  content: string;
}

interface ChapterSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapters: ParsedChapter[];
  onConfirm: (selectedChapters: ParsedChapter[]) => void;
  onBack: () => void;
}

export function ChapterSelectionDialog({
  open,
  onOpenChange,
  chapters,
  onConfirm,
  onBack,
}: ChapterSelectionDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(chapters.map((c) => c.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = () => {
    const selected = chapters.filter((c) => selectedIds.has(c.id));
    onConfirm(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <DialogTitle className="text-xl font-bold">
              Найдено глав:{' '}
              <span className="text-success">{chapters.length}</span>
            </DialogTitle>
            <div className="ml-auto flex gap-2 text-sm">
              <button
                className="text-primary hover:underline"
                onClick={handleSelectAll}
              >
                Выбрать все
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                className="text-primary hover:underline"
                onClick={handleDeselectAll}
              >
                Снять все
              </button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-3">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                onClick={() => handleToggle(chapter.id)}
              >
                <span className="text-muted-foreground text-sm pt-1 w-6">
                  {index + 1}.
                </span>
                <Checkbox
                  checked={selectedIds.has(chapter.id)}
                  onCheckedChange={() => handleToggle(chapter.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{chapter.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {chapter.preview}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between p-6 border-t border-border">
          <span className="text-muted-foreground">
            Выбрано: <span className="text-foreground font-medium">{selectedIds.size}</span>
          </span>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onBack}>
              Назад
            </Button>
            <Button
              variant="gradient"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
            >
              Загрузить ({selectedIds.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from './ui/button';
import { FolderOpen, Image, Edit3, Download, Trash2 } from 'lucide-react';

interface ActionBarProps {
  selectedCount: number;
  onRename: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function ActionBar({ selectedCount, onRename, onDownload, onDelete }: ActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="action-bar animate-slide-up">
      <span className="text-foreground font-medium">
        Выбрано глав: {selectedCount}
      </span>
      
      <div className="h-6 w-px bg-border" />
      
      <Button variant="destructive" size="sm" className="rounded-full">
        <FolderOpen className="w-4 h-4" />
      </Button>
      
      <Button variant="accent" size="sm" className="rounded-full">
        <Image className="w-4 h-4" />
      </Button>
      
      <Button variant="secondary" size="sm" onClick={onRename}>
        Переименовать
      </Button>
      
      <Button variant="success" size="sm" onClick={onDownload}>
        Скачать выбранное
      </Button>
      
      <Button variant="destructive" size="sm" onClick={onDelete}>
        Удалить выбранные
      </Button>
    </div>
  );
}

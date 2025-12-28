import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Project } from '@/types';

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSave: (project: Project) => void;
}

export function EditProjectDialog({ open, onOpenChange, project, onSave }: EditProjectDialogProps) {
  const [title, setTitle] = useState('');
  const [rulateUrl, setRulateUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setRulateUrl(project.rulateUrl || '');
      setSourceUrl(project.sourceUrl || '');
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    onSave({
      ...project,
      title,
      rulateUrl,
      sourceUrl,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Редактировать</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Rulate</Label>
            <Input
              value={rulateUrl}
              onChange={(e) => setRulateUrl(e.target.value)}
              className="bg-secondary border-border"
              placeholder="Ссылка на Rulate"
            />
          </div>

          <div className="space-y-2">
            <Label>Источник</Label>
            <Input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="bg-secondary border-border"
              placeholder="Ссылка на источник"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="warning">
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

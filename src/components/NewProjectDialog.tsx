import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; rulateUrl: string; sourceUrl: string }) => void;
}

export function NewProjectDialog({ open, onOpenChange, onSubmit }: NewProjectDialogProps) {
  const [title, setTitle] = useState('');
  const [rulateUrl, setRulateUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const handleSubmit = () => {
    onSubmit({ title, rulateUrl, sourceUrl });
    setTitle('');
    setRulateUrl('');
    setSourceUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Новый проект</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название проекта"
              className="bg-secondary border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rulateUrl">Ссылка Rulate</Label>
            <Input
              id="rulateUrl"
              value={rulateUrl}
              onChange={(e) => setRulateUrl(e.target.value)}
              placeholder="https://tl.rulate.ru/..."
              className="bg-secondary border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Источник</Label>
            <Input
              id="sourceUrl"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="bg-secondary border-border"
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>
              Создать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

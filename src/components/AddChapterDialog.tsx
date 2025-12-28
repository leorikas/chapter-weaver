import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface AddChapterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { number: number; title: string; originalText: string }) => void;
  nextNumber: number;
}

export function AddChapterDialog({ open, onOpenChange, onAdd, nextNumber }: AddChapterDialogProps) {
  const [number, setNumber] = useState(nextNumber);
  const [title, setTitle] = useState('');
  const [originalText, setOriginalText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ number, title, originalText });
    setNumber(nextNumber + 1);
    setTitle('');
    setOriginalText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Добавить главу вручную</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Номер главы</Label>
              <Input
                type="number"
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
                className="bg-secondary border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Заголовок</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary border-border"
                placeholder="第1章 标题"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Оригинальный текст</Label>
            <Textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              className="bg-secondary border-border min-h-[150px]"
              placeholder="Вставьте текст главы..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="gradient">
              Добавить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

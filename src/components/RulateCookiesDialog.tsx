import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface RulateCookiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cookies: string;
  onSave: (cookies: string) => void;
}

export function RulateCookiesDialog({ open, onOpenChange, cookies, onSave }: RulateCookiesDialogProps) {
  const [localCookies, setLocalCookies] = useState(cookies);

  useEffect(() => {
    setLocalCookies(cookies);
  }, [cookies]);

  const handleSave = () => {
    onSave(localCookies);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Глобальные Cookies Rulate</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <p className="text-muted-foreground text-sm">
            Эти куки будут автоматически подставляться во все ваши проекты при загрузке на Rulate.
          </p>

          <Textarea
            value={localCookies}
            onChange={(e) => setLocalCookies(e.target.value)}
            className="bg-secondary border-border font-mono text-xs min-h-[200px]"
            placeholder="Вставьте куки сюда..."
          />

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button variant="default" onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

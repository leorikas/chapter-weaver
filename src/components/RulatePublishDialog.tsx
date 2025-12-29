import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Chapter, RulateSettings } from '@/types';
import { getRulateSettings, saveRulateSettings, sendPublishJob } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

interface RulatePublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  selectedChapters: Chapter[];
  onPublishStarted: () => void;
}

export function RulatePublishDialog({
  open,
  onOpenChange,
  projectId,
  selectedChapters,
  onPublishStarted,
}: RulatePublishDialogProps) {
  const [settings, setSettings] = useState<RulateSettings>({
    bookUrl: '',
    chapterStatus: 'ready',
    delayedChapter: true,
    subscriptionOnly: true,
    addAsTranslation: true,
  });
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (open && projectId) {
      setLoading(true);
      getRulateSettings(projectId)
        .then(setSettings)
        .finally(() => setLoading(false));
    }
  }, [open, projectId]);

  const handleSaveSettings = async () => {
    const success = await saveRulateSettings(projectId, settings);
    if (success) {
      toast.success('Настройки сохранены');
    } else {
      toast.error('Ошибка сохранения настроек');
    }
  };

  const handlePublish = async () => {
    if (!settings.bookUrl) {
      toast.error('Укажите URL книги на Rulate');
      return;
    }

    if (selectedChapters.length === 0) {
      toast.error('Выберите главы для публикации');
      return;
    }

    setPublishing(true);
    try {
      await saveRulateSettings(projectId, settings);
      
      const result = await sendPublishJob({
        project_id: projectId,
        chapter_ids: selectedChapters.map(ch => ch.id),
        book_url: settings.bookUrl,
        chapter_status: settings.chapterStatus,
        delayed_chapter: settings.delayedChapter,
        subscription_only: settings.subscriptionOnly,
        add_as_translation: settings.addAsTranslation,
      });

      if (result.status === 'queued') {
        toast.success(`${result.count || selectedChapters.length} глав отправлено на публикацию`);
        onPublishStarted();
        onOpenChange(false);
      } else {
        toast.error('Ошибка отправки на публикацию');
      }
    } catch (error) {
      toast.error('Ошибка: ' + (error as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const translatedChapters = selectedChapters.filter(
    ch => ch.status === 'translated' || ch.translatedText
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Публикация на Rulate
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bookUrl">URL книги на Rulate</Label>
              <Input
                id="bookUrl"
                placeholder="https://tl.rulate.ru/book/123456"
                value={settings.bookUrl}
                onChange={(e) => setSettings({ ...settings, bookUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Например: https://tl.rulate.ru/book/144228
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="delayed">Отложенная глава</Label>
                <Switch
                  id="delayed"
                  checked={settings.delayedChapter}
                  onCheckedChange={(checked) => setSettings({ ...settings, delayedChapter: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="subscription">Только для подписчиков</Label>
                <Switch
                  id="subscription"
                  checked={settings.subscriptionOnly}
                  onCheckedChange={(checked) => setSettings({ ...settings, subscriptionOnly: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="translation">Добавить как перевод</Label>
                <Switch
                  id="translation"
                  checked={settings.addAsTranslation}
                  onCheckedChange={(checked) => setSettings({ ...settings, addAsTranslation: checked })}
                />
              </div>
            </div>

            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-sm font-medium mb-1">
                Выбрано глав: {translatedChapters.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {translatedChapters.map(ch => ch.title).join(', ') || 'Нет переведённых глав'}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSaveSettings} disabled={loading}>
            Сохранить настройки
          </Button>
          <Button 
            onClick={handlePublish} 
            disabled={publishing || translatedChapters.length === 0 || !settings.bookUrl}
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Публикация...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Опубликовать ({translatedChapters.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

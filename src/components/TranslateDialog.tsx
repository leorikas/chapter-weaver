import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Download, AlertTriangle, Loader2 } from 'lucide-react';
import { TranslationSettings } from '@/lib/translationService';

interface TranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  selectedChapterNumbers: number[];
  onTranslate: (settings: TranslationSettings) => Promise<void>;
  isTranslating?: boolean;
}

export function TranslateDialog({ 
  open, 
  onOpenChange, 
  selectedCount, 
  selectedChapterNumbers,
  onTranslate,
  isTranslating = false,
}: TranslateDialogProps) {
  const [provider, setProvider] = useState<'google' | 'local_bridge' | 'openrouter'>('local_bridge');
  const [targetService, setTargetService] = useState<'perplexity' | 'google_ai_studio'>('perplexity');
  const [model, setModel] = useState('local_agent');
  const [batchSize, setBatchSize] = useState('5');
  const [cleanAfterTranslation, setCleanAfterTranslation] = useState(true);
  const [convertMarkdown, setConvertMarkdown] = useState(true);

  const handleSubmit = async () => {
    const settings: TranslationSettings = {
      provider,
      targetService,
      model,
      batchSize: parseInt(batchSize) || 5,
      cleanAfterTranslation,
      convertMarkdown,
    };
    
    await onTranslate(settings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Массовый перевод глав</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="bg-secondary/50 rounded-lg p-4 border border-border">
            <p className="text-accent font-medium">
              Выбрано {selectedCount} глав из основного списка.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Номера глав: {selectedChapterNumbers.join(', ')}
            </p>
            <button className="text-sm text-primary mt-2 hover:underline">
              Сбросить и выбрать диапазон
            </button>
          </div>

          <div className="space-y-3">
            <Label>Провайдер</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'google', label: 'Google API', desc: 'Бесплатно' },
                { value: 'local_bridge', label: 'Local Bridge', desc: 'Perplexity / AI Studio' },
                { value: 'openrouter', label: 'OpenRouter', desc: 'API (OpenAI)' },
              ].map((p) => (
                <button
                  key={p.value}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    provider === p.value 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setProvider(p.value as 'google' | 'local_bridge' | 'openrouter')}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {provider === 'local_bridge' && (
            <div className="space-y-3">
              <Label>Целевой сервис</Label>
              <RadioGroup value={targetService} onValueChange={(v) => setTargetService(v as 'perplexity' | 'google_ai_studio')}>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="perplexity" id="perplexity" />
                    <Label htmlFor="perplexity" className="cursor-pointer">Perplexity AI</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="google_ai_studio" id="google_ai_studio" />
                    <Label htmlFor="google_ai_studio" className="cursor-pointer">Google AI Studio</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-3">
            <Label>Назначить агенту (машине)</Label>
            <Select defaultValue="any">
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Выберите агента" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Любой свободный агент</SelectItem>
                <SelectItem value="agent1">Агент 1</SelectItem>
                <SelectItem value="agent2">Агент 2</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Если выбрать конкретного агента, только он сможет взять эту задачу.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Модель</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local_agent">Локальный агент (через InLands Bridge)</SelectItem>
                <SelectItem value="gpt4">GPT-4</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {model === 'local_agent' && (
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-accent font-medium">Требуется InLands Bridge</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Убедитесь, что на вашем ПК запущен скрипт "InLands Bridge". Задачи будут выполняться локально через ваш аккаунт Perplexity.
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Выполнить очистку после перевода</Label>
              <p className="text-sm text-muted-foreground">
                Автоматически применит функцию "Очистить перевод" к каждой успешно переведенной главе.
              </p>
            </div>
            <Switch checked={cleanAfterTranslation} onCheckedChange={setCleanAfterTranslation} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Конвертировать Markdown в HTML</Label>
              <p className="text-sm text-muted-foreground">
                Преобразует **жирный** и *курсив* в HTML-теги перед очисткой.
              </p>
            </div>
            <Switch checked={convertMarkdown} onCheckedChange={setConvertMarkdown} />
          </div>

          <div className="space-y-3">
            <Label>Размер пачки (глав за один запрос)</Label>
            <Input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              className="bg-secondary border-border"
              min={1}
              max={20}
            />
            <p className="text-sm text-muted-foreground">
              Рекомендуется 5-10. Большое количество может привести к ошибкам.
            </p>
          </div>

          <button className="text-primary text-sm hover:underline">
            Настроить системный промпт
          </button>

          <div className="flex justify-between items-center pt-4">
            <button className="text-primary text-sm hover:underline">
              Добавить ключи
            </button>
            <Button 
              variant="success" 
              onClick={handleSubmit}
              disabled={isTranslating || selectedCount === 0}
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Начать перевод'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

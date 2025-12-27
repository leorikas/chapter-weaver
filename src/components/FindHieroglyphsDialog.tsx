import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Search, AlertTriangle } from 'lucide-react';

interface ChapterResult {
  chapterId: string;
  chapterTitle: string;
  matches: Array<{
    text: string;
    context: string;
    position: number;
  }>;
}

interface FindHieroglyphsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedChapters: string[];
}

export function FindHieroglyphsDialog({ 
  open, 
  onOpenChange, 
  selectedChapters 
}: FindHieroglyphsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInOriginal, setSearchInOriginal] = useState(true);
  const [searchInTranslation, setSearchInTranslation] = useState(true);
  const [results, setResults] = useState<ChapterResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate search
    setTimeout(() => {
      setResults([
        {
          chapterId: 'ch1',
          chapterTitle: '第1章 我的系统',
          matches: [
            { 
              text: '林白', 
              context: '...林白睁开眼时...', 
              position: 0 
            },
            { 
              text: '林白', 
              context: '...林白眉角银眼一抽...', 
              position: 156 
            },
          ]
        },
        {
          chapterId: 'ch2',
          chapterTitle: '第2章 爱有时候是痛苦的',
          matches: [
            { 
              text: '林白', 
              context: '...林白看着窗外...', 
              position: 45 
            },
          ]
        },
      ]);
      setIsSearching(false);
    }, 500);
  };

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Найти иероглифы в переводе
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-muted-foreground">
            Поиск китайских иероглифов в выбранных {selectedChapters.length} главах. 
            Это поможет найти непереведённые участки.
          </p>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введите текст для поиска (или оставьте пустым для поиска всех иероглифов)"
                className="pl-10 bg-secondary border-border"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Поиск...' : 'Найти'}
            </Button>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                checked={searchInOriginal}
                onCheckedChange={(c) => setSearchInOriginal(!!c)}
              />
              <span className="text-sm">В оригинале</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                checked={searchInTranslation}
                onCheckedChange={(c) => setSearchInTranslation(!!c)}
              />
              <span className="text-sm">В переводе</span>
            </label>
          </div>

          {results.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-secondary/50 p-3 border-b border-border">
                <span className="font-medium">
                  Найдено: {totalMatches} совпадений в {results.length} главах
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {results.map((result) => (
                  <div key={result.chapterId} className="border-b border-border last:border-0">
                    <div className="p-3 bg-secondary/30 font-medium text-sm">
                      {result.chapterTitle} ({result.matches.length})
                    </div>
                    {result.matches.map((match, i) => (
                      <div 
                        key={i} 
                        className="p-3 hover:bg-secondary/20 cursor-pointer text-sm flex items-center justify-between"
                      >
                        <span className="text-muted-foreground">{match.context}</span>
                        <span className="text-primary font-medium">{match.text}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && !isSearching && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              Нажмите "Найти" для начала поиска
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

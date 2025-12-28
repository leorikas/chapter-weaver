import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Chapter } from '@/types';

interface ChapterResult {
  chapterId: string;
  chapterTitle: string;
  matchCount: number;
  matches: Array<{
    text: string;
    context: string;
  }>;
}

interface FindHieroglyphsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedChapters: string[];
  chapters: Chapter[];
  onChaptersWithHieroglyphsFound: (chapterIds: string[]) => void;
}

// Регулярка для поиска китайских иероглифов
const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}]/gu;

export function FindHieroglyphsDialog({ 
  open, 
  onOpenChange, 
  selectedChapters,
  chapters,
  onChaptersWithHieroglyphsFound,
}: FindHieroglyphsDialogProps) {
  const [results, setResults] = useState<ChapterResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Сброс при закрытии
  useEffect(() => {
    if (!open) {
      setResults([]);
      setHasSearched(false);
    }
  }, [open]);

  const findHieroglyphs = () => {
    setIsSearching(true);
    setHasSearched(true);
    
    const foundResults: ChapterResult[] = [];
    const chaptersWithHieroglyphs: string[] = [];
    
    // Ищем только в выбранных главах
    const chaptersToSearch = chapters.filter(c => selectedChapters.includes(c.id));
    
    for (const chapter of chaptersToSearch) {
      // Ищем в переведённом тексте
      const textToSearch = chapter.translatedText || '';
      const matches: Array<{ text: string; context: string }> = [];
      
      let match;
      const regex = new RegExp(CHINESE_REGEX);
      const foundChars = new Set<string>();
      
      while ((match = regex.exec(textToSearch)) !== null) {
        const char = match[0];
        if (!foundChars.has(char)) {
          foundChars.add(char);
          // Получаем контекст
          const start = Math.max(0, match.index - 20);
          const end = Math.min(textToSearch.length, match.index + 20);
          const context = `...${textToSearch.slice(start, end)}...`;
          
          matches.push({
            text: char,
            context,
          });
        }
      }
      
      if (matches.length > 0) {
        foundResults.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          matchCount: matches.length,
          matches,
        });
        chaptersWithHieroglyphs.push(chapter.id);
      }
    }
    
    setResults(foundResults);
    onChaptersWithHieroglyphsFound(chaptersWithHieroglyphs);
    setIsSearching(false);
  };

  const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0);

  const clearResults = () => {
    setResults([]);
    setHasSearched(false);
    onChaptersWithHieroglyphsFound([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Поиск иероглифов в переводе
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-muted-foreground">
            Поиск китайских иероглифов в переведённом тексте выбранных {selectedChapters.length} глав. 
            Это поможет найти непереведённые участки.
          </p>

          <div className="flex gap-3">
            <Button 
              onClick={findHieroglyphs} 
              disabled={isSearching || selectedChapters.length === 0}
              className="flex-1"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Поиск...
                </>
              ) : (
                'Найти иероглифы'
              )}
            </Button>
            {results.length > 0 && (
              <Button variant="secondary" onClick={clearResults}>
                <X className="w-4 h-4 mr-2" />
                Очистить
              </Button>
            )}
          </div>

          {results.length > 0 && (
            <div className="border border-destructive/50 rounded-lg overflow-hidden">
              <div className="bg-destructive/10 p-3 border-b border-destructive/30">
                <span className="font-medium text-destructive">
                  Найдено: {totalMatches} иероглифов в {results.length} главах
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {results.map((result) => (
                  <div key={result.chapterId} className="border-b border-border last:border-0">
                    <div className="p-3 bg-destructive/5 font-medium text-sm text-destructive">
                      {result.chapterTitle} ({result.matchCount} иероглифов)
                    </div>
                    {result.matches.slice(0, 5).map((match, i) => (
                      <div 
                        key={i} 
                        className="p-3 hover:bg-secondary/20 text-sm flex items-center justify-between"
                      >
                        <span className="text-muted-foreground truncate flex-1">{match.context}</span>
                        <span className="text-destructive font-bold text-lg ml-4">{match.text}</span>
                      </div>
                    ))}
                    {result.matches.length > 5 && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        ... и ещё {result.matches.length - 5} иероглифов
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasSearched && results.length === 0 && !isSearching && (
            <div className="text-center py-8 text-success">
              ✓ Иероглифы не найдены! Все главы полностью переведены.
            </div>
          )}

          {!hasSearched && selectedChapters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Выберите главы для поиска иероглифов
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

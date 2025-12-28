import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Upload, Check, FileText, Loader2 } from 'lucide-react';
import { parseChaptersFromText } from '@/lib/chapterParser';
import { ChapterSelectionDialog, ParsedChapter } from './ChapterSelectionDialog';
import { Chapter } from '@/types';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (chapters: Chapter[]) => void;
  projectId: string;
  existingChaptersCount: number;
}

export function BulkUploadDialog({ 
  open, 
  onOpenChange, 
  onUpload,
  projectId,
  existingChaptersCount
}: BulkUploadDialogProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
  const [showSelection, setShowSelection] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.txt') || droppedFile.name.endsWith('.epub'))) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleNext = async () => {
    if (!file) return;
    
    setIsParsing(true);
    try {
      const text = await file.text();
      const chapters = parseChaptersFromText(text, mode);
      setParsedChapters(chapters);
      setShowSelection(true);
    } catch (error) {
      console.error('Error parsing file:', error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmSelection = (selected: ParsedChapter[]) => {
    const newChapters: Chapter[] = selected.map((ch, index) => ({
      id: `ch_${Date.now()}_${index}`,
      projectId,
      number: existingChaptersCount + index + 1,
      title: ch.title,
      originalText: ch.content,
      status: 'pending' as const,
      createdAt: new Date().toISOString().split('T')[0],
    }));
    
    onUpload(newChapters);
    handleClose();
  };

  const handleBack = () => {
    setShowSelection(false);
  };

  const handleClose = () => {
    setFile(null);
    setParsedChapters([]);
    setShowSelection(false);
    onOpenChange(false);
  };

  if (showSelection) {
    return (
      <ChapterSelectionDialog
        open={open}
        onOpenChange={handleClose}
        chapters={parsedChapters}
        onConfirm={handleConfirmSelection}
        onBack={handleBack}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Массовая загрузка глав</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <p className="text-muted-foreground">
            Загрузите файл. Система проанализирует его, и на следующем шаге вы сможете выбрать, какие главы добавить.
          </p>

          <div className="space-y-3">
            <Label>Способ определения заголовков</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'auto' | 'manual')}>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="auto" id="auto" />
                  <Label htmlFor="auto" className="cursor-pointer">Автоматически</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="cursor-pointer">Вручную</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div
            className={`upload-zone ${isDragging ? 'border-primary bg-primary/10' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".txt,.epub"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-foreground">
              <span className="text-primary font-medium">Нажмите для выбора</span> или перетащите
            </p>
            <p className="text-sm text-muted-foreground mt-1">TXT, EPUB</p>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-success animate-fade-in">
              <Check className="w-5 h-5" />
              <FileText className="w-4 h-4" />
              <span className="truncate">{file.name}</span>
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Отмена
            </Button>
            <Button onClick={handleNext} disabled={!file || isParsing}>
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Анализ...
                </>
              ) : (
                'Далее'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

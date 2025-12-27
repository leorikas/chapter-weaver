import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Upload, Check, FileText } from 'lucide-react';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, mode: 'auto' | 'manual') => void;
}

export function BulkUploadDialog({ open, onOpenChange, onUpload }: BulkUploadDialogProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleSubmit = () => {
    if (file) {
      onUpload(file, mode);
      setFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!file}>
              Далее
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

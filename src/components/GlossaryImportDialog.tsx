import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { importGlossaryFromJson, GlossaryTerm } from '@/lib/glossaryUtils';

interface GlossaryImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (terms: GlossaryTerm[]) => void;
}

export function GlossaryImportDialog({ open, onOpenChange, onImport }: GlossaryImportDialogProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState(`[
  { "original": "Term", "russian-translation": "Термин" },
  ...
]`);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      processFile(file);
    } else {
      toast.error('Только JSON файлы');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      const terms = importGlossaryFromJson(text);
      onImport(terms);
      toast.success(`Импортировано ${terms.length} терминов`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Ошибка при чтении файла');
    }
  };

  const handleTextImport = () => {
    try {
      const terms = importGlossaryFromJson(textInput);
      onImport(terms);
      toast.success(`Импортировано ${terms.length} терминов`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Ошибка парсинга JSON');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Импорт глоссария</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'file' | 'text')} className="mt-4">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-6 h-auto p-0">
            <TabsTrigger 
              value="file" 
              className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0"
            >
              Импорт из файла
            </TabsTrigger>
            <TabsTrigger 
              value="text"
              className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0"
            >
              Вставить текст
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground">
                <span className="text-primary font-medium">Нажмите для выбора файла</span>{' '}
                или перетащите
              </p>
              <p className="text-sm text-muted-foreground mt-2">Только .json</p>
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-6 space-y-4">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="bg-secondary border-border font-mono text-sm min-h-[200px]"
              placeholder='[
  { "original": "哈利·波特", "russian-translation": "Гарри Поттер" },
  ...
]'
            />
            <div className="flex justify-end">
              <Button variant="gradient" onClick={handleTextImport}>
                Импортировать текст
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

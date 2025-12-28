import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, ChevronDown, ChevronUp, Trash2, PenLine, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { downloadGlossary, GlossaryTerm } from '@/lib/glossaryUtils';
import { GlossaryImportDialog } from './GlossaryImportDialog';

interface GlossaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
}

export function GlossaryDialog({ open, onOpenChange, projectTitle }: GlossaryDialogProps) {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Form state
  const [original, setOriginal] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [russianTranslation, setRussianTranslation] = useState('');
  const [altRussianTranslation, setAltRussianTranslation] = useState('');
  const [gender, setGender] = useState<'masc' | 'femn' | 'neut' | null>(null);

  const filteredTerms = terms.filter(term =>
    term.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.russianTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.englishTranslation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    if (terms.length === 0) {
      toast.error('Глоссарий пуст');
      return;
    }
    downloadGlossary(terms, `glossary_${projectTitle.replace(/\s+/g, '_')}.json`);
    toast.success('Глоссарий экспортирован');
  };

  const handleImport = (importedTerms: GlossaryTerm[]) => {
    setTerms([...terms, ...importedTerms]);
  };

  const handleAddTerm = () => {
    if (!original.trim() || !russianTranslation.trim()) {
      toast.error('Заполните обязательные поля (Оригинал и Русский)');
      return;
    }

    const newTerm: GlossaryTerm = {
      id: Date.now().toString(),
      original,
      englishTranslation,
      russianTranslation,
      altRussianTranslation,
      gender,
    };

    setTerms([...terms, newTerm]);
    toast.success('Термин добавлен');

    // Reset form
    setOriginal('');
    setEnglishTranslation('');
    setRussianTranslation('');
    setAltRussianTranslation('');
    setGender(null);
  };

  const handleDeleteTerm = (id: string) => {
    setTerms(terms.filter(t => t.id !== id));
    toast.success('Термин удалён');
  };

  const handleClearAll = () => {
    setTerms([]);
    toast.success('Глоссарий очищен');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                Глоссарий проекта "{projectTitle}"
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Поиск по терминам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-secondary border-border"
                />
                <Button variant="outline" size="icon" onClick={() => setImportDialogOpen(true)} title="Импорт">
                  <Upload className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleExport} title="Экспорт">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="destructive" onClick={handleClearAll}>
                  Очистить
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Table */}
          <div className="flex-1 overflow-auto mt-4">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left">
                  <th className="p-3 text-muted-foreground font-medium">ОРИГИНАЛ</th>
                  <th className="p-3 text-muted-foreground font-medium">АНГЛИЙСКИЙ</th>
                  <th className="p-3 text-muted-foreground font-medium">РУССКИЙ</th>
                  <th className="p-3 text-muted-foreground font-medium">АЛЬТЕРНАТИВЫ</th>
                  <th className="p-3 text-muted-foreground font-medium">РОД</th>
                  <th className="p-3 text-muted-foreground font-medium text-right">ДЕЙСТВИЯ</th>
                </tr>
              </thead>
              <tbody>
                {filteredTerms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Глоссарий пуст. Добавьте первый термин ниже или импортируйте из файла.
                    </td>
                  </tr>
                ) : (
                  filteredTerms.map((term) => (
                    <tr key={term.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="p-3 font-medium">{term.original}</td>
                      <td className="p-3 text-muted-foreground">{term.englishTranslation}</td>
                      <td className="p-3">{term.russianTranslation}</td>
                      <td className="p-3 text-muted-foreground">{term.altRussianTranslation || '—'}</td>
                      <td className="p-3 text-muted-foreground">
                        {term.gender === 'masc' ? 'М' : term.gender === 'femn' ? 'Ж' : term.gender === 'neut' ? 'С' : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <PenLine className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteTerm(term.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Term Form */}
          <div className="flex-shrink-0 border-t border-border mt-4 pt-4">
            <button
              className="flex items-center gap-2 text-foreground font-medium mb-4"
              onClick={() => setIsFormExpanded(!isFormExpanded)}
            >
              Добавить новый термин
              {isFormExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isFormExpanded && (
              <div className="space-y-4">
                {/* Row 1: Text inputs */}
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">Оригинал</Label>
                    <Input
                      value={original}
                      onChange={(e) => setOriginal(e.target.value)}
                      className="bg-secondary border-border"
                      placeholder="哈利·波特"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">Английский</Label>
                    <Input
                      value={englishTranslation}
                      onChange={(e) => setEnglishTranslation(e.target.value)}
                      className="bg-secondary border-border"
                      placeholder="Harry Potter"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">Русский</Label>
                    <Input
                      value={russianTranslation}
                      onChange={(e) => setRussianTranslation(e.target.value)}
                      className="bg-secondary border-border"
                      placeholder="Гарри Поттер"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">Альт. перевод</Label>
                    <Input
                      value={altRussianTranslation}
                      onChange={(e) => setAltRussianTranslation(e.target.value)}
                      className="bg-secondary border-border"
                      placeholder="Нет"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">Род</Label>
                    <div className="flex gap-1">
                      {(['masc', 'femn', 'neut', null] as const).map((g) => (
                        <Button
                          key={g || 'none'}
                          variant={gender === g ? 'default' : 'secondary'}
                          size="sm"
                          onClick={() => setGender(g)}
                          className="flex-1"
                        >
                          {g === 'masc' ? 'М' : g === 'femn' ? 'Ж' : g === 'neut' ? 'С' : '—'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                  <Button variant="gradient" className="px-12" onClick={handleAddTerm}>
                    Добавить
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <GlossaryImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
      />
    </>
  );
}

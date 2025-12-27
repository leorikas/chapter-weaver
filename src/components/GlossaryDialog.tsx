import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { X, ChevronDown, ChevronUp, Trash2, PenLine } from 'lucide-react';
import { toast } from 'sonner';

interface GlossaryTerm {
  id: string;
  original: string;
  english: string;
  russian: string;
  alternatives: string;
  isProperName: boolean;
  gender: 'M' | 'F' | 'N' | null;
  animacy: 'animate' | 'inanimate' | null;
  number: 'singular' | 'plural' | null;
  description: string;
}

interface GlossaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
}

export function GlossaryDialog({ open, onOpenChange, projectTitle }: GlossaryDialogProps) {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormExpanded, setIsFormExpanded] = useState(true);

  // Form state
  const [original, setOriginal] = useState('');
  const [english, setEnglish] = useState('');
  const [russian, setRussian] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [isProperName, setIsProperName] = useState(false);
  const [gender, setGender] = useState<'M' | 'F' | 'N' | null>(null);
  const [animacy, setAnimacy] = useState<'animate' | 'inanimate' | null>(null);
  const [number, setNumber] = useState<'singular' | 'plural' | null>(null);
  const [description, setDescription] = useState('');

  const filteredTerms = terms.filter(term =>
    term.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.russian.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.english.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTerm = () => {
    if (!original.trim() || !russian.trim()) {
      toast.error('Заполните обязательные поля (Оригинал и Русский)');
      return;
    }

    const newTerm: GlossaryTerm = {
      id: Date.now().toString(),
      original,
      english,
      russian,
      alternatives,
      isProperName,
      gender,
      animacy,
      number,
      description,
    };

    setTerms([...terms, newTerm]);
    toast.success('Термин добавлен');

    // Reset form
    setOriginal('');
    setEnglish('');
    setRussian('');
    setAlternatives('');
    setIsProperName(false);
    setGender(null);
    setAnimacy(null);
    setNumber(null);
    setDescription('');
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
                <th className="p-3 text-muted-foreground font-medium text-right">ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Глоссарий пуст. Добавьте первый термин ниже.
                  </td>
                </tr>
              ) : (
                filteredTerms.map((term) => (
                  <tr key={term.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="p-3 font-medium">{term.original}</td>
                    <td className="p-3 text-muted-foreground">{term.english}</td>
                    <td className="p-3">{term.russian}</td>
                    <td className="p-3 text-muted-foreground">{term.alternatives}</td>
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
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-1 block">Оригинал</Label>
                  <Input
                    value={original}
                    onChange={(e) => setOriginal(e.target.value)}
                    className="bg-secondary border-border"
                    placeholder="林白"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-1 block">Английский</Label>
                  <Input
                    value={english}
                    onChange={(e) => setEnglish(e.target.value)}
                    className="bg-secondary border-border"
                    placeholder="Lin Bai"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-1 block">Русский</Label>
                  <Input
                    value={russian}
                    onChange={(e) => setRussian(e.target.value)}
                    className="bg-secondary border-border"
                    placeholder="Линь Бай"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-1 block">Альтернативы</Label>
                  <Input
                    value={alternatives}
                    onChange={(e) => setAlternatives(e.target.value)}
                    className="bg-secondary border-border"
                    placeholder="Лин Бай, Лінь Бай"
                  />
                </div>
              </div>

              {/* Row 2: Toggles */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Имя собственное</Label>
                  <Switch checked={isProperName} onCheckedChange={setIsProperName} />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Род</Label>
                  <div className="flex gap-1">
                    {(['M', 'F', 'N', null] as const).map((g) => (
                      <Button
                        key={g || 'none'}
                        variant={gender === g ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => setGender(g)}
                      >
                        {g === 'M' ? '-М-' : g === 'F' ? '-Ж-' : g === 'N' ? '-С-' : 'Нет'}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Одушевленность</Label>
                  <div className="flex gap-1">
                    {(['animate', 'inanimate', null] as const).map((a) => (
                      <Button
                        key={a || 'none'}
                        variant={animacy === a ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => setAnimacy(a)}
                      >
                        {a === 'animate' ? 'Одуш.' : a === 'inanimate' ? 'Неод.' : 'Нет'}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Число</Label>
                  <div className="flex gap-1">
                    {(['singular', 'plural', null] as const).map((n) => (
                      <Button
                        key={n || 'none'}
                        variant={number === n ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => setNumber(n)}
                      >
                        {n === 'singular' ? 'Ед.' : n === 'plural' ? 'Мн.' : 'Нет'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Description + Submit */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground mb-1 block">Описание (info)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-secondary border-border"
                    placeholder="Например: Имя персонажа, волшебник"
                  />
                </div>
                <Button variant="gradient" className="self-end px-12" onClick={handleAddTerm}>
                  Добавить
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

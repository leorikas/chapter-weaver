import { useState } from 'react';
import { X, Trash2, Lock, Unlock } from 'lucide-react';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  details?: string;
}

interface LogsPanelProps {
  projectTitle: string;
  logs: LogEntry[];
  onClearLogs: () => void;
  onClose: () => void;
}

export function LogsPanel({ projectTitle, logs, onClearLogs, onClose }: LogsPanelProps) {
  const [clearOnStart, setClearOnStart] = useState(false);
  const [blockAutoScroll, setBlockAutoScroll] = useState(true);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">Логи Перевода</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          Проект: {projectTitle}
        </p>
      </div>

      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Очищать при новом запуске</span>
          <Switch checked={clearOnStart} onCheckedChange={setClearOnStart} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Блокировать автоскролл</span>
          <Switch checked={blockAutoScroll} onCheckedChange={setBlockAutoScroll} />
        </div>
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={onClearLogs}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Стереть все логи вручную
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Логи пусты
            </p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2">
                <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
                <span className={getLogColor(log.type)}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { checkServerHealth } from '@/lib/api';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ServerStatusIndicatorProps {
  className?: string;
}

export function ServerStatusIndicator({ className }: ServerStatusIndicatorProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const checkStatus = async () => {
      const isHealthy = await checkServerHealth();
      setStatus(isHealthy ? 'connected' : 'disconnected');
    };

    // Проверяем сразу
    checkStatus();

    // Проверяем каждые 5 секунд
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-success';
      case 'disconnected':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Сервер подключён';
      case 'disconnected':
        return 'Сервер недоступен';
      default:
        return 'Проверка подключения...';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              status === 'connected' 
                ? 'border-success/30 bg-success/10' 
                : status === 'disconnected'
                  ? 'border-destructive/30 bg-destructive/10'
                  : 'border-border bg-secondary/50'
            } ${className}`}
          >
            <span className={getStatusColor()}>{getIcon()}</span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {status === 'connected' ? 'Online' : status === 'disconnected' ? 'Offline' : '...'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusText()}</p>
          <p className="text-xs text-muted-foreground">localhost:8000</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

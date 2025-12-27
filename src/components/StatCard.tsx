import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  suffix?: string;
}

export function StatCard({ label, value, icon, suffix }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div>
        <p className="text-muted-foreground text-sm mb-1">{label}</p>
        <p className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
          {suffix && <span className="text-success ml-1">{suffix}</span>}
        </p>
      </div>
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary">
        {icon}
      </div>
    </div>
  );
}

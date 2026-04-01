import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CookingTimerProps {
  startedAt: string;
  estimatedMinutes: number;
  compact?: boolean;
}

export function useCookingElapsed(startedAt: string) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startedAt]);
  return elapsed;
}

export function getTimerColor(elapsedSec: number, estimatedMin: number) {
  const pct = elapsedSec / (estimatedMin * 60);
  if (pct > 1) return 'error';
  if (pct > 0.7) return 'warning';
  return 'success';
}

export function getOverdueMinutes(elapsedSec: number, estimatedMin: number) {
  const overSec = elapsedSec - estimatedMin * 60;
  return overSec > 0 ? Math.ceil(overSec / 60) : 0;
}

export default function CookingTimer({ startedAt, estimatedMinutes, compact = false }: CookingTimerProps) {
  const elapsed = useCookingElapsed(startedAt);
  const color = getTimerColor(elapsed, estimatedMinutes);
  const overdue = getOverdueMinutes(elapsed, estimatedMinutes);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;

  const colorClasses = {
    success: 'text-w-success',
    warning: 'text-w-warning',
    error: 'text-w-error',
  };

  const bgClasses = {
    success: 'bg-w-success/15',
    warning: 'bg-w-warning/15',
    error: 'bg-w-error/15',
  };

  if (compact) {
    return (
      <span className={cn('font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px]', bgClasses[color], colorClasses[color])}>
        {overdue > 0 ? `⏰ +${overdue}m` : `${min}:${sec.toString().padStart(2, '0')}`}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={cn('font-mono text-[14px] font-bold', colorClasses[color])}>
        {min}:{sec.toString().padStart(2, '0')}
      </span>
      <span className="text-[11px] text-w-text-secondary">/ {estimatedMinutes} min</span>
      {overdue > 0 && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-w-error/15 text-w-error font-semibold animate-pulse">
          ⏰ RETRASADO +{overdue}min
        </span>
      )}
    </div>
  );
}

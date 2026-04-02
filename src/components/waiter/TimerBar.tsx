import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TimerBarProps {
  totalSeconds: number;
  onExpire?: () => void;
  color?: 'warning' | 'success' | 'error' | 'brand';
  showCountdown?: boolean;
  countdownSize?: 'sm' | 'lg';
}

export default function TimerBar({ totalSeconds, onExpire, color = 'warning', showCountdown = true, countdownSize = 'sm' }: TimerBarProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const pct = (remaining / totalSeconds) * 100;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;

  const colorMap = {
    warning: 'bg-w-warning',
    success: 'bg-w-success',
    error: 'bg-w-error',
  };
  const textColorMap = {
    warning: 'text-w-warning',
    success: 'text-w-success',
    error: 'text-w-error',
  };

  return (
    <div>
      {showCountdown && (
        <p className={cn('font-mono font-bold text-center', textColorMap[color], countdownSize === 'lg' ? 'text-[28px]' : 'text-sm')}>
          {min}:{sec.toString().padStart(2, '0')}
        </p>
      )}
      <div className="w-full h-1 bg-w-border rounded-full mt-1 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000 ease-linear', colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

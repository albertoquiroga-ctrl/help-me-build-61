import { cn } from '@/lib/utils';
import type { NotifPriority } from '@/stores/notificationsStore';

const borderColors: Record<NotifPriority, string> = {
  low: 'border-l-w-warning',
  medium: 'border-l-w-priority',
  high: 'border-l-w-success',
  urgent: 'border-l-w-error',
};

interface NotificationCardProps {
  priority: NotifPriority;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function NotificationCard({ priority, title, subtitle, children, className, onClick }: NotificationCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[10px] border border-w-border bg-w-surface p-3.5 border-l-[3px]',
        borderColors[priority],
        priority === 'urgent' && 'bg-w-error/[0.08] border-l-[4px]',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
    >
      <p className="text-[13px] font-semibold text-w-text">{title}</p>
      {subtitle && <p className="text-[11px] text-w-text-secondary mt-0.5">{subtitle}</p>}
      {children}
    </div>
  );
}

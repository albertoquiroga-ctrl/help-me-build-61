import { cn } from '@/lib/utils';
import type { NotifPriority, NotifChannel } from '@/stores/notificationsStore';

const borderColors: Record<NotifPriority, string> = {
  low: 'border-l-w-warning',
  medium: 'border-l-w-priority',
  high: 'border-l-w-success',
  urgent: 'border-l-w-error',
};

const channelLabels: Record<NotifChannel, string> = {
  mesas: 'Mesas',
  gerente: 'Gerente',
  cocina: 'Cocina',
  barra: 'Barra',
  hostess: 'Hostess',
};

interface NotificationCardProps {
  priority: NotifPriority;
  title: string;
  subtitle?: string;
  channel?: NotifChannel;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function NotificationCard({ priority, title, subtitle, channel, children, className, onClick }: NotificationCardProps) {
  const isInternal = channel && channel !== 'mesas';

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
      <div className="flex items-center gap-2">
        {isInternal && (
          <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-w-elevated text-w-text-secondary">
            {channelLabels[channel]}
          </span>
        )}
        <p className="text-[13px] font-semibold text-w-text flex-1">{title}</p>
      </div>
      {subtitle && <p className="text-[11px] text-w-text-secondary mt-0.5">{subtitle}</p>}
      {children}
    </div>
  );
}

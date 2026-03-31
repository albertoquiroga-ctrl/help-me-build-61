import { cn } from '@/lib/utils';
import type { GuestInfo } from '@/stores/tablesStore';

export default function GuestPill({ guest }: { guest: GuestInfo }) {
  const isPaid = guest.paymentStatus === 'paid';
  const isLeft = guest.paymentStatus === 'left';
  const isFailed = guest.paymentStatus === 'failed';
  const hasNoOrder = guest.orderMethod === 'manual' && guest.amountOwed === 0;

  const methodIcon = guest.orderMethod === 'manual' ? '✏️' : '📱';
  const paymentIcon =
    guest.paymentMethod === 'cash' ? '💵'
    : guest.paymentMethod === 'card-physical' ? '💳'
    : guest.paymentMethod === 'qr' ? '📱'
    : null;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border font-mono text-[11px] whitespace-nowrap',
      isPaid
        ? 'bg-w-success/10 border-w-success/30 text-w-success'
        : isLeft
          ? 'bg-w-text-secondary/10 border-w-border text-w-text-secondary line-through'
          : isFailed
            ? 'bg-w-error/10 border-w-error/30 text-w-error'
            : hasNoOrder
              ? 'bg-w-warning/10 border-w-warning/30 text-w-warning'
              : 'bg-w-priority/10 border-w-priority/30 text-w-priority'
    )}>
      {methodIcon} {guest.name}
      {hasNoOrder
        ? ' · ⚠️ Sin pedido'
        : isPaid
          ? ` · ${paymentIcon || '✓'} $${guest.amountPaid}`
          : ` → $${guest.amountOwed}`
      }
    </span>
  );
}
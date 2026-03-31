import { cn } from '@/lib/utils';
import type { GuestInfo } from '@/stores/tablesStore';

export default function GuestPill({ guest }: { guest: GuestInfo }) {
  const isPaid = guest.paymentStatus === 'paid';
  const isLeft = guest.paymentStatus === 'left';
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border font-mono text-[11px] whitespace-nowrap',
      isPaid
        ? 'bg-w-success/10 border-w-success/30 text-w-success'
        : isLeft
          ? 'bg-w-text-secondary/10 border-w-border text-w-text-secondary line-through'
          : 'bg-w-priority/10 border-w-priority/30 text-w-priority'
    )}>
      {guest.name} {isPaid ? '·' : '→'} ${guest.paymentStatus === 'paid' ? guest.amountPaid : guest.amountOwed}
      {isPaid && ' ✓'}
    </span>
  );
}

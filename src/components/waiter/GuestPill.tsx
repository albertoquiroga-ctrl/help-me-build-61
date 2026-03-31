import { cn } from '@/lib/utils';
import type { GuestInfo } from '@/stores/tablesStore';
import { guestDisplayName } from '@/stores/tablesStore';
import { useState } from 'react';
import { useTablesStore } from '@/stores/tablesStore';

interface GuestPillProps {
  guest: GuestInfo;
  tableId?: string;
  editable?: boolean;
}

export default function GuestPill({ guest, tableId, editable = false }: GuestPillProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(guest.name);
  const renameGuest = useTablesStore((s) => s.renameGuest);

  const isPaid = guest.paymentStatus === 'paid';
  const isLeft = guest.paymentStatus === 'left';
  const isFailed = guest.paymentStatus === 'failed';
  const hasNoOrder = guest.orderMethod === 'manual' && guest.amountOwed === 0;

  const hasSeat = !!guest.seatLabel;
  const isQR = guest.orderMethod === 'qr';
  const isGenericGuest = /^Guest \d+$/i.test(guest.name);
  const methodIcon = hasSeat ? '🪑' : isQR ? '📱' : isGenericGuest ? '👤' : '👤';

  const displayName = guestDisplayName(guest);

  const paymentIcon =
    guest.paymentMethod === 'cash' ? '💵'
    : guest.paymentMethod === 'card-physical' ? '💳'
    : guest.paymentMethod === 'qr' ? '📱'
    : null;

  const handleSubmitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== guest.name && tableId) {
      renameGuest(tableId, guest.id, trimmed);
    }
    setEditing(false);
  };

  if (editing && editable && tableId) {
    return (
      <input
        autoFocus
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        onBlur={handleSubmitRename}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitRename(); if (e.key === 'Escape') setEditing(false); }}
        className="inline-flex items-center px-2.5 py-1 rounded-[6px] border border-w-brand bg-w-surface font-mono text-[11px] text-w-text w-24 focus:outline-none"
      />
    );
  }

  return (
    <span
      onClick={() => { if (editable && tableId) { setEditName(guest.name); setEditing(true); } }}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border font-mono text-[11px] whitespace-nowrap',
        editable && 'cursor-pointer active:scale-95 transition-transform',
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
      {methodIcon} {displayName}
      {!hasSeat && <span className="text-[9px] opacity-60">⊘</span>}
      {hasNoOrder
        ? ' · ⚠️ Sin pedido'
        : isPaid
          ? ` · ${paymentIcon || '✓'} $${guest.amountPaid}`
          : ` → $${guest.amountOwed}`
      }
    </span>
  );
}

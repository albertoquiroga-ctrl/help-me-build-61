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

type EditMode = null | 'name' | 'seat';

export default function GuestPill({ guest, tableId, editable = false }: GuestPillProps) {
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editValue, setEditValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const renameGuest = useTablesStore((s) => s.renameGuest);
  const assignSeat = useTablesStore((s) => s.assignSeat);

  const isPaid = guest.paymentStatus === 'paid';
  const isLeft = guest.paymentStatus === 'left';
  const isFailed = guest.paymentStatus === 'failed';
  const hasNoOrder = guest.orderMethod === 'manual' && guest.amountOwed === 0;

  const hasSeat = !!guest.seatLabel;
  const isQR = guest.orderMethod === 'qr';
  const isGenericGuest = /^Guest \d+$/i.test(guest.name);
  const methodIcon = hasSeat ? '🪑' : isQR ? '📱' : '👤';

  const displayName = guestDisplayName(guest);

  const paymentIcon =
    guest.paymentMethod === 'cash' ? '💵'
    : guest.paymentMethod === 'card-physical' ? '💳'
    : guest.paymentMethod === 'qr' ? '📱'
    : null;

  const handleSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && tableId) {
      if (editMode === 'name' && trimmed !== guest.name) {
        renameGuest(tableId, guest.id, trimmed);
      }
      if (editMode === 'seat') {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num > 0) {
          assignSeat(tableId, guest.id, num);
        }
      }
    }
    setEditMode(null);
    setShowMenu(false);
  };

  // Inline edit input
  if (editMode && editable && tableId) {
    return (
      <input
        autoFocus
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setEditMode(null); setShowMenu(false); } }}
        placeholder={editMode === 'seat' ? '# silla' : 'Nombre'}
        className={cn(
          'inline-flex items-center px-2.5 py-1 rounded-[6px] border border-w-brand bg-w-surface font-mono text-[11px] text-w-text focus:outline-none',
          editMode === 'seat' ? 'w-16 text-center' : 'w-28'
        )}
      />
    );
  }

  return (
    <span className="relative inline-flex">
      <span
        onClick={() => { if (editable && tableId) setShowMenu(!showMenu); }}
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

      {/* Edit menu */}
      {showMenu && editable && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-w-elevated border border-w-border rounded-[8px] shadow-lg py-1 min-w-[140px]">
            <button
              onClick={() => { setEditValue(guest.name); setEditMode('name'); }}
              className="w-full text-left px-3 py-2 text-[12px] text-w-text hover:bg-w-surface transition-colors"
            >
              ✏️ Renombrar
            </button>
            <button
              onClick={() => { setEditValue(guest.seatNumber?.toString() || ''); setEditMode('seat'); }}
              className="w-full text-left px-3 py-2 text-[12px] text-w-text hover:bg-w-surface transition-colors"
            >
              🪑 {hasSeat ? 'Cambiar silla' : 'Asignar silla'}
            </button>
          </div>
        </>
      )}
    </span>
  );
}

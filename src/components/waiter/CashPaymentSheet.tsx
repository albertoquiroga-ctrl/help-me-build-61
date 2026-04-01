import { motion } from 'framer-motion';
import { X, Split, Check, Heart } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTablesStore, guestDisplayName, type GuestInfo, type OrderItem, type Round, type ItemAssignment } from '@/stores/tablesStore';
import { useTipsStore } from '@/stores/tipsStore';
import { toast } from 'sonner';

interface FlatItem {
  roundNumber: number;
  itemIndex: number;
  name: string;
  qty: number;
  price: number;
  total: number;
  assignedTo?: string;
  assignedName?: string;
}

interface Props {
  tableId: string;
  tableNumber: number;
  guest: GuestInfo;
  rounds: Round[];
  allGuests: GuestInfo[];
  onDismiss: () => void;
}

const TIP_PERCENTAGES = [10, 15, 20];

export default function CashPaymentSheet({ tableId, tableNumber, guest, rounds, allGuests, onDismiss }: Props) {
  const assignItemsAndPay = useTablesStore((s) => s.assignItemsAndPay);
  const addTip = useTipsStore((s) => s.addTip);

  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    rounds.forEach((r) => {
      r.items.forEach((item, idx) => {
        const owner = item.assignedTo ? allGuests.find((g) => g.id === item.assignedTo) : null;
        items.push({
          roundNumber: r.number,
          itemIndex: idx,
          name: item.name,
          qty: item.qty,
          price: item.price,
          total: item.price * item.qty,
          assignedTo: item.assignedTo,
          assignedName: owner?.name,
        });
      });
    });
    return items;
  }, [rounds, allGuests]);

  const [selected, setSelected] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    flatItems.forEach((fi) => {
      if (fi.assignedTo === guest.id) initial.add(`${fi.roundNumber}-${fi.itemIndex}`);
    });
    return initial;
  });

  const [splits, setSplits] = useState<Record<string, number>>({});
  const [tipMode, setTipMode] = useState<'none' | 'percent' | 'custom'>('none');
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');

  const toggleItem = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const maxSplit = allGuests.length;

  const toggleSplit = (key: string) => {
    setSplits((prev) => {
      const current = prev[key] || 1;
      if (current < maxSplit) return { ...prev, [key]: current + 1 };
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const subtotal = useMemo(() => {
    let total = 0;
    flatItems.forEach((fi) => {
      const key = `${fi.roundNumber}-${fi.itemIndex}`;
      if (selected.has(key)) {
        const splitCount = splits[key] || 1;
        total += fi.total / splitCount;
      }
    });
    return Math.round(total * 100) / 100;
  }, [selected, splits, flatItems]);

  const tipAmount = useMemo(() => {
    if (tipMode === 'percent' && tipPercent) {
      return Math.round(subtotal * tipPercent / 100);
    }
    if (tipMode === 'custom' && customTip) {
      return Math.max(0, parseInt(customTip) || 0);
    }
    return 0;
  }, [tipMode, tipPercent, customTip, subtotal]);

  const grandTotal = subtotal + tipAmount;

  const handlePay = (method: 'cash' | 'card-physical') => {
    const assignments: ItemAssignment[] = [];
    selected.forEach((key) => {
      const [rn, ii] = key.split('-').map(Number);
      assignments.push({ roundNumber: rn, itemIndex: ii, splitCount: splits[key] || 1 });
    });
    assignItemsAndPay(tableId, guest.id, method, assignments, tipAmount);

    if (tipAmount > 0) {
      addTip({
        tableNumber,
        round: 0,
        amount: tipAmount,
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        guestName: guestDisplayName(guest),
      });
    }

    const label = method === 'cash' ? '💵 Efectivo' : '💳 Tarjeta física';
    const tipLabel = tipAmount > 0 ? ` · propina $${tipAmount}` : '';
    toast.success(`${label} · ${guestDisplayName(guest)} · $${grandTotal}${tipLabel}`);
    onDismiss();
  };

  const hasSelection = selected.size > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onDismiss}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[51] bg-w-elevated rounded-t-[16px] border-t border-w-border max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 shrink-0">
          <div>
            <h3 className="text-[14px] font-semibold text-w-text">💰 Cobrar · {guestDisplayName(guest)}</h3>
            <p className="text-[11px] text-w-text-secondary">Selecciona los items de este comensal</p>
          </div>
          <button onClick={onDismiss} className="w-11 h-11 flex items-center justify-center">
            <X size={18} className="text-w-text-secondary" />
          </button>
        </div>

        {/* Items checklist */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1.5">
          {flatItems.map((fi) => {
            const key = `${fi.roundNumber}-${fi.itemIndex}`;
            const isSelected = selected.has(key);
            const isOtherGuest = fi.assignedTo && fi.assignedTo !== guest.id;
            const otherGuestPaid = isOtherGuest && allGuests.find((g) => g.id === fi.assignedTo)?.paymentStatus === 'paid';
            const splitCount = splits[key] || 1;
            const displayPrice = splitCount > 1 ? fi.total / splitCount : fi.total;
            const isDisabled = !!otherGuestPaid;

            return (
              <button
                key={key}
                onClick={() => !isDisabled && toggleItem(key)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 p-2.5 rounded-[8px] border transition-all min-h-[44px] text-left ${
                  isDisabled
                    ? 'border-w-border/50 bg-w-surface/50 opacity-50'
                    : isSelected
                    ? 'border-w-brand/40 bg-w-brand/5'
                    : 'border-w-border bg-w-surface'
                }`}
              >
                <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-w-brand bg-w-brand' : 'border-w-text-secondary/40'
                }`}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] text-w-text truncate">{fi.name} ×{fi.qty}</span>
                    {isOtherGuest && !otherGuestPaid && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-w-text-secondary/10 text-w-text-secondary shrink-0">
                        {fi.assignedName}
                      </span>
                    )}
                    {otherGuestPaid && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-w-success/10 text-w-success shrink-0">
                        ✓ {fi.assignedName}
                      </span>
                    )}
                  </div>
                  {splitCount > 1 && (
                    <span className="text-[10px] text-w-brand">÷{splitCount} = ${displayPrice.toFixed(0)} c/u</span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-mono text-[13px] ${isSelected ? 'text-w-text font-medium' : 'text-w-text-secondary'}`}>
                    ${splitCount > 1 ? displayPrice.toFixed(0) : fi.total}
                  </span>
                  {isSelected && !isDisabled && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSplit(key); }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        splitCount > 1 ? 'bg-w-brand/15 text-w-brand' : 'bg-w-surface text-w-text-secondary'
                      }`}
                    >
                      <Split size={12} />
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tip section */}
        {hasSelection && (
          <div className="shrink-0 border-t border-w-border px-4 pt-3 pb-2 space-y-2">
            <div className="flex items-center gap-2">
              <Heart size={14} className="text-w-priority" />
              <span className="text-[12px] font-medium text-w-text">Propina</span>
            </div>
            <div className="flex gap-1.5">
              {TIP_PERCENTAGES.map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    if (tipMode === 'percent' && tipPercent === pct) {
                      setTipMode('none');
                      setTipPercent(null);
                    } else {
                      setTipMode('percent');
                      setTipPercent(pct);
                      setCustomTip('');
                    }
                  }}
                  className={`flex-1 h-9 rounded-[6px] border text-[12px] font-medium transition-colors ${
                    tipMode === 'percent' && tipPercent === pct
                      ? 'border-w-priority/50 bg-w-priority/10 text-w-priority'
                      : 'border-w-border text-w-text-secondary hover:border-w-text-secondary/50'
                  }`}
                >
                  {pct}% · ${Math.round(subtotal * pct / 100)}
                </button>
              ))}
              <button
                onClick={() => {
                  if (tipMode === 'custom') {
                    setTipMode('none');
                    setCustomTip('');
                  } else {
                    setTipMode('custom');
                    setTipPercent(null);
                  }
                }}
                className={`px-3 h-9 rounded-[6px] border text-[12px] font-medium transition-colors ${
                  tipMode === 'custom'
                    ? 'border-w-priority/50 bg-w-priority/10 text-w-priority'
                    : 'border-w-border text-w-text-secondary hover:border-w-text-secondary/50'
                }`}
              >
                Otro
              </button>
            </div>
            {tipMode === 'custom' && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-w-text-secondary">$</span>
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder="Monto de propina"
                  className="w-full h-10 pl-7 pr-3 rounded-[8px] bg-w-surface border border-w-border text-[13px] text-w-text placeholder:text-w-text-secondary focus:outline-none focus:ring-1 focus:ring-w-priority"
                  min={0}
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 border-t border-w-border px-4 pt-3 pb-4 space-y-3">
          <div className="space-y-1 px-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-w-text-secondary">Subtotal</span>
              <span className="font-mono text-[14px] text-w-text">${subtotal}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-w-priority">💝 Propina</span>
                <span className="font-mono text-[14px] text-w-priority font-medium">${tipAmount}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-w-border/50">
              <span className="text-[13px] text-w-text font-medium">Total a cobrar</span>
              <span className="font-mono text-[20px] font-bold text-w-text">${grandTotal}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePay('cash')}
              disabled={!hasSelection}
              className="flex-1 h-12 rounded-[8px] bg-w-success text-white font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              💵 Pagó efectivo ✓
            </button>
            <button
              onClick={() => handlePay('card-physical')}
              disabled={!hasSelection}
              className="flex-1 h-12 rounded-[8px] bg-w-brand text-white font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              💳 Pagó tarjeta ✓
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

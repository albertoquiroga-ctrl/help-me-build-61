import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTablesStore, type GuestInfo, type OrderItem } from '@/stores/tablesStore';
import { toast } from 'sonner';

interface Props {
  tableId: string;
  guest: GuestInfo;
  allItems: OrderItem[];
  onDismiss: () => void;
}

export default function CashPaymentSheet({ tableId, guest, allItems, onDismiss }: Props) {
  const markGuestPaidCash = useTablesStore((s) => s.markGuestPaidCash);
  const guestItems = allItems.filter((i) => i.assignedTo === guest.id);
  const hasAssigned = guestItems.length > 0;

  const handlePay = (method: 'cash' | 'card-physical') => {
    markGuestPaidCash(tableId, guest.id, method);
    const label = method === 'cash' ? '💵 Efectivo' : '💳 Tarjeta física';
    toast.success(`${label} · ${guest.name} · $${guest.amountOwed}`);
    onDismiss();
  };

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
        className="fixed bottom-0 left-0 right-0 z-[51] bg-w-elevated rounded-t-[16px] border-t border-w-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div>
            <h3 className="text-[14px] font-semibold text-w-text">💰 Cobrar en mesa</h3>
            <p className="text-[12px] text-w-text-secondary">{guest.name}</p>
          </div>
          <button onClick={onDismiss} className="w-11 h-11 flex items-center justify-center">
            <X size={18} className="text-w-text-secondary" />
          </button>
        </div>

        <div className="px-4 pb-4 space-y-3">
          {/* Breakdown */}
          {hasAssigned ? (
            <div className="rounded-[8px] border border-w-border bg-w-surface p-3 space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-w-text-secondary mb-1">Desglose</p>
              {guestItems.map((item, i) => (
                <div key={i} className="flex justify-between text-[12px]">
                  <span className="text-w-text">{item.name} ×{item.qty}</span>
                  <span className="font-mono text-w-text-secondary">${item.price * item.qty}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[8px] border border-w-border bg-w-surface p-3">
              <p className="text-[12px] text-w-text-secondary text-center">Sin items asignados individualmente</p>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[13px] text-w-text font-medium">Total a cobrar</span>
            <span className="font-mono text-[18px] font-bold text-w-text">${guest.amountOwed}</span>
          </div>

          {/* Payment buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handlePay('cash')}
              className="flex-1 h-12 rounded-[8px] bg-w-success text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            >
              💵 Pagó efectivo ✓
            </button>
            <button
              onClick={() => handlePay('card-physical')}
              className="flex-1 h-12 rounded-[8px] bg-w-brand text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            >
              💳 Pagó tarjeta ✓
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
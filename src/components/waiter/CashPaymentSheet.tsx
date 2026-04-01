import { motion } from 'framer-motion';
import { X, Heart } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTablesStore, computeTableBill, computeTotalPaid } from '@/stores/tablesStore';
import { useTipsStore } from '@/stores/tipsStore';
import { toast } from 'sonner';

interface Props {
  tableId: string;
  tableNumber: number;
  onDismiss: () => void;
}

const TIP_PERCENTAGES = [10, 15, 20];

const QUICK_AMOUNTS = [50, 100, 200, 500];

export default function CashPaymentSheet({ tableId, tableNumber, onDismiss }: Props) {
  const table = useTablesStore((s) => s.tables.find((t) => t.id === tableId));
  const recordPayment = useTablesStore((s) => s.recordPayment);
  const addTip = useTipsStore((s) => s.addTip);

  const [amount, setAmount] = useState('');
  const [tipMode, setTipMode] = useState<'none' | 'percent' | 'custom'>('none');
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');

  const numAmount = parseInt(amount) || 0;

  const tipAmount = useMemo(() => {
    if (tipMode === 'percent' && tipPercent) {
      return Math.round(numAmount * tipPercent / 100);
    }
    if (tipMode === 'custom' && customTip) {
      return Math.max(0, parseInt(customTip) || 0);
    }
    return 0;
  }, [tipMode, tipPercent, customTip, numAmount]);

  if (!table) return null;

  const totalBill = computeTableBill(table);
  const totalPaid = computeTotalPaid(table);
  const remaining = Math.max(0, totalBill - totalPaid);
  const grandTotal = numAmount + tipAmount;

  const handlePay = (method: 'cash' | 'card-physical') => {
    if (numAmount <= 0) return;
    recordPayment(tableId, numAmount, method, tipAmount);

    if (tipAmount > 0) {
      addTip({
        tableNumber,
        round: 0,
        amount: tipAmount,
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        guestName: `Mesa ${tableNumber}`,
      });
    }

    const label = method === 'cash' ? '💵 Efectivo' : '💳 Tarjeta física';
    const tipLabel = tipAmount > 0 ? ` · propina $${tipAmount}` : '';
    toast.success(`${label} · $${numAmount}${tipLabel}`);
    onDismiss();
  };

  const paidPct = totalBill > 0 ? Math.min(100, Math.round(((totalPaid + numAmount) / totalBill) * 100)) : 0;

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
            <h3 className="text-[14px] font-semibold text-w-text">💰 Registrar pago · Mesa {tableNumber}</h3>
            <p className="text-[11px] text-w-text-secondary">
              Cuenta: ${totalBill} · Pagado: ${totalPaid} · Resta: <span className="font-semibold text-w-priority">${remaining}</span>
            </p>
          </div>
          <button onClick={onDismiss} className="w-11 h-11 flex items-center justify-center">
            <X size={18} className="text-w-text-secondary" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="w-full h-2 bg-w-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${paidPct}%`,
                background: paidPct >= 100 ? 'hsl(var(--w-success))' : 'hsl(var(--w-brand))',
              }}
            />
          </div>
          <p className="text-[10px] text-w-text-secondary mt-1 text-right font-mono">{paidPct}% cubierto</p>
        </div>

        {/* Amount input */}
        <div className="px-4 pb-3 space-y-2">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] font-bold text-w-text-secondary">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full h-14 pl-10 pr-4 rounded-[10px] bg-w-surface border border-w-border text-[24px] font-bold text-w-text font-mono placeholder:text-w-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-w-brand"
              min={0}
            />
          </div>

          {/* Quick amounts */}
          <div className="flex gap-1.5">
            {QUICK_AMOUNTS.map((qa) => (
              <button
                key={qa}
                onClick={() => setAmount(String(qa))}
                className={`flex-1 h-9 rounded-[6px] border text-[12px] font-medium transition-colors ${
                  numAmount === qa
                    ? 'border-w-brand/50 bg-w-brand/10 text-w-brand'
                    : 'border-w-border text-w-text-secondary hover:border-w-text-secondary/50'
                }`}
              >
                ${qa}
              </button>
            ))}
            {remaining > 0 && (
              <button
                onClick={() => setAmount(String(remaining))}
                className={`flex-1 h-9 rounded-[6px] border text-[12px] font-medium transition-colors ${
                  numAmount === remaining
                    ? 'border-w-success/50 bg-w-success/10 text-w-success'
                    : 'border-w-border text-w-text-secondary hover:border-w-text-secondary/50'
                }`}
              >
                Todo ${remaining}
              </button>
            )}
          </div>
        </div>

        {/* Tip section */}
        {numAmount > 0 && (
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
                  {pct}% · ${Math.round(numAmount * pct / 100)}
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

        {/* Payments log */}
        {table.payments.length > 0 && (
          <div className="shrink-0 border-t border-w-border px-4 pt-2 pb-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-w-text-secondary mb-1">Pagos registrados</p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {table.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-w-text-secondary">
                    {p.method === 'qr' ? '📱' : p.method === 'cash' ? '💵' : '💳'} {p.guestName || 'Anónimo'} · {p.timestamp}
                  </span>
                  <span className="font-mono text-w-text">${p.amount}{p.tipAmount > 0 ? ` +$${p.tipAmount}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 border-t border-w-border px-4 pt-3 pb-4 space-y-3">
          <div className="space-y-1 px-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-w-text-secondary">Monto</span>
              <span className="font-mono text-[14px] text-w-text">${numAmount}</span>
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
              disabled={numAmount <= 0}
              className="flex-1 h-12 rounded-[8px] bg-w-success text-white font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              💵 Efectivo ✓
            </button>
            <button
              onClick={() => handlePay('card-physical')}
              disabled={numAmount <= 0}
              className="flex-1 h-12 rounded-[8px] bg-w-brand text-white font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              💳 Tarjeta ✓
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

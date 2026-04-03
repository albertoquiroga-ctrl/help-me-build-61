import { motion } from 'framer-motion';
import { X, Copy, Share2 } from 'lucide-react';
import { computeTableBill, computeTotalPaid, getItemsByCategory, type WaiterTable } from '@/stores/tablesStore';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<string, string> = {
  'Bebidas': '🍹',
  'Entradas': '🥗',
  'Platos Fuertes': '🥩',
  'Postres': '🍮',
  'Otros': '🍽',
};

interface Props {
  table: WaiterTable;
  onDismiss: () => void;
  onProceedToPayment: () => void;
}

export default function PreCheckSheet({ table, onDismiss, onProceedToPayment }: Props) {
  const totalBill = computeTableBill(table);
  const totalPaid = computeTotalPaid(table);
  const remaining = Math.max(0, totalBill - totalPaid);
  const itemsByCategory = getItemsByCategory(table);

  const buildTextReceipt = () => {
    const lines: string[] = [];
    lines.push(`━━━ PRE-CUENTA ━━━`);
    lines.push(`Mesa ${table.number}`);
    lines.push(`Fecha: ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`);
    lines.push(`Hora: ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`);
    lines.push('');

    Object.entries(itemsByCategory).forEach(([cat, items]) => {
      lines.push(`── ${cat} ──`);
      items.forEach((item) => {
        const extras = item.extras?.reduce((s, e) => s + e.price * item.qty, 0) || 0;
        const subtotal = item.price * item.qty + extras;
        lines.push(`  ${item.qty}× ${item.name}  $${subtotal}`);
        if (item.modifiers?.length) lines.push(`     ${item.modifiers.join(', ')}`);
        if (item.extras?.length) lines.push(`     +${item.extras.map(e => e.name).join(', ')}`);
      });
    });

    lines.push('');
    lines.push(`TOTAL: $${totalBill} MXN`);
    if (totalPaid > 0) {
      lines.push(`Pagado: $${totalPaid}`);
      lines.push(`Resta: $${remaining}`);
    }
    lines.push('━━━━━━━━━━━━━━━━━');
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildTextReceipt());
    toast.success('📋 Pre-cuenta copiada');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: buildTextReceipt() });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-w-bg rounded-t-[16px] max-h-[85vh] flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-w-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-w-border">
          <div>
            <h2 className="text-[17px] font-bold text-w-text">🧾 Pre-cuenta</h2>
            <p className="text-[12px] text-w-text-secondary">Mesa {table.number}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="w-9 h-9 rounded-full bg-w-elevated flex items-center justify-center active:scale-95">
              <Copy size={16} className="text-w-text-secondary" />
            </button>
            <button onClick={handleShare} className="w-9 h-9 rounded-full bg-w-elevated flex items-center justify-center active:scale-95">
              <Share2 size={16} className="text-w-text-secondary" />
            </button>
            <button onClick={onDismiss} className="w-9 h-9 rounded-full bg-w-elevated flex items-center justify-center active:scale-95">
              <X size={16} className="text-w-text-secondary" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {Object.entries(itemsByCategory).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] font-mono uppercase tracking-wider text-w-text-secondary mb-1.5">
                {CATEGORY_ICONS[cat] || '🍽'} {cat}
              </p>
              <div className="space-y-1">
                {items.map((item, idx) => {
                  const extras = item.extras?.reduce((s, e) => s + e.price * item.qty, 0) || 0;
                  const subtotal = item.price * item.qty + extras;
                  return (
                    <div key={idx} className="flex justify-between items-start text-[13px]">
                      <div className="flex-1 min-w-0">
                        <span className="text-w-text">{item.qty}× {item.name}</span>
                        {(item.modifiers?.length || item.extras?.length) ? (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.modifiers?.map((m, mi) => (
                              <span key={mi} className="text-[9px] px-1 py-0.5 rounded bg-w-warning/15 text-w-warning">{m}</span>
                            ))}
                            {item.extras?.map((e, ei) => (
                              <span key={ei} className="text-[9px] px-1 py-0.5 rounded bg-w-brand/15 text-w-brand">+{e.name} ${e.price}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <span className="font-mono text-w-text ml-2 shrink-0">${subtotal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Divider + Total */}
          <div className="border-t border-dashed border-w-border pt-3 space-y-1">
            <div className="flex justify-between text-[15px] font-bold text-w-text">
              <span>Total</span>
              <span className="font-mono">${totalBill} MXN</span>
            </div>
            {totalPaid > 0 && (
              <>
                <div className="flex justify-between text-[12px] text-w-success">
                  <span>Pagado</span>
                  <span className="font-mono">−${totalPaid}</span>
                </div>
                <div className="flex justify-between text-[13px] font-semibold text-w-priority">
                  <span>Resta por pagar</span>
                  <span className="font-mono">${remaining} MXN</span>
                </div>
              </>
            )}
          </div>

          {/* Time info */}
          <p className="text-[10px] text-w-text-secondary text-center pt-1">
            Tiempo en mesa: {table.timeOpened >= 60 ? `${Math.floor(table.timeOpened / 60)}h ${table.timeOpened % 60}m` : `${table.timeOpened} min`}
            {' · '}{table.rounds.length} ronda{table.rounds.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-w-border space-y-2">
          {remaining > 0 && (
            <button
              onClick={() => { onDismiss(); onProceedToPayment(); }}
              className="w-full h-12 rounded-[10px] bg-w-success text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            >
              💰 Proceder al cobro · ${remaining}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="w-full h-10 rounded-[10px] border border-w-border text-w-text-secondary font-medium text-[13px] active:scale-[0.98] transition-transform"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

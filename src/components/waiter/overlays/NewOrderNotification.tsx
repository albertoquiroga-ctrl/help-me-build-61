import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import TimerBar from '@/components/waiter/TimerBar';
import RoundBadge from '@/components/waiter/RoundBadge';
import { toast } from 'sonner';

const items = [
  { name: 'Entrecot a las Brasas', qty: 2, price: 295 },
  { name: 'Pasta con Trufa', qty: 1, price: 245 },
  { name: 'Ensalada Mixta', qty: 1, price: 130 },
];
const total = items.reduce((s, i) => s + i.qty * i.price, 0);

export default function NewOrderNotification({ onDismiss }: { onDismiss: () => void }) {
  const [showReject, setShowReject] = useState(false);
  const [rejectAll, setRejectAll] = useState(false);
  const [checked, setChecked] = useState(items.map(() => false));
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const handleExpire = useCallback(() => {
    toast.success('✓ Orden confirmada · Mesa 4 R2');
    onDismiss();
  }, [onDismiss]);

  const reasons = ['🚫 Agotado', '⏰ Cocina saturada', '❌ Error en orden', '🔄 Quiere cambiar', '✏️ Otro'];

  if (showReject) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-w-bg overflow-y-auto">
        <div className="px-4 py-4">
          <button onClick={() => setShowReject(false)} className="text-w-text text-[16px] font-semibold min-h-[44px]">← ¿Por qué rechazas? · Mesa 4 · R2</button>
          <div className="bg-w-surface rounded-[10px] border border-w-border p-3 mt-3 text-[12px] text-w-text-secondary">
            {items.map((it, i) => <span key={i}>{it.name} ×{it.qty}{i < items.length - 1 ? ' · ' : ''}</span>)} · Total ${total}
          </div>

          <div className="flex items-center justify-between mt-4 min-h-[44px]">
            <span className="text-[13px] text-w-text">Rechazar orden completa</span>
            <button onClick={() => { setRejectAll(!rejectAll); setChecked(items.map(() => !rejectAll)); }} className={`w-11 h-6 rounded-full relative ${rejectAll ? 'bg-w-error' : 'bg-w-border'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${rejectAll ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {!rejectAll && (
            <div className="space-y-2 mt-3">
              {items.map((it, i) => (
                <button key={i} onClick={() => { const n = [...checked]; n[i] = !n[i]; setChecked(n); }} className="flex items-center gap-3 w-full min-h-[44px]">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${checked[i] ? 'bg-w-error border-w-error' : 'border-w-border'}`}>
                    {checked[i] && <span className="text-white text-[11px]">✓</span>}
                  </div>
                  <span className="text-[13px] text-w-text">{it.name} ×{it.qty}</span>
                </button>
              ))}
            </div>
          )}

          {checked.some(Boolean) && (
            <>
              <p className="text-[11px] text-w-text-secondary mt-4 mb-2">Razón:</p>
              <div className="flex flex-wrap gap-2">
                {reasons.map((r) => (
                  <button key={r} onClick={() => setReason(r)} className={`px-3 py-1.5 rounded-[6px] text-[12px] border min-h-[36px] ${reason === r ? 'bg-w-error/15 border-w-error/50 text-w-error' : 'border-w-border text-w-text-secondary'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ej: Podemos ofrecerte la Pasta con Trufa en su lugar"
                className="w-full mt-3 bg-w-surface border border-w-border rounded-[8px] p-3 text-[13px] text-w-text placeholder:text-w-text-secondary/50 resize-none"
                rows={3}
              />
            </>
          )}

          <button
            disabled={!checked.some(Boolean) || !reason}
            onClick={() => { toast.warning('Rechazo enviado · Mesa 4 R2'); onDismiss(); }}
            className="w-full h-12 mt-4 rounded-[8px] border border-w-error text-w-error font-semibold text-[14px] disabled:opacity-40"
          >
            Enviar rechazo → el comensal recibe tu mensaje
          </button>
          <p className="text-[11px] text-w-text-secondary text-center mt-2">Los platillos sin rechazar se confirman automáticamente.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-w-elevated rounded-[16px] border border-w-border border-l-[4px] border-l-w-priority mx-4 max-w-[360px] w-full p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[20px] font-bold text-w-text">Nueva orden · Mesa 4</span>
          <RoundBadge round={2} />
        </div>
        <p className="text-[14px] text-w-text-secondary mb-3">C2 y C3 ordenaron:</p>

        <div className="space-y-1.5 mb-3">
          {items.map((it, i) => (
            <div key={i} className="flex justify-between text-[13px]">
              <span className="text-w-text">{it.name} ×{it.qty}</span>
              <span className="font-mono text-w-text-secondary">${it.qty * it.price}</span>
            </div>
          ))}
          <div className="border-t border-w-border pt-2 flex justify-between">
            <span className="text-[14px] text-w-text font-medium">Total:</span>
            <span className="font-mono text-[16px] font-bold text-w-text">${total} MXN</span>
          </div>
        </div>

        <div className="bg-w-surface rounded-[8px] p-3 mb-4">
          <p className="text-[12px] text-w-text-secondary mb-1">Se confirma automáticamente en:</p>
          <TimerBar totalSeconds={45} onExpire={handleExpire} color="warning" showCountdown countdownSize="lg" />
          <p className="text-[11px] text-w-text-secondary mt-2 text-center">Si no haces nada, se confirma y va a cocina.</p>
        </div>

        <button onClick={() => setShowReject(true)} className="w-full h-10 rounded-[8px] border border-w-error/50 text-w-error text-[13px] font-medium">
          Rechazar orden
        </button>
      </motion.div>
    </motion.div>
  );
}

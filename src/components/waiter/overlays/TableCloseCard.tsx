import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import TimerBar from '@/components/waiter/TimerBar';
import RoundBadge from '@/components/waiter/RoundBadge';
import { useTablesStore } from '@/stores/tablesStore';
import { toast } from 'sonner';

export default function TableCloseCard({ onDismiss }: { onDismiss: () => void }) {
  const closeTable = useTablesStore((s) => s.closeTable);
  const [showKeepDialog, setShowKeepDialog] = useState(false);

  const handleClose = useCallback(() => {
    closeTable('4');
    toast.success('✓ Mesa 4 liberada');
    onDismiss();
  }, [closeTable, onDismiss]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-w-elevated rounded-[16px] border border-w-border mx-4 max-w-[360px] w-full p-5 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
          <div className="w-14 h-14 rounded-full bg-w-success/20 flex items-center justify-center mx-auto mb-3">
            <Check size={28} className="text-w-success" />
          </div>
        </motion.div>

        <p className="text-[20px] font-semibold text-w-text">Mesa 4 · Todo pagado ✓</p>

        <div className="bg-w-surface rounded-[10px] border-l-[3px] border-l-w-success border border-w-border p-3 mt-4 text-left space-y-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-w-text-secondary">Total facturado:</span>
            <span className="font-mono font-bold text-w-text">$855 MXN</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-w-text-secondary">Propinas:</span>
            <span className="font-mono font-bold text-w-tip">$128 MXN</span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-w-text-secondary">
            <span>Rondas:</span>
            <RoundBadge round={1} /> <RoundBadge round={2} /> <RoundBadge round={3} />
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-w-text-secondary">Tiempo abierta:</span>
            <span className="font-mono text-w-text-secondary">1h 22min</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[12px] text-w-text-secondary mb-1">La mesa se cierra automáticamente en:</p>
          <TimerBar totalSeconds={120} onExpire={handleClose} color="success" showCountdown countdownSize="lg" />
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={handleClose} className="flex-1 h-11 rounded-[8px] border border-w-success/40 text-w-success text-[13px] font-medium">
            Cerrar mesa ahora ✓
          </button>
          <button onClick={() => setShowKeepDialog(true)} className="flex-1 h-11 rounded-[8px] border border-w-warning/40 text-w-warning text-[13px]">
            Mantener abierta
          </button>
        </div>

        {showKeepDialog && (
          <div className="mt-3 bg-w-surface rounded-[10px] border border-w-border p-3">
            <p className="text-[14px] font-semibold text-w-text">¿Seguro?</p>
            <p className="text-[12px] text-w-text-secondary mt-1">Los comensales podrán seguir ordenando.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowKeepDialog(false)} className="flex-1 h-10 rounded-[8px] border border-w-border text-[12px] text-w-text-secondary">Cancelar</button>
              <button onClick={onDismiss} className="flex-1 h-10 rounded-[8px] bg-w-warning text-white text-[12px] font-semibold">Mantener abierta</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

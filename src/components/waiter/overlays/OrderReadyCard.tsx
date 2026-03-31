import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PickupChecklist from '@/components/waiter/PickupChecklist';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const items = [
  { name: 'Entrecot a las Brasas', qty: 2, price: 295 },
  { name: 'Pasta con Trufa', qty: 1, price: 245 },
  { name: 'Ensalada Mixta', qty: 1, price: 130 },
];

export default function OrderReadyCard({ onDismiss }: { onDismiss: () => void }) {
  const [allChecked, setAllChecked] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const isUrgent = elapsed >= 900; // 15 min
  const isWarning = elapsed >= 300; // 5 min

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          'bg-w-elevated rounded-[16px] border border-w-border border-l-[3px] mx-4 max-w-[360px] w-full p-5',
          isUrgent ? 'border-l-w-error bg-w-error/[0.05]' : 'border-l-w-success'
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <p className={cn('text-[20px] font-bold', isUrgent ? 'text-w-error' : 'text-w-success')}>
            {isUrgent ? '⚠️ Esperando demasiado' : 'Listo para recoger'}
          </p>
        </div>
        <p className="text-[14px] text-w-text-secondary mb-2">Mesa 4 · R2 · Plato Fuerte</p>

        {/* Counting-up timer */}
        <div className={cn(
          'rounded-[8px] p-2 mb-3 text-center',
          isUrgent ? 'bg-w-error/10' : isWarning ? 'bg-w-warning/10' : 'bg-w-surface'
        )}>
          <p className="text-[11px] text-w-text-secondary">Esperando desde hace:</p>
          <p className={cn(
            'font-mono text-[22px] font-bold',
            isUrgent ? 'text-w-error' : isWarning ? 'text-w-warning' : 'text-w-text-secondary'
          )}>
            {formatTime(elapsed)}
          </p>
          {isUrgent && <p className="text-[11px] text-w-error mt-0.5">La comida se enfría — recoge ya</p>}
        </div>

        <PickupChecklist items={items} onAllChecked={() => setAllChecked(true)} />

        <p className="text-[12px] text-w-text-secondary mt-3 mb-4">📍 Sección Norte · Mesa 4</p>

        <button
          disabled={!allChecked}
          onClick={() => { toast.success('✓ R2 entregada · Mesa 4'); onDismiss(); }}
          className="w-full h-12 rounded-[8px] bg-w-success text-white font-semibold text-[14px] disabled:opacity-40"
        >
          Todo recogido — marcar como entregado ✓
        </button>
      </motion.div>
    </motion.div>
  );
}

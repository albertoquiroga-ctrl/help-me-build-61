import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTipsStore } from '@/stores/tipsStore';
import { useEffect } from 'react';

export default function EarlyExitNotification({ onDismiss }: { onDismiss: () => void }) {
  const addTip = useTipsStore((s) => s.addTip);

  useEffect(() => {
    addTip({ tableNumber: 4, round: 2, amount: 56, timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), guestName: 'C1' });
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed bottom-20 left-4 right-4 z-[60]">
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} className="bg-w-elevated rounded-[10px] border border-w-border border-l-[3px] border-l-w-priority p-4 relative">
        <button onClick={onDismiss} className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center">
          <X size={16} className="text-w-text-secondary" />
        </button>
        <p className="text-[14px] font-semibold text-w-text">C1 pagó y se fue · Mesa 4</p>
        <p className="font-mono text-[16px] text-w-text mt-1">Pagó $426 MXN</p>
        <p className="font-mono text-[14px] text-w-tip mt-0.5">♥ $56 de propina para ti</p>

        <div className="mt-3 space-y-1 text-[12px]">
          <p className="text-w-text-secondary line-through">C1: ✓ Pagado · se fue</p>
          <p className="text-w-priority">C2: → $185 pendiente</p>
          <p className="text-w-priority">C3: → $195 pendiente</p>
          <p className="text-w-success">C4: ✓ Pagado · sigue en mesa</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

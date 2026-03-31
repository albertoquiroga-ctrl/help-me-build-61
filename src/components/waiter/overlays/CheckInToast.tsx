import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import TimerBar from '@/components/waiter/TimerBar';

export default function CheckInToast({ onDismiss }: { onDismiss: () => void }) {
  const handleExpire = useCallback(() => onDismiss(), [onDismiss]);

  return (
    <motion.div
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      exit={{ y: -80, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-[70] bg-w-elevated border-b border-w-border border-l-[4px] border-l-w-warning rounded-b-[8px] px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-w-warning/20 flex items-center justify-center text-[14px] shrink-0">💡</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-w-text">Mesa 7 — buen momento para pasar 🥃</p>
          <p className="text-[11px] text-w-text-secondary">Llevan 22 min sin pedir</p>
        </div>
        <button onClick={onDismiss} className="w-11 h-11 flex items-center justify-center shrink-0">
          <X size={16} className="text-w-text-secondary" />
        </button>
      </div>
      <div className="mt-1.5">
        <TimerBar totalSeconds={30} onExpire={handleExpire} color="warning" showCountdown={false} />
      </div>
    </motion.div>
  );
}

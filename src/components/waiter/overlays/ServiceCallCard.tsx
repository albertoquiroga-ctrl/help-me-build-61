import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ServiceCallCard({ onDismiss }: { onDismiss: () => void }) {
  const [state, setState] = useState<'incoming' | 'on-way' | 'done'>('incoming');
  const navigate = useNavigate();

  if (state === 'on-way') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed bottom-20 left-4 right-4 z-[60]">
        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-w-elevated rounded-[10px] border border-w-success/30 border-l-[3px] border-l-w-success p-4 bg-w-success/[0.05]">
          <p className="text-[14px] text-w-success font-medium">✓ Avisado al comensal — vas en camino</p>
          <p className="text-[11px] text-w-text-secondary mt-1">📱 El comensal ve: "Tu mesero lo vio"</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                toast.success('✓ Servicio atendido · Mesa 4');
                onDismiss();
              }}
              className="flex-1 h-11 rounded-[8px] border border-w-success/40 text-w-success text-[13px] font-medium"
            >
              Marcar como atendido ✓
            </button>
            <button
              onClick={() => { onDismiss(); navigate('/waiter/table/4'); }}
              className="flex-1 h-11 rounded-[8px] border border-w-border text-w-text-secondary text-[13px]"
            >
              Ver mesa completa →
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed bottom-20 left-4 right-4 z-[60]">
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} className="bg-w-elevated rounded-[10px] border border-w-border border-l-[3px] border-l-w-priority p-4">
        <p className="text-[14px] font-semibold text-w-text">🙋 Mesa 4 · C3 necesita algo</p>
        <p className="text-[18px] font-bold text-w-text mt-1">🧂 Sal y Pimienta</p>
        <p className="text-[11px] text-w-text-secondary mt-1">R2 · Comiendo · 38 min · C1 y C4 ya pagaron</p>
        <button
          onClick={() => setState('on-way')}
          className="w-full h-12 mt-3 rounded-[8px] bg-w-priority text-white font-semibold text-[14px]"
        >
          Visto — voy en camino ✓
        </button>
      </motion.div>
    </motion.div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import PickupChecklist from '@/components/waiter/PickupChecklist';
import { toast } from 'sonner';

const items = [
  { name: 'Entrecot a las Brasas', qty: 2, price: 295 },
  { name: 'Pasta con Trufa', qty: 1, price: 245 },
  { name: 'Ensalada Mixta', qty: 1, price: 130 },
];

export default function OrderReadyCard({ onDismiss }: { onDismiss: () => void }) {
  const [allChecked, setAllChecked] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-w-elevated rounded-[16px] border border-w-border border-l-[3px] border-l-w-success mx-4 max-w-[360px] w-full p-5">
        <p className="text-[20px] font-bold text-w-success mb-1">Listo para recoger</p>
        <p className="text-[14px] text-w-text-secondary mb-4">Mesa 4 · R2 · Plato Fuerte</p>

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

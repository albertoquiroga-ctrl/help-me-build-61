import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import WaiterBottomNav from '@/components/waiter/WaiterBottomNav';
import TableCard from '@/components/waiter/TableCard';
import NotificationCard from '@/components/waiter/NotificationCard';
import { useTablesStore } from '@/stores/tablesStore';
import { useWaiterSession } from '@/stores/waiterSessionStore';
import { useTipsStore } from '@/stores/tipsStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import NewOrderNotification from '@/components/waiter/overlays/NewOrderNotification';
import OrderReadyCard from '@/components/waiter/overlays/OrderReadyCard';
import CheckInToast from '@/components/waiter/overlays/CheckInToast';
import ServiceCallCard from '@/components/waiter/overlays/ServiceCallCard';
import PaymentFailedAlert from '@/components/waiter/overlays/PaymentFailedAlert';
import EarlyExitNotification from '@/components/waiter/overlays/EarlyExitNotification';
import TableCloseCard from '@/components/waiter/overlays/TableCloseCard';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function WaiterDashboard() {
  const tables = useTablesStore((s) => s.tables);
  const { waiterName, shiftDuration } = useWaiterSession();
  const todayTotal = useTipsStore((s) => s.todayTotal);
  const navigate = useNavigate();
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [overlay, setOverlay] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const addNotification = useNotificationsStore((s) => s.addNotification);

  const highestAlert = useNotificationsStore((s) => s.queue.find((n) => !n.dismissed));

  const simActions = [
    { label: 'Nueva orden en Mesa 4 (R2)', action: () => { setOverlay('new-order'); setShowSimMenu(false); } },
    { label: 'Orden lista Mesa 4 (R2)', action: () => { setOverlay('order-ready'); setShowSimMenu(false); } },
    { label: 'Llamado servicio Mesa 4 (sal)', action: () => { setOverlay('service-call'); setShowSimMenu(false); } },
    { label: 'Check-in sugerido Mesa 7', action: () => { setShowCheckIn(true); setShowSimMenu(false); } },
    { label: 'Pago fallido Mesa 6', action: () => { setOverlay('payment-failed'); setShowSimMenu(false); } },
    { label: 'C1 pagó y se fue Mesa 4', action: () => { setOverlay('early-exit'); setShowSimMenu(false); } },
    { label: 'Todos pagaron Mesa 4', action: () => { setOverlay('table-close'); setShowSimMenu(false); } },
  ];

  return (
    <div className="min-h-screen bg-w-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-w-text">Mis Mesas</h1>
          <span className="font-mono text-[12px] text-w-text-secondary">Turno: {formatDuration(shiftDuration)}</span>
        </div>
      </div>

      <div className="px-4 pt-3">
        {/* Tip pill */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => navigate('/waiter/tips')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-w-tip/10 border border-w-tip/30 min-h-[44px]"
          >
            <span className="text-[13px]">💰</span>
            <span className="font-mono text-[13px] text-w-tip font-medium">${todayTotal} hoy</span>
          </button>
        </div>

        {/* Alert banner */}
        {highestAlert && !highestAlert.dismissed && (
          <NotificationCard
            priority={highestAlert.priority}
            title={highestAlert.title}
            subtitle={highestAlert.subtitle}
            onClick={() => navigate(`/waiter/table/${highestAlert.tableId}`)}
            className="mb-3"
          />
        )}

        {/* Table grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      </div>

      {/* Sim FAB */}
      <button
        onClick={() => setShowSimMenu(true)}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-w-brand flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <Zap size={20} className="text-white" />
      </button>

      {/* Sim bottom sheet */}
      <AnimatePresence>
        {showSimMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowSimMenu(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-w-elevated rounded-t-[16px] border-t border-w-border p-4 pb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold text-w-text">⚡ Simular evento</h3>
                <button onClick={() => setShowSimMenu(false)} className="w-11 h-11 flex items-center justify-center">
                  <X size={18} className="text-w-text-secondary" />
                </button>
              </div>
              <div className="space-y-2">
                {simActions.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.action}
                    className="w-full text-left px-3 py-3 rounded-[8px] bg-w-surface border border-w-border text-[13px] text-w-text min-h-[44px] active:bg-w-elevated transition-colors"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <AnimatePresence>
        {overlay === 'new-order' && <NewOrderNotification onDismiss={() => setOverlay(null)} />}
        {overlay === 'order-ready' && <OrderReadyCard onDismiss={() => setOverlay(null)} />}
        {overlay === 'service-call' && <ServiceCallCard onDismiss={() => setOverlay(null)} />}
        {overlay === 'payment-failed' && <PaymentFailedAlert onDismiss={() => setOverlay(null)} />}
        {overlay === 'early-exit' && <EarlyExitNotification onDismiss={() => setOverlay(null)} />}
        {overlay === 'table-close' && <TableCloseCard onDismiss={() => setOverlay(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckIn && <CheckInToast onDismiss={() => setShowCheckIn(false)} />}
      </AnimatePresence>

      <WaiterBottomNav />
    </div>
  );
}

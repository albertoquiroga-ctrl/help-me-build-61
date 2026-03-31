import { useState } from 'react';
import { toast } from 'sonner';
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
  const addRound = useTablesStore((s) => s.addRound);
  const updateRoundStatus = useTablesStore((s) => s.updateRoundStatus);
  const markGuestPaymentFailed = useTablesStore((s) => s.markGuestPaymentFailed);
  const markGuestLeft = useTablesStore((s) => s.markGuestLeft);
  const { waiterName, shiftDuration } = useWaiterSession();
  const todayTotal = useTipsStore((s) => s.todayTotal);
  const navigate = useNavigate();
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [overlay, setOverlay] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const addNotification = useNotificationsStore((s) => s.addNotification);

  const highestAlert = useNotificationsStore((s) => s.queue.find((n) => !n.dismissed));
  const activeTables = tables.filter((t) => t.status !== 'empty');

  const simActions = [
    {
      label: 'Nueva orden en Mesa 4 (R3)',
      action: () => {
        // Add a pending round to table 4
        addRound('4', {
          number: 3, label: 'Postres',
          items: [{ name: 'Tiramisú', qty: 2, price: 145 }, { name: 'Flan Napolitano', qty: 1, price: 95 }],
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
        addNotification({
          id: `n-${Date.now()}`, type: 'new-order', priority: 'medium', tableId: '4',
          title: 'Nueva orden · Mesa 4 · R3 · $385', subtitle: 'Esperando confirmación',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        setOverlay('new-order');
        setShowSimMenu(false);
      },
    },
    {
      label: 'Orden lista Mesa 4 (R2)',
      action: () => {
        updateRoundStatus('4', 2, 'ready');
        addNotification({
          id: `n-${Date.now()}`, type: 'order-ready', priority: 'high', tableId: '4',
          title: 'Orden lista · Mesa 4 · R2 · 3 items', subtitle: 'Listo para recoger',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        setOverlay('order-ready');
        setShowSimMenu(false);
      },
    },
    {
      label: 'Llamado servicio Mesa 4 (sal)',
      action: () => {
        addNotification({
          id: `n-${Date.now()}`, type: 'service-call', priority: 'medium', tableId: '4',
          title: 'Llamado servicio · Mesa 4 · C3 · Sal y Pimienta', subtitle: 'Esperando',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        setOverlay('service-call');
        setShowSimMenu(false);
      },
    },
    {
      label: 'Check-in sugerido Mesa 7',
      action: () => {
        addNotification({
          id: `n-${Date.now()}`, type: 'check-in', priority: 'low', tableId: '7',
          title: 'Check-in · Mesa 7 · 28 min sin nueva orden', subtitle: 'Sugerido',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        setShowCheckIn(true);
        setShowSimMenu(false);
      },
    },
    {
      label: 'Pago fallido Mesa 6',
      action: () => {
        markGuestPaymentFailed('6', 'g6-2');
        addNotification({
          id: `n-${Date.now()}`, type: 'payment-failed', priority: 'urgent', tableId: '6',
          title: 'Pago fallido · Mesa 6 · C2 · $245', subtitle: 'Tarjeta rechazada',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        setOverlay('payment-failed');
        setShowSimMenu(false);
      },
    },
    {
      label: 'C1 pagó y se fue Mesa 4',
      action: () => {
        markGuestLeft('4', 'g4-1');
        addNotification({
          id: `n-${Date.now()}`, type: 'early-exit', priority: 'medium', tableId: '4',
          title: 'C1 pagó y se fue · Mesa 4', subtitle: '$240 pagado · $74 propina',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        setOverlay('early-exit');
        setShowSimMenu(false);
      },
    },
    {
      label: 'Todos pagaron Mesa 4',
      action: () => {
        addNotification({
          id: `n-${Date.now()}`, type: 'table-close', priority: 'high', tableId: '4',
          title: 'Todos pagaron · Mesa 4', subtitle: 'Mesa lista para cerrar',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        setOverlay('table-close');
        setShowSimMenu(false);
      },
    },
    {
      label: '⚠️ Comensal sin QR en Mesa 7',
      action: () => {
        // Mark two guests as needing manual order
        const markGuestNoOrder = useTablesStore.getState().markGuestNoOrder;
        markGuestNoOrder('7', 'g7-3');
        markGuestNoOrder('7', 'g7-5');
        addNotification({
          id: `n-${Date.now()}`, type: 'service-call', priority: 'medium', tableId: '7',
          title: '⚠️ 2 comensales sin QR · Mesa 7', subtitle: 'Captura manual necesaria',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        toast.info('⚠️ Grupo 3 y Grupo 5 no escanearon el QR · Mesa 7');
        setShowSimMenu(false);
      },
    },
    {
      label: '👨‍💼 Mensaje de gerente',
      action: () => {
        addNotification({
          id: `n-${Date.now()}`, type: 'manager-msg', priority: 'high', tableId: '',
          title: 'Mesa 12 es VIP corporativo', subtitle: 'Ofrecer cortesía de postre, autorizado',
          channel: 'gerente',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        toast.info('👨‍💼 Nuevo mensaje del gerente');
        setShowSimMenu(false);
      },
    },
    {
      label: '🍳 Aviso de cocina',
      action: () => {
        addNotification({
          id: `n-${Date.now()}`, type: 'kitchen-msg', priority: 'urgent', tableId: '',
          title: 'Se terminó el salmón', subtitle: 'Ofrecer robalo como alternativa',
          channel: 'cocina',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        toast.info('🍳 Aviso urgente de cocina');
        setShowSimMenu(false);
      },
    },
    {
      label: '🍸 Aviso de barra',
      action: () => {
        addNotification({
          id: `n-${Date.now()}`, type: 'bar-msg', priority: 'low', tableId: '',
          title: 'Nuevo cocktail del día disponible', subtitle: 'Margarita de maracuyá · $165',
          channel: 'barra',
          timestamp: new Date().toISOString(), dismissed: false, resolved: false,
        });
        toast.info('🍸 Mensaje de barra');
        setShowSimMenu(false);
      },
    },
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

        {/* Zero state */}
        {activeTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[48px] mb-3">☕</p>
            <p className="text-[18px] font-semibold text-w-text">Tu turno acaba de empezar</p>
            <p className="text-[13px] text-w-text-secondary mt-1 text-center max-w-[240px]">
              Las mesas asignadas aparecerán aquí conforme los comensales escaneen su QR.
            </p>
          </div>
        ) : (
          /* Table grid */
          <div className="grid grid-cols-2 gap-2.5">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        )}
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
              className="fixed bottom-0 left-0 right-0 z-[51] bg-w-elevated rounded-t-[16px] border-t border-w-border max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="text-[14px] font-semibold text-w-text">⚡ Simular evento</h3>
                <button onClick={() => setShowSimMenu(false)} className="w-11 h-11 flex items-center justify-center">
                  <X size={18} className="text-w-text-secondary" />
                </button>
              </div>
              <div className="overflow-y-auto px-4 pb-8 space-y-2">
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

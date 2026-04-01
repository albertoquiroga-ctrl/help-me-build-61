import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import WaiterBottomNav from '@/components/waiter/WaiterBottomNav';
import TableCard from '@/components/waiter/TableCard';
import RoleSwitcher from '@/components/RoleSwitcher';
import NotificationCard from '@/components/waiter/NotificationCard';
import CheckInToast from '@/components/waiter/overlays/CheckInToast';
import { useTablesStore } from '@/stores/tablesStore';
import { useWaiterSession } from '@/stores/waiterSessionStore';
import { useTipsStore } from '@/stores/tipsStore';
import { useNotificationsStore } from '@/stores/notificationsStore';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function WaiterDashboard() {
  const tables = useTablesStore((s) => s.tables);
  const { shiftDuration } = useWaiterSession();
  const todayTotal = useTipsStore((s) => s.todayTotal);
  const navigate = useNavigate();
  const resolve = useNotificationsStore((s) => s.resolve);

  const highestAlert = useNotificationsStore((s) => s.queue.find((n) => !n.dismissed));
  const loyaltyCheckIn = useNotificationsStore((s) => s.queue.find((n) => n.type === 'check-in' && !n.dismissed && !!n.loyalty));
  const [showLoyaltyToast, setShowLoyaltyToast] = useState(true);

  // Waiter only sees their own tables (simulated as "Carlos" for demo)
  const myTables = tables.filter((t) => t.assignedWaiter === 'Carlos');
  const activeTables = myTables.filter((t) => t.status !== 'empty');

  return (
    <div className="min-h-screen bg-w-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-w-text">Mis Mesas</h1>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] text-w-text-secondary">Turno: {formatDuration(shiftDuration)}</span>
            <RoleSwitcher />
          </div>
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
            {myTables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        )}
      </div>

      {/* Loyalty check-in toast overlay */}
      <AnimatePresence>
        {showLoyaltyToast && loyaltyCheckIn && loyaltyCheckIn.loyalty && (
          <CheckInToast
            tableName={`Mesa ${loyaltyCheckIn.tableId}`}
            loyalty={loyaltyCheckIn.loyalty}
            onDismiss={() => {
              setShowLoyaltyToast(false);
              resolve(loyaltyCheckIn.id, 'Visto ✓');
            }}
          />
        )}
      </AnimatePresence>

      <WaiterBottomNav />
    </div>
  );
}

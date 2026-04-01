import { useEffect } from 'react';
import BarBottomNav from '@/components/bar/BarBottomNav';
import RoleSwitcher from '@/components/RoleSwitcher';
import { useTablesStore } from '@/stores/tablesStore';
import { useBarStore, isDrinkItem, type DrinkOrder } from '@/stores/barStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import CookingTimer, { getOverdueMinutes } from '@/components/waiter/CookingTimer';

function minutesAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export default function BarDashboard() {
  const tables = useTablesStore((s) => s.tables);
  const { orders, setOrders, updateStatus } = useBarStore();
  const addNotification = useNotificationsStore((s) => s.addNotification);

  // Sync drink orders from all active table rounds
  useEffect(() => {
    const drinkOrders: DrinkOrder[] = [];
    tables.forEach((table) => {
      if (table.status === 'empty') return;
      table.rounds.forEach((round) => {
        round.items.forEach((item, idx) => {
          if (isDrinkItem(item.name)) {
            const id = `${table.id}-r${round.number}-i${idx}`;
            const existing = orders.find((o) => o.id === id);
            drinkOrders.push({
              id,
              tableId: table.id,
              tableNumber: table.number,
              roundNumber: round.number,
              itemName: item.name,
              qty: item.qty,
              status: existing?.status ?? 'pending',
              createdAt: round.createdAt,
              estimatedMinutes: existing?.estimatedMinutes,
              preparingStartedAt: existing?.preparingStartedAt,
            });
          }
        });
      });
    });
    setOrders(drinkOrders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables]);

  const handleAccept = (orderId: string) => {
    updateStatus(orderId, 'preparing');
  };

  const handleReady = (order: DrinkOrder) => {
    updateStatus(order.id, 'ready');
    addNotification({
      id: `bar-ready-${order.id}-${Date.now()}`,
      type: 'bar-msg',
      priority: 'medium',
      tableId: order.tableId,
      title: `Bebida lista · Mesa ${order.tableNumber}`,
      subtitle: `${order.itemName} ×${order.qty}`,
      channel: 'barra',
      timestamp: new Date().toISOString(),
      dismissed: false,
      resolved: false,
    });
  };

  const pending = orders.filter((o) => o.status === 'pending');
  const preparing = orders.filter((o) => o.status === 'preparing').sort((a, b) => {
    // Overdue first
    const aOver = a.preparingStartedAt && a.estimatedMinutes
      ? getOverdueMinutes((Date.now() - new Date(a.preparingStartedAt).getTime()) / 1000, a.estimatedMinutes)
      : 0;
    const bOver = b.preparingStartedAt && b.estimatedMinutes
      ? getOverdueMinutes((Date.now() - new Date(b.preparingStartedAt).getTime()) / 1000, b.estimatedMinutes)
      : 0;
    return bOver - aOver;
  });
  const ready = orders.filter((o) => o.status === 'ready');

  return (
    <div className="min-h-screen bg-w-bg pb-20">
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-w-text">Pedidos de Barra</h1>
          <RoleSwitcher />
        </div>
      </div>

      <div className="px-4 pt-3 space-y-4">
        {/* Summary pills */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl bg-w-surface border border-w-border p-2.5 text-center">
            <p className="text-[20px] font-bold text-w-warning">{pending.length}</p>
            <p className="text-[10px] text-w-text-secondary">Pendientes</p>
          </div>
          <div className="flex-1 rounded-xl bg-w-surface border border-w-border p-2.5 text-center">
            <p className="text-[20px] font-bold text-w-brand">{preparing.length}</p>
            <p className="text-[10px] text-w-text-secondary">Preparando</p>
          </div>
          <div className="flex-1 rounded-xl bg-w-surface border border-w-border p-2.5 text-center">
            <p className="text-[20px] font-bold text-w-success">{ready.length}</p>
            <p className="text-[10px] text-w-text-secondary">Listos</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[48px] mb-3">🍸</p>
            <p className="text-[18px] font-semibold text-w-text">Sin pedidos de bebidas</p>
            <p className="text-[13px] text-w-text-secondary mt-1">Los pedidos aparecerán aquí automáticamente</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <section>
                <h2 className="text-[13px] font-semibold text-w-warning mb-2">Pendientes</h2>
                <div className="space-y-2">
                  {pending.map((o) => (
                    <OrderCard key={o.id} order={o} onAction={() => handleAccept(o.id)} actionLabel="Aceptar" actionColor="bg-w-warning" />
                  ))}
                </div>
              </section>
            )}

            {/* Preparing */}
            {preparing.length > 0 && (
              <section>
                <h2 className="text-[13px] font-semibold text-w-brand mb-2">En preparación</h2>
                <div className="space-y-2">
                  {preparing.map((o) => {
                    const isOverdue = o.preparingStartedAt && o.estimatedMinutes
                      ? getOverdueMinutes((Date.now() - new Date(o.preparingStartedAt).getTime()) / 1000, o.estimatedMinutes) > 0
                      : false;
                    return (
                      <div key={o.id} className={`rounded-xl bg-w-surface border p-3 space-y-2 ${isOverdue ? 'border-w-error/50 bg-w-error/5' : 'border-w-border'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[14px] font-medium text-w-text">{o.itemName} ×{o.qty}</p>
                            <p className="text-[11px] text-w-text-secondary">Mesa {o.tableNumber} · R{o.roundNumber}</p>
                          </div>
                          <button
                            onClick={() => handleReady(o)}
                            className="px-3 py-1.5 rounded-lg bg-w-success text-white text-[12px] font-medium min-h-[36px]"
                          >
                            Listo ✓
                          </button>
                        </div>
                        {o.preparingStartedAt && o.estimatedMinutes && (
                          <CookingTimer startedAt={o.preparingStartedAt} estimatedMinutes={o.estimatedMinutes} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Ready */}
            {ready.length > 0 && (
              <section>
                <h2 className="text-[13px] font-semibold text-w-success mb-2">Listos para recoger</h2>
                <div className="space-y-2">
                  {ready.map((o) => (
                    <div key={o.id} className="rounded-xl bg-w-surface border border-w-success/30 p-3 flex items-center justify-between opacity-70">
                      <div>
                        <p className="text-[14px] font-medium text-w-text">{o.itemName} ×{o.qty}</p>
                        <p className="text-[11px] text-w-text-secondary">Mesa {o.tableNumber} · R{o.roundNumber}</p>
                      </div>
                      <span className="text-[11px] text-w-success font-medium">✓ Listo</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <BarBottomNav />
    </div>
  );
}

function OrderCard({
  order,
  onAction,
  actionLabel,
  actionColor,
}: {
  order: DrinkOrder;
  onAction: () => void;
  actionLabel: string;
  actionColor: string;
}) {
  return (
    <div className="rounded-xl bg-w-surface border border-w-border p-3 flex items-center justify-between">
      <div>
        <p className="text-[14px] font-medium text-w-text">{order.itemName} ×{order.qty}</p>
        <p className="text-[11px] text-w-text-secondary">
          Mesa {order.tableNumber} · R{order.roundNumber} · {minutesAgo(order.createdAt)} min
        </p>
      </div>
      <button
        onClick={onAction}
        className={`px-3 py-1.5 rounded-lg ${actionColor} text-white text-[12px] font-medium min-h-[36px]`}
      >
        {actionLabel}
      </button>
    </div>
  );
}

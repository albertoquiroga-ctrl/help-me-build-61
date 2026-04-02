import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import BarBottomNav from '@/components/bar/BarBottomNav';
import RoleSwitcher from '@/components/RoleSwitcher';
import { useTablesStore } from '@/stores/tablesStore';
import { useBarStore, isDrinkItem, type DrinkOrder } from '@/stores/barStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import CookingTimer, { getOverdueMinutes } from '@/components/waiter/CookingTimer';

function minutesAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

/** Group orders by drink name + status, combining quantities and tracking tables */
interface GroupedDrink {
  key: string;
  itemName: string;
  totalQty: number;
  tables: { tableNumber: number; qty: number }[];
  orders: DrinkOrder[];
  oldestCreatedAt: string; // for timer continuity
  status: DrinkOrder['status'];
}

function groupByDrink(orders: DrinkOrder[]): GroupedDrink[] {
  const map = new Map<string, GroupedDrink>();
  for (const o of orders) {
    const key = `${o.itemName}-${o.status}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalQty += o.qty;
      const tbl = existing.tables.find((t) => t.tableNumber === o.tableNumber);
      if (tbl) tbl.qty += o.qty;
      else existing.tables.push({ tableNumber: o.tableNumber, qty: o.qty });
      existing.orders.push(o);
      if (new Date(o.createdAt) < new Date(existing.oldestCreatedAt)) {
        existing.oldestCreatedAt = o.createdAt;
      }
    } else {
      map.set(key, {
        key,
        itemName: o.itemName,
        totalQty: o.qty,
        tables: [{ tableNumber: o.tableNumber, qty: o.qty }],
        orders: [o],
        oldestCreatedAt: o.createdAt,
        status: o.status,
      });
    }
  }
  // Sort by oldest first (longest waiting)
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.oldestCreatedAt).getTime() - new Date(b.oldestCreatedAt).getTime()
  );
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

  const handleAcceptGroup = (group: GroupedDrink) => {
    group.orders.forEach((o) => updateStatus(o.id, 'preparing'));
  };

  const handleReadyGroup = (group: GroupedDrink) => {
    group.orders.forEach((o) => updateStatus(o.id, 'ready'));
    // Send one notification per table
    const tableMap = new Map<string, DrinkOrder>();
    group.orders.forEach((o) => { if (!tableMap.has(o.tableId)) tableMap.set(o.tableId, o); });
    tableMap.forEach((o) => {
      addNotification({
        id: `bar-ready-${o.id}-${Date.now()}`,
        type: 'bar-msg',
        priority: 'medium',
        tableId: o.tableId,
        title: `Bebida lista · Mesa ${o.tableNumber}`,
        subtitle: `${group.itemName} ×${group.totalQty}`,
        channel: 'barra',
        timestamp: new Date().toISOString(),
        dismissed: false,
        resolved: false,
      });
    });
  };

  const pending = useMemo(() => groupByDrink(orders.filter((o) => o.status === 'pending')), [orders]);
  const preparing = useMemo(() => groupByDrink(orders.filter((o) => o.status === 'preparing')), [orders]);
  const ready = useMemo(() => groupByDrink(orders.filter((o) => o.status === 'ready')), [orders]);

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
                  {pending.map((g) => (
                    <GroupCard key={g.key} group={g} onAction={() => handleAcceptGroup(g)} actionLabel="Aceptar" actionColor="bg-w-warning" />
                  ))}
                </div>
              </section>
            )}

            {/* Preparing */}
            {preparing.length > 0 && (
              <section>
                <h2 className="text-[13px] font-semibold text-w-brand mb-2">En preparación</h2>
                <div className="space-y-2">
                  {preparing.map((g) => {
                    const elapsed = (Date.now() - new Date(g.oldestCreatedAt).getTime()) / 1000;
                    const est = 5; // beverages base
                    const isOverdue = getOverdueMinutes(elapsed, est) > 0;
                    return (
                      <ExpandableGroupCard
                        key={g.key}
                        group={g}
                        onAction={() => handleReadyGroup(g)}
                        actionLabel="Listo ✓"
                        actionColor="bg-w-success"
                        borderClass={isOverdue ? 'border-w-error/50 bg-w-error/5' : 'border-w-border'}
                      />
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
                  {ready.map((g) => (
                    <ReadyGroupCard key={g.key} group={g} />
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

/** Table breakdown row */
function TableBreakdown({ tables }: { tables: GroupedDrink['tables'] }) {
  return (
    <div className="border-t border-w-border/50 pt-2 mt-1 space-y-1">
      {tables.sort((a, b) => a.tableNumber - b.tableNumber).map((t) => (
        <div key={t.tableNumber} className="flex items-center justify-between px-1">
          <span className="text-[12px] text-w-text">Mesa {t.tableNumber}</span>
          <span className="text-[12px] font-medium text-w-text-secondary">×{t.qty}</span>
        </div>
      ))}
    </div>
  );
}

/** Expandable group card for pending / preparing */
function ExpandableGroupCard({
  group,
  onAction,
  actionLabel,
  actionColor,
  borderClass,
}: {
  group: GroupedDrink;
  onAction: () => void;
  actionLabel: string;
  actionColor: string;
  borderClass?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const multiTable = group.tables.length > 1;

  return (
    <div className={`rounded-xl bg-w-surface border p-3 space-y-2 ${borderClass || 'border-w-border'}`}>
      <div className="flex items-center justify-between">
        <div
          className={multiTable ? 'cursor-pointer flex-1' : 'flex-1'}
          onClick={() => multiTable && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-1.5">
            <p className="text-[14px] font-medium text-w-text">{group.itemName} ×{group.totalQty}</p>
            {multiTable && (
              expanded
                ? <ChevronUp size={14} className="text-w-text-secondary" />
                : <ChevronDown size={14} className="text-w-text-secondary" />
            )}
          </div>
          <p className="text-[11px] text-w-text-secondary">
            {group.tables.map((t) => `Mesa ${t.tableNumber}${t.qty > 1 ? ` (×${t.qty})` : ''}`).join(', ')}
            {' · '}{minutesAgo(group.oldestCreatedAt)} min esperando
          </p>
        </div>
        <button
          onClick={onAction}
          className={`px-3 py-1.5 rounded-lg ${actionColor} text-white text-[12px] font-medium min-h-[36px] shrink-0 ml-2`}
        >
          {actionLabel}
        </button>
      </div>
      {expanded && <TableBreakdown tables={group.tables} />}
      <CookingTimer startedAt={group.oldestCreatedAt} estimatedMinutes={5} />
    </div>
  );
}

/** Ready group card — always expanded to help sort by table */
function ReadyGroupCard({ group }: { group: GroupedDrink }) {
  const [expanded, setExpanded] = useState(true);
  const multiTable = group.tables.length > 1;

  return (
    <div className="rounded-xl bg-w-surface border border-w-success/30 p-3 space-y-1">
      <div
        className={`flex items-center justify-between ${multiTable ? 'cursor-pointer' : ''}`}
        onClick={() => multiTable && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5">
          <p className="text-[14px] font-medium text-w-text">{group.itemName} ×{group.totalQty}</p>
          {multiTable && (
            expanded
              ? <ChevronUp size={14} className="text-w-text-secondary" />
              : <ChevronDown size={14} className="text-w-text-secondary" />
          )}
        </div>
        <span className="text-[11px] text-w-success font-medium">✓ Listo</span>
      </div>
      {!expanded && (
        <p className="text-[11px] text-w-text-secondary">
          {group.tables.map((t) => `Mesa ${t.tableNumber}`).join(', ')}
        </p>
      )}
      {expanded && <TableBreakdown tables={group.tables} />}
    </div>
  );
}

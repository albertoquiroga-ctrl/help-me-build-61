import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { WaiterTable, Round } from '@/stores/tablesStore';
import { useTablesStore, computeTableBill, computeTotalPaid } from '@/stores/tablesStore';
import { useBarStore } from '@/stores/barStore';
import { toast } from 'sonner';
import OpenTableDialog from './OpenTableDialog';
import { getOverdueMinutes } from './CookingTimer';
import { generateSmartSuggestions } from '@/lib/smartSuggestions';

const CATEGORY_BASE_MINUTES: Record<string, number> = {
  'Bebidas': 5,
  'Entradas': 10,
  'Platos Fuertes': 20,
  'Postres': 12,
  'Otros': 15,
};

/** Get the effective estimated minutes for a round based on its slowest category item × 1.2 */
function getRoundEstimate(r: Round): number {
  const maxBase = r.items.reduce((max, item) => {
    const base = CATEGORY_BASE_MINUTES[item.category || 'Otros'] || 15;
    return Math.max(max, base);
  }, 5);
  return Math.round(maxBase * 1.2);
}

function getDotInfo(table: WaiterTable): { color: string; pulse: boolean } {
  const hasPendingRound = table.rounds.some((r) => r.status === 'pending');
  if (hasPendingRound) return { color: 'bg-w-warning', pulse: true };
  const hasReadyRound = table.rounds.some((r) => r.status === 'ready');
  if (hasReadyRound) return { color: 'bg-w-success', pulse: true };
  const hasCookingRound = table.rounds.some((r) => r.status === 'cooking');
  if (hasCookingRound) return { color: 'bg-w-warning', pulse: false };
  const allDelivered = table.rounds.length > 0 && table.rounds.every((r) => r.status === 'delivered');
  const totalPaid = computeTotalPaid(table);
  if (allDelivered && totalPaid > 0) return { color: 'bg-w-brand', pulse: false };
  if (allDelivered) return { color: 'bg-w-success', pulse: false };
  return { color: 'bg-w-text-secondary', pulse: false };
}

interface TableCardProps { table: WaiterTable; }

export default function TableCard({ table }: TableCardProps) {
  const navigate = useNavigate();
  const openTable = useTablesStore((s) => s.openTable);
  const recalculateStatus = useTablesStore((s) => s.recalculateStatus);
  const isEmpty = table.status === 'empty';
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const dot = getDotInfo(table);
  const totalBill = computeTableBill(table);
  const totalPaid = computeTotalPaid(table);
  const itemCount = table.rounds.reduce((s, r) => s + r.items.reduce((a, i) => a + i.qty, 0), 0);

  // Recalculate status every 30s so the timer text stays fresh
  useEffect(() => {
    const hasActive = table.rounds.some((r) => r.status === 'cooking' || r.status === 'confirmed');
    if (!hasActive) return;
    const iv = setInterval(() => recalculateStatus(table.id), 30000);
    return () => clearInterval(iv);
  }, [table.rounds, table.id, recalculateStatus]);

  if (isEmpty) {
    return (
      <>
        <button
          onClick={() => setShowOpenDialog(true)}
          className="rounded-[10px] border border-dashed border-w-border bg-w-elevated flex flex-col items-center justify-center h-[140px] cursor-pointer active:scale-[0.97] transition-transform hover:border-w-brand/50"
        >
          <p className="font-mono text-[20px] font-bold text-w-text-secondary/40">{table.number}</p>
          <span className="text-[13px] text-w-text-secondary mt-1">Disponible</span>
          <span className="text-[11px] text-w-brand mt-1">Abrir mesa →</span>
        </button>
        <OpenTableDialog
          open={showOpenDialog}
          onOpenChange={setShowOpenDialog}
          tableNumber={table.number}
          onConfirm={() => {
            openTable(table.id);
            setShowOpenDialog(false);
            toast.success(`✓ Mesa ${table.number} abierta`);
          }}
        />
      </>
    );
  }

  // Compute nearest timer info for active rounds
  const activeRounds = table.rounds.filter((r) => r.status === 'cooking' || r.status === 'confirmed');
  let timerBadge: React.ReactNode = null;
  if (activeRounds.length > 0) {
    let nearestRemaining = Infinity;
    let nearestOverdue = 0;
    activeRounds.forEach((r) => {
      const started = r.cookingStartedAt || r.createdAt;
      const est = getRoundEstimate(r);
      const elapsedSec = (Date.now() - new Date(started).getTime()) / 1000;
      const remaining = est * 60 - elapsedSec;
      const overdue = getOverdueMinutes(elapsedSec, est);
      if (remaining < nearestRemaining) {
        nearestRemaining = remaining;
        nearestOverdue = overdue;
      }
    });

    if (nearestOverdue > 0) {
      timerBadge = (
        <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-w-error/15 text-w-error font-mono font-semibold animate-pulse">
          ⏰ +{nearestOverdue}m
        </span>
      );
    } else {
      const remainMin = Math.ceil(Math.max(0, nearestRemaining) / 60);
      timerBadge = (
        <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-w-warning/15 text-w-warning font-mono font-semibold">
          🔥 ~{remainMin}m
        </span>
      );
    }
  }

  // Bar drink overdue
  const barOrders = useBarStore.getState().orders.filter(
    (o) => o.tableId === table.id && o.status === 'preparing' && o.preparingStartedAt && o.estimatedMinutes
  );
  const overdueDrink = barOrders.find((o) => {
    const elapsed = (Date.now() - new Date(o.preparingStartedAt!).getTime()) / 1000;
    return getOverdueMinutes(elapsed, o.estimatedMinutes!) > 0;
  });
  let drinkBadge: React.ReactNode = null;
  if (overdueDrink) {
    const elapsed = (Date.now() - new Date(overdueDrink.preparingStartedAt!).getTime()) / 1000;
    const over = getOverdueMinutes(elapsed, overdueDrink.estimatedMinutes!);
    drinkBadge = (
      <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-w-error/15 text-w-error font-mono font-semibold animate-pulse">
        🍸 +{over}m
      </span>
    );
  }

  return (
    <div
      onClick={() => navigate(`/waiter/table/${table.id}`)}
      className="rounded-[10px] border border-w-border bg-w-surface p-3 relative cursor-pointer active:scale-[0.97] transition-transform h-[140px] flex flex-col"
    >
      <div className={cn('absolute top-2.5 right-2.5 w-2 h-2 rounded-full', dot.color, dot.pulse && 'animate-pulse-dot')} />
      <p className="font-mono text-[20px] font-bold text-w-text text-center">{table.number}</p>
      {itemCount > 0 && (
        <p className="text-[12px] text-w-text-secondary text-center mt-0.5">🍽 {itemCount} items</p>
      )}
      <div className="flex justify-center mt-1.5 gap-1 flex-wrap">
        {timerBadge}
        {drinkBadge}
        {totalBill > 0 && totalPaid > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-w-success/15 text-w-success font-mono">
            ${totalPaid}/${totalBill}
          </span>
        )}
      </div>
      <div className="mt-auto flex items-end justify-between">
        <span className="text-[11px] text-w-text-secondary leading-tight">{table.statusText}</span>
        <span className="font-mono text-[11px] text-w-text-secondary">
          {table.timeOpened >= 60 ? `${Math.floor(table.timeOpened / 60)}h ${table.timeOpened % 60}m` : `${table.timeOpened} min`}
        </span>
      </div>
    </div>
  );
}

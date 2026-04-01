import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import RoundBadge from './RoundBadge';
import type { WaiterTable } from '@/stores/tablesStore';
import { useTablesStore } from '@/stores/tablesStore';
import { useBarStore } from '@/stores/barStore';
import { toast } from 'sonner';
import OpenTableDialog from './OpenTableDialog';
import { getOverdueMinutes } from './CookingTimer';

function getDotInfo(table: WaiterTable): { color: string; pulse: boolean } {
  const hasFailedPayment = table.guests.some((g) => g.paymentStatus === 'failed');
  if (hasFailedPayment) return { color: 'bg-w-error', pulse: true };
  const hasPendingRound = table.rounds.some((r) => r.status === 'pending');
  if (hasPendingRound) return { color: 'bg-w-warning', pulse: true };
  const hasReadyRound = table.rounds.some((r) => r.status === 'ready');
  if (hasReadyRound) return { color: 'bg-w-success', pulse: true };
  const hasCookingRound = table.rounds.some((r) => r.status === 'cooking');
  if (hasCookingRound) return { color: 'bg-w-warning', pulse: false };
  const allDelivered = table.rounds.length > 0 && table.rounds.every((r) => r.status === 'delivered');
  const somePaying = table.guests.some((g) => g.paymentStatus === 'paid');
  if (allDelivered && somePaying) return { color: 'bg-w-brand', pulse: false };
  if (allDelivered) return { color: 'bg-w-success', pulse: false };
  return { color: 'bg-w-text-secondary', pulse: false };
}

interface TableCardProps { table: WaiterTable; }

export default function TableCard({ table }: TableCardProps) {
  const navigate = useNavigate();
  const openTable = useTablesStore((s) => s.openTable);
  const isEmpty = table.status === 'empty';
  const lastRound = table.rounds[table.rounds.length - 1];
  const dot = getDotInfo(table);
  const [showOpenDialog, setShowOpenDialog] = useState(false);

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
          onConfirm={(n) => {
            openTable(table.id, n);
            setShowOpenDialog(false);
            toast.success(`✓ Mesa ${table.number} abierta · ${n} silla${n > 1 ? 's' : ''}`);
          }}
        />
      </>
    );
  }

  return (
    <div
      onClick={() => navigate(`/waiter/table/${table.id}`)}
      className="rounded-[10px] border border-w-border bg-w-surface p-3 relative cursor-pointer active:scale-[0.97] transition-transform h-[140px] flex flex-col"
    >
      <div className={cn('absolute top-2.5 right-2.5 w-2 h-2 rounded-full', dot.color, dot.pulse && 'animate-pulse-dot')} />
      <p className="font-mono text-[20px] font-bold text-w-text text-center">{table.number}</p>
      <p className="text-[12px] text-w-text-secondary text-center mt-0.5">👤 ×{table.guests.length}</p>
      <div className="flex justify-center mt-1.5 gap-1 flex-wrap">
        {lastRound && <RoundBadge round={lastRound.number} />}
        {(() => {
          const overdueRound = table.rounds.find((r) => {
            if (r.status !== 'cooking' || !r.cookingStartedAt || !r.estimatedMinutes) return false;
            const elapsed = (Date.now() - new Date(r.cookingStartedAt).getTime()) / 1000;
            return getOverdueMinutes(elapsed, r.estimatedMinutes) > 0;
          });
          if (!overdueRound || !overdueRound.cookingStartedAt || !overdueRound.estimatedMinutes) return null;
          const elapsed = (Date.now() - new Date(overdueRound.cookingStartedAt).getTime()) / 1000;
          const over = getOverdueMinutes(elapsed, overdueRound.estimatedMinutes);
          return (
            <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-w-error/15 text-w-error font-mono font-semibold animate-pulse">
              ⏰ R{overdueRound.number} +{over}m
            </span>
          );
        })()}
        {(() => {
          const barOrders = useBarStore.getState().orders.filter(
            (o) => o.tableId === table.id && o.status === 'preparing' && o.preparingStartedAt && o.estimatedMinutes
          );
          const overdueDrink = barOrders.find((o) => {
            const elapsed = (Date.now() - new Date(o.preparingStartedAt!).getTime()) / 1000;
            return getOverdueMinutes(elapsed, o.estimatedMinutes!) > 0;
          });
          if (!overdueDrink) return null;
          const elapsed = (Date.now() - new Date(overdueDrink.preparingStartedAt!).getTime()) / 1000;
          const over = getOverdueMinutes(elapsed, overdueDrink.estimatedMinutes!);
          return (
            <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-w-error/15 text-w-error font-mono font-semibold animate-pulse">
              🍸 +{over}m
            </span>
          );
        })()}
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

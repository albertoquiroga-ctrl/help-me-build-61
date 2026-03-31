import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import RoundBadge from './RoundBadge';
import type { WaiterTable } from '@/stores/tablesStore';

/** Derive dot color from actual table data */
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

interface TableCardProps {
  table: WaiterTable;
}

export default function TableCard({ table }: TableCardProps) {
  const navigate = useNavigate();
  const isEmpty = table.status === 'empty';
  const lastRound = table.rounds[table.rounds.length - 1];
  const dot = getDotInfo(table);

  if (isEmpty) {
    return (
      <div className="rounded-[10px] border border-dashed border-w-border bg-w-elevated flex items-center justify-center h-[140px]">
        <span className="text-[13px] text-w-text-secondary">Disponible</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/waiter/table/${table.id}`)}
      className="rounded-[10px] border border-w-border bg-w-surface p-3 relative cursor-pointer active:scale-[0.97] transition-transform h-[140px] flex flex-col"
    >
      {/* Status dot */}
      <div className={cn(
        'absolute top-2.5 right-2.5 w-2 h-2 rounded-full',
        dot.color,
        dot.pulse && 'animate-pulse-dot'
      )} />

      <p className="font-mono text-[20px] font-bold text-w-text text-center">{table.number}</p>
      <p className="text-[12px] text-w-text-secondary text-center mt-0.5">👤 ×{table.guests.length}</p>

      <div className="flex justify-center mt-1.5">
        {lastRound && <RoundBadge round={lastRound.number} />}
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

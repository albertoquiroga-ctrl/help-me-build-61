import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import RoundBadge from './RoundBadge';
import type { WaiterTable } from '@/stores/tablesStore';

const statusDotColor: Record<string, string> = {
  active: 'bg-w-success',
  paying: 'bg-w-priority',
  problem: 'bg-w-error',
  empty: '',
};

interface TableCardProps {
  table: WaiterTable;
}

export default function TableCard({ table }: TableCardProps) {
  const navigate = useNavigate();
  const isEmpty = table.status === 'empty';
  const needsAttention = table.statusText.includes('pendiente') || table.statusText.includes('Check-in');
  const lastRound = table.rounds[table.rounds.length - 1];

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
        statusDotColor[table.status] || 'bg-w-warning',
        needsAttention && 'animate-pulse-dot'
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

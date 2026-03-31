import { cn } from '@/lib/utils';

const roundColors: Record<number, string> = {
  1: 'bg-w-priority/15 border-w-priority/40 text-w-priority',
  2: 'bg-w-warning/15 border-w-warning/40 text-w-warning',
  3: 'bg-w-success/15 border-w-success/40 text-w-success',
};

export default function RoundBadge({ round }: { round: number }) {
  const colors = roundColors[round] || roundColors[3];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-[6px] border font-mono text-[10px] font-medium', colors)}>
      R{round}
    </span>
  );
}

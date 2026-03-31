import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderItem } from '@/stores/tablesStore';

interface PickupChecklistProps {
  items: OrderItem[];
  onAllChecked?: () => void;
}

export default function PickupChecklist({ items, onAllChecked }: PickupChecklistProps) {
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false));

  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
    if (next.every(Boolean)) onAllChecked?.();
  };

  const allChecked = checked.every(Boolean);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          className="flex items-center gap-3 w-full min-h-[44px] text-left"
        >
          <div className={cn(
            'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors',
            checked[i] ? 'bg-w-success border-w-success' : 'border-w-border'
          )}>
            {checked[i] && <Check size={12} className="text-white" />}
          </div>
          <span className={cn('text-[13px]', checked[i] ? 'text-w-text-secondary line-through' : 'text-w-text')}>
            {item.name} ×{item.qty}
          </span>
        </button>
      ))}
      {allChecked && (
        <p className="text-[11px] text-w-success font-medium mt-1">✓ Todo listo para entregar</p>
      )}
    </div>
  );
}

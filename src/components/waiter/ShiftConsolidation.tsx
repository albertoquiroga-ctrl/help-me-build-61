import { useState, useMemo } from 'react';
import { useTablesStore, computeTableBill, computeTotalPaid, type WaiterTable, type PaymentRecord } from '@/stores/tablesStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

type MethodKey = 'all' | 'qr' | 'card-physical' | 'cash';

const METHOD_LABELS: Record<string, string> = {
  qr: 'App/QR',
  'card-physical': 'Terminal',
  cash: 'Efectivo',
};

interface TablePayments {
  table: WaiterTable;
  payments: PaymentRecord[];
  subtotal: number;
  tipSubtotal: number;
  bill: number;
  totalPaid: number;
}

function groupByTable(tables: WaiterTable[], methodFilter?: PaymentRecord['method']): TablePayments[] {
  return tables
    .map((t) => {
      const payments = methodFilter ? t.payments.filter((p) => p.method === methodFilter) : t.payments;
      if (payments.length === 0) return null;
      return {
        table: t,
        payments,
        subtotal: payments.reduce((s, p) => s + p.amount, 0),
        tipSubtotal: payments.reduce((s, p) => s + p.tipAmount, 0),
        bill: computeTableBill(t),
        totalPaid: computeTotalPaid(t),
      };
    })
    .filter(Boolean) as TablePayments[];
}

function generateReport(groups: TablePayments[], label: string): string {
  let text = `═══ CONSOLIDACIÓN DE TURNO ═══\nMétodo: ${label}\n\n`;
  let grandTotal = 0;
  let grandTips = 0;

  for (const g of groups) {
    text += `MESA ${g.table.number}\n`;
    for (const p of g.payments) {
      text += `  ${p.guestName || 'Anón'} · ${METHOD_LABELS[p.method]} · $${p.amount} ${p.tipAmount ? `(propina $${p.tipAmount})` : ''}\n`;
    }
    text += `  Subtotal: $${g.subtotal} · Propinas: $${g.tipSubtotal}\n`;
    if (g.bill !== g.totalPaid) {
      text += `  ⚠ Discrepancia: cuenta $${g.bill} vs cobrado $${g.totalPaid}\n`;
    }
    text += '\n';
    grandTotal += g.subtotal;
    grandTips += g.tipSubtotal;
  }

  text += `═══════════════════════════\nTOTAL: $${grandTotal}  |  Propinas: $${grandTips}\n`;
  return text;
}

function PaymentRow({ p }: { p: PaymentRecord }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-1">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-w-text-secondary">{p.guestName || 'Anón'}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-w-border/50 text-w-text-secondary">{METHOD_LABELS[p.method]}</span>
      </div>
      <div className="text-right">
        <span className="font-mono text-[13px] text-w-text">${p.amount}</span>
        {p.tipAmount > 0 && <span className="font-mono text-[11px] text-w-tip ml-2">+${p.tipAmount}</span>}
      </div>
    </div>
  );
}

function TableGroup({ group }: { group: TablePayments }) {
  const hasDiscrepancy = group.bill !== group.totalPaid && group.bill > 0;

  return (
    <div className={`rounded-[8px] border p-3 ${hasDiscrepancy ? 'border-w-error/50 bg-w-error/5' : 'border-w-border bg-w-surface'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] font-semibold text-w-text">Mesa {group.table.number}</span>
        {hasDiscrepancy && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-w-error/10 text-w-error font-medium">
            ⚠ Diferencia ${Math.abs(group.bill - group.totalPaid)}
          </span>
        )}
      </div>
      <div className="divide-y divide-w-border/30">
        {group.payments.map((p) => (
          <PaymentRow key={p.id} p={p} />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-w-border/50">
        <span className="text-[11px] text-w-text-secondary">Subtotal</span>
        <div>
          <span className="font-mono text-[13px] font-semibold text-w-text">${group.subtotal}</span>
          {group.tipSubtotal > 0 && <span className="font-mono text-[11px] text-w-tip ml-2">♥ ${group.tipSubtotal}</span>}
        </div>
      </div>
    </div>
  );
}

function MethodTab({ groups, label }: { groups: TablePayments[]; label: string }) {
  const grandTotal = groups.reduce((s, g) => s + g.subtotal, 0);
  const grandTips = groups.reduce((s, g) => s + g.tipSubtotal, 0);

  if (groups.length === 0) {
    return <p className="text-[13px] text-w-text-secondary text-center py-6">Sin cobros por {label}</p>;
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <TableGroup key={g.table.id} group={g} />
      ))}
      <div className="rounded-[8px] bg-w-brand/10 border border-w-brand/30 p-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-w-text">Total {label}</span>
        <div>
          <span className="font-mono text-[16px] font-bold text-w-text">${grandTotal}</span>
          {grandTips > 0 && <span className="font-mono text-[13px] text-w-tip ml-2">♥ ${grandTips}</span>}
        </div>
      </div>
    </div>
  );
}

export default function ShiftConsolidation() {
  const tables = useTablesStore((s) => s.tables);
  const [open, setOpen] = useState(false);

  const activeTables = useMemo(() => tables.filter((t) => t.payments.length > 0), [tables]);

  const allGroups = useMemo(() => groupByTable(activeTables), [activeTables]);
  const qrGroups = useMemo(() => groupByTable(activeTables, 'qr'), [activeTables]);
  const cardGroups = useMemo(() => groupByTable(activeTables, 'card-physical'), [activeTables]);
  const cashGroups = useMemo(() => groupByTable(activeTables, 'cash'), [activeTables]);

  const grandTotal = allGroups.reduce((s, g) => s + g.subtotal, 0);
  const grandTips = allGroups.reduce((s, g) => s + g.tipSubtotal, 0);

  const handleCopy = (groups: TablePayments[], label: string) => {
    navigator.clipboard.writeText(generateReport(groups, label));
    toast.success('Reporte copiado al portapapeles');
  };

  const handleShare = async (groups: TablePayments[], label: string) => {
    const text = generateReport(groups, label);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Consolidación de turno', text });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Reporte copiado al portapapeles');
    }
  };

  return (
    <div className="rounded-[10px] bg-w-surface border border-w-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px]">💰</span>
          <span className="text-[14px] font-semibold text-w-text">Consolidación de turno</span>
          {grandTotal > 0 && (
            <span className="font-mono text-[12px] text-w-text-secondary">${grandTotal}</span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-w-text-secondary" /> : <ChevronDown size={16} className="text-w-text-secondary" />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          <Tabs defaultValue="all">
            <TabsList className="w-full bg-w-border/30 mb-3">
              <TabsTrigger value="all" className="flex-1 text-[12px]">Todos</TabsTrigger>
              <TabsTrigger value="qr" className="flex-1 text-[12px]">App</TabsTrigger>
              <TabsTrigger value="card" className="flex-1 text-[12px]">Terminal</TabsTrigger>
              <TabsTrigger value="cash" className="flex-1 text-[12px]">Efectivo</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <MethodTab groups={allGroups} label="General" />
            </TabsContent>
            <TabsContent value="qr">
              <MethodTab groups={qrGroups} label="App/QR" />
            </TabsContent>
            <TabsContent value="card">
              <MethodTab groups={cardGroups} label="Terminal" />
            </TabsContent>
            <TabsContent value="cash">
              <MethodTab groups={cashGroups} label="Efectivo" />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleCopy(allGroups, 'General')}
              className="flex-1 h-10 rounded-[8px] border border-w-border text-[12px] text-w-text-secondary font-medium flex items-center justify-center gap-1.5"
            >
              <Copy size={14} /> Copiar reporte
            </button>
            <button
              onClick={() => handleShare(allGroups, 'General')}
              className="flex-1 h-10 rounded-[8px] border border-w-border text-[12px] text-w-text-secondary font-medium flex items-center justify-center gap-1.5"
            >
              <Share2 size={14} /> Compartir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

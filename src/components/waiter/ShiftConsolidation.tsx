import { useState, useMemo, useRef } from 'react';
import { useTablesStore, computeTableBill, computeTotalPaid, type WaiterTable, type PaymentRecord } from '@/stores/tablesStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Copy, Share2, Camera, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

const METHOD_LABELS: Record<string, string> = {
  qr: 'App/QR',
  'card-physical': 'Terminal',
  cash: 'Efectivo',
};

interface FlatPayment {
  payment: PaymentRecord;
  tableId: string;
  tableNumber: number;
}

function getFlatPayments(tables: WaiterTable[], methodFilter?: PaymentRecord['method']): FlatPayment[] {
  return tables
    .flatMap((t) =>
      t.payments
        .filter((p) => !methodFilter || p.method === methodFilter)
        .map((p) => ({ payment: p, tableId: t.id, tableNumber: t.number }))
    )
    .sort((a, b) => new Date(a.payment.timestamp).getTime() - new Date(b.payment.timestamp).getTime());
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function generateReport(rows: FlatPayment[], label: string): string {
  let text = `═══ CONSOLIDACIÓN DE TURNO ═══\nMétodo: ${label}\n\n`;
  let total = 0;
  let tips = 0;

  for (const r of rows) {
    const p = r.payment;
    const voucher = p.voucherPhoto ? ' (con voucher)' : '';
    text += `Mesa ${r.tableNumber} · ${formatTime(p.timestamp)} · $${p.amount}`;
    if (p.tipAmount > 0) text += ` (propina $${p.tipAmount})`;
    if (p.guestName) text += ` · ${p.guestName}`;
    text += `${voucher}\n`;
    total += p.amount;
    tips += p.tipAmount;
  }

  text += `\n═══════════════════════════\nTOTAL: $${total}  |  Propinas: $${tips}\n`;
  return text;
}

function VoucherButton({ payment, tableId }: { payment: PaymentRecord; tableId: string }) {
  const attachVoucher = useTablesStore((s) => s.attachVoucher);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      attachVoucher(tableId, payment.id, reader.result as string);
      toast.success('Voucher guardado');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (payment.voucherPhoto) {
    return (
      <>
        <button
          onClick={() => setPreview(true)}
          className="w-7 h-7 rounded-[6px] bg-emerald-500/15 flex items-center justify-center"
        >
          <CheckCircle2 size={14} className="text-emerald-500" />
        </button>
        {preview && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(false)}>
            <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <img src={payment.voucherPhoto} alt="Voucher" className="w-full rounded-lg" />
              <button onClick={() => setPreview(false)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-w-surface flex items-center justify-center">
                <X size={16} className="text-w-text" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <button
        onClick={() => inputRef.current?.click()}
        className="w-7 h-7 rounded-[6px] bg-w-border/30 flex items-center justify-center"
      >
        <Camera size={14} className="text-w-text-secondary" />
      </button>
    </>
  );
}

function PaymentRow({ row, showMethod, showCamera }: { row: FlatPayment; showMethod?: boolean; showCamera?: boolean }) {
  const p = row.payment;
  const showVoucher = showCamera || (showMethod && p.method === 'card-physical');
  return (
    <div className="flex items-center gap-2 py-2 px-1">
      <span className="text-[12px] font-medium text-w-text w-14 shrink-0">Mesa {row.tableNumber}</span>
      <span className="text-[11px] text-w-text-secondary w-12 shrink-0">{formatTime(p.timestamp)}</span>
      {showMethod && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-w-border/50 text-w-text-secondary shrink-0">
          {METHOD_LABELS[p.method]}
        </span>
      )}
      {p.guestName && <span className="text-[11px] text-w-text-secondary truncate">{p.guestName}</span>}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <span className="font-mono text-[13px] text-w-text">${p.amount}</span>
        {p.tipAmount > 0 && <span className="font-mono text-[11px] text-w-tip">+${p.tipAmount}</span>}
        {showVoucher && <VoucherButton payment={p} tableId={row.tableId} />}
      </div>
    </div>
  );
}

function DiscrepancyNote({ tables }: { tables: WaiterTable[] }) {
  const issues = tables
    .filter((t) => {
      const bill = computeTableBill(t);
      const paid = computeTotalPaid(t);
      return bill > 0 && paid > 0 && bill !== paid;
    })
    .map((t) => ({ number: t.number, diff: computeTableBill(t) - computeTotalPaid(t) }));

  if (issues.length === 0) return null;

  return (
    <div className="rounded-[8px] bg-w-error/5 border border-w-error/30 p-3 mt-3">
      <span className="text-[11px] font-semibold text-w-error">⚠ Mesas con diferencia cuenta vs cobrado:</span>
      {issues.map((i) => (
        <p key={i.number} className="text-[11px] text-w-error/80 mt-0.5">
          Mesa {i.number}: {i.diff > 0 ? `falta $${i.diff}` : `excede $${Math.abs(i.diff)}`}
        </p>
      ))}
    </div>
  );
}

function MethodList({ rows, label, showCamera, showMethod }: { rows: FlatPayment[]; label: string; showCamera?: boolean; showMethod?: boolean }) {
  const total = rows.reduce((s, r) => s + r.payment.amount, 0);
  const tips = rows.reduce((s, r) => s + r.payment.tipAmount, 0);

  if (rows.length === 0) {
    return <p className="text-[13px] text-w-text-secondary text-center py-6">Sin cobros por {label}</p>;
  }

  return (
    <div>
      <div className="divide-y divide-w-border/30">
        {rows.map((r) => (
          <PaymentRow key={r.payment.id} row={r} showCamera={showCamera} showMethod={showMethod} />
        ))}
      </div>
      <div className="rounded-[8px] bg-w-brand/10 border border-w-brand/30 p-3 flex items-center justify-between mt-2">
        <span className="text-[13px] font-semibold text-w-text">Total {label}</span>
        <div>
          <span className="font-mono text-[16px] font-bold text-w-text">${total}</span>
          {tips > 0 && <span className="font-mono text-[13px] text-w-tip ml-2">♥ ${tips}</span>}
        </div>
      </div>
    </div>
  );
}

export default function ShiftConsolidation() {
  const tables = useTablesStore((s) => s.tables);
  const [open, setOpen] = useState(false);

  const activeTables = useMemo(() => tables.filter((t) => t.payments.length > 0), [tables]);

  const allRows = useMemo(() => getFlatPayments(activeTables), [activeTables]);
  const qrRows = useMemo(() => getFlatPayments(activeTables, 'qr'), [activeTables]);
  const cardRows = useMemo(() => getFlatPayments(activeTables, 'card-physical'), [activeTables]);
  const cashRows = useMemo(() => getFlatPayments(activeTables, 'cash'), [activeTables]);

  const grandTotal = allRows.reduce((s, r) => s + r.payment.amount, 0);

  const handleCopy = (rows: FlatPayment[], label: string) => {
    navigator.clipboard.writeText(generateReport(rows, label));
    toast.success('Reporte copiado al portapapeles');
  };

  const handleShare = async (rows: FlatPayment[], label: string) => {
    const text = generateReport(rows, label);
    if (navigator.share) {
      try { await navigator.share({ title: 'Consolidación de turno', text }); } catch { /* cancelled */ }
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
              <MethodList rows={allRows} label="General" showCamera={false} />
            </TabsContent>
            <TabsContent value="qr">
              <MethodList rows={qrRows} label="App/QR" />
            </TabsContent>
            <TabsContent value="card">
              <MethodList rows={cardRows} label="Terminal" showCamera />
            </TabsContent>
            <TabsContent value="cash">
              <MethodList rows={cashRows} label="Efectivo" />
            </TabsContent>
          </Tabs>

          <DiscrepancyNote tables={activeTables} />

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleCopy(allRows, 'General')}
              className="flex-1 h-10 rounded-[8px] border border-w-border text-[12px] text-w-text-secondary font-medium flex items-center justify-center gap-1.5"
            >
              <Copy size={14} /> Copiar reporte
            </button>
            <button
              onClick={() => handleShare(allRows, 'General')}
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

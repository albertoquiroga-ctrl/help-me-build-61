import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTablesStore } from '@/stores/tablesStore';
import GuestPill from '@/components/waiter/GuestPill';
import RoundBadge from '@/components/waiter/RoundBadge';
import { toast } from 'sonner';

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  delivered: { bg: 'bg-w-success/15', text: 'text-w-success', label: 'Entregado ✓' },
  cooking: { bg: 'bg-w-warning/15', text: 'text-w-warning', label: 'En cocina 🔥' },
  ready: { bg: 'bg-w-priority/15', text: 'text-w-priority', label: 'Listo para recoger 🚶' },
  confirmed: { bg: 'bg-w-priority/15', text: 'text-w-priority', label: 'Confirmado' },
  pending: { bg: 'bg-w-text-secondary/15', text: 'text-w-text-secondary', label: 'Pendiente' },
};

export default function TableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const table = useTablesStore((s) => s.tables.find((t) => t.id === id));
  const markDelivered = useTablesStore((s) => s.markDelivered);
  const updateRoundStatus = useTablesStore((s) => s.updateRoundStatus);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  if (!table) return <div className="min-h-screen bg-w-bg flex items-center justify-center text-w-text-secondary">Mesa no encontrada</div>;

  const paidCount = table.guests.filter((g) => g.paymentStatus === 'paid' || g.paymentStatus === 'left').length;
  const paidPct = table.guests.length > 0 ? Math.round((paidCount / table.guests.length) * 100) : 0;
  const readyRound = table.rounds.find((r) => r.status === 'ready');
  const cookingRound = table.rounds.find((r) => r.status === 'cooking');
  const pendingRound = table.rounds.find((r) => r.status === 'pending');
  const allDelivered = table.rounds.length > 0 && table.rounds.every((r) => r.status === 'delivered');
  const noPaying = table.guests.every((g) => g.paymentStatus === 'pending');

  return (
    <div className="min-h-screen bg-w-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur-md border-b border-w-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/waiter/dashboard')} className="flex items-center gap-2 min-h-[44px]">
          <ArrowLeft size={18} className="text-w-text" />
          <span className="text-[18px] font-semibold text-w-text">Mesa {table.number}</span>
        </button>
        <span className="font-mono text-[12px] text-w-text-secondary">
          {table.timeOpened >= 60 ? `${Math.floor(table.timeOpened / 60)}h ${table.timeOpened % 60}m` : `${table.timeOpened} min`}
        </span>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* Guests */}
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-w-text-secondary mb-2">Comensales</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {table.guests.map((g) => <GuestPill key={g.id} guest={g} />)}
          </div>
          {table.guests.length > 0 && (
            <div className="mt-2">
              <div className="w-full h-1.5 bg-w-border rounded-full overflow-hidden">
                <div className="h-full bg-w-brand rounded-full transition-all" style={{ width: `${paidPct}%` }} />
              </div>
              <p className="text-[11px] text-w-text-secondary mt-1">{paidCount} de {table.guests.length} pagaron · {paidPct}%</p>
            </div>
          )}
        </div>

        {/* Rounds */}
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-w-text-secondary mb-2">Rondas</p>
          <div className="space-y-2">
            {table.rounds.map((round) => {
              const badge = statusBadge[round.status];
              const isExpanded = expandedRound === round.number;
              return (
                <div key={round.number} className="rounded-[10px] border border-w-border bg-w-surface overflow-hidden">
                  <button
                    onClick={() => setExpandedRound(isExpanded ? null : round.number)}
                    className="w-full flex items-center justify-between p-3 min-h-[44px]"
                  >
                    <div className="flex items-center gap-2">
                      <RoundBadge round={round.number} />
                      <span className="text-[13px] text-w-text font-medium">{round.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-[6px] ${badge.bg} ${badge.text}`}>{badge.label}</span>
                      {isExpanded ? <ChevronUp size={14} className="text-w-text-secondary" /> : <ChevronDown size={14} className="text-w-text-secondary" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-w-border pt-2 space-y-1.5">
                      {round.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-[12px]">
                          <span className="text-w-text">{item.name} ×{item.qty}</span>
                          <span className="font-mono text-w-text-secondary">${item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contextual Actions */}
        <div className="space-y-2">
          {/* Pending round → Confirm / Reject */}
          {pendingRound && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateRoundStatus(table.id, pendingRound.number, 'confirmed');
                  toast.success(`✓ R${pendingRound.number} confirmada · Mesa ${table.number}`);
                }}
                className="flex-1 h-12 rounded-[8px] bg-w-brand text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
              >
                Confirmar R{pendingRound.number} ✓
              </button>
              <button
                onClick={() => {
                  toast.warning(`Rechazo enviado · R${pendingRound.number} Mesa ${table.number}`);
                }}
                className="flex-1 h-12 rounded-[8px] border border-w-error text-w-error font-semibold text-[14px] active:scale-[0.98] transition-transform"
              >
                Rechazar
              </button>
            </div>
          )}

          {/* Ready round → Mark delivered */}
          {readyRound && (
            <button
              onClick={() => {
                markDelivered(table.id, readyRound.number);
                toast.success(`✓ R${readyRound.number} entregada · Mesa ${table.number}`);
              }}
              className="w-full h-12 rounded-[8px] bg-w-success text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            >
              Marcar R{readyRound.number} como entregado ✓
            </button>
          )}

          {/* Cooking → info only */}
          {!pendingRound && !readyRound && cookingRound && (
            <div className="rounded-[8px] border border-w-warning/30 bg-w-warning/5 p-3 text-center">
              <p className="text-[13px] text-w-warning font-medium">🔥 R{cookingRound.number} en cocina</p>
            </div>
          )}

          {/* All delivered + nobody paying → Suggest bill */}
          {allDelivered && noPaying && table.guests.length > 0 && (
            <button
              onClick={() => toast.info('💳 Sugerencia de cuenta enviada a los comensales')}
              className="w-full h-12 rounded-[8px] border border-w-brand text-w-brand font-semibold text-[14px] active:scale-[0.98] transition-transform"
            >
              💳 Sugerir cuenta
            </button>
          )}
        </div>

        {/* Tips */}
        {table.tipTotal > 0 && (
          <p className="text-center font-mono text-[13px] text-w-tip">
            ${table.tipTotal} MXN recibidos en propinas
          </p>
        )}
      </div>
    </div>
  );
}

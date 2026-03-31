import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2, Minus, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTablesStore, guestDisplayName } from '@/stores/tablesStore';
import type { GuestInfo } from '@/stores/tablesStore';
import GuestPill from '@/components/waiter/GuestPill';
import RoundBadge from '@/components/waiter/RoundBadge';
import ManualOrderSheet from '@/components/waiter/ManualOrderSheet';
import CashPaymentSheet from '@/components/waiter/CashPaymentSheet';
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
  const removeItemFromRound = useTablesStore((s) => s.removeItemFromRound);
  const editItemInRound = useTablesStore((s) => s.editItemInRound);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [manualOrderGuest, setManualOrderGuest] = useState<{ id: string; name: string } | null>(null);
  const [cashPaymentGuest, setCashPaymentGuest] = useState<string | null>(null);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newSeatNumber, setNewSeatNumber] = useState('');
  const addGuest = useTablesStore((s) => s.addGuest);
  const initializeSeats = useTablesStore((s) => s.initializeSeats);
  const assignAllSeats = useTablesStore((s) => s.assignAllSeats);
  const assignSeat = useTablesStore((s) => s.assignSeat);
  const closeTable = useTablesStore((s) => s.closeTable);
  const resolve = useNotificationsStore((s) => s.resolve);

  if (!table) return <div className="min-h-screen bg-w-bg flex items-center justify-center text-w-text-secondary">Mesa no encontrada</div>;

  const paidCount = table.guests.filter((g) => g.paymentStatus === 'paid' || g.paymentStatus === 'left').length;
  const paidPct = table.guests.length > 0 ? Math.round((paidCount / table.guests.length) * 100) : 0;
  const readyRound = table.rounds.find((r) => r.status === 'ready');
  const cookingRound = table.rounds.find((r) => r.status === 'cooking');
  const pendingRound = table.rounds.find((r) => r.status === 'pending');
  const allDelivered = table.rounds.length > 0 && table.rounds.every((r) => r.status === 'delivered');
  const noPaying = table.guests.every((g) => g.paymentStatus === 'pending');

  // Guests without orders (manual method + $0 owed)
  const guestsWithoutOrder = table.guests.filter((g) => g.orderMethod === 'manual' && g.amountOwed === 0 && g.paymentStatus === 'pending');
  // Guests who need in-person payment (any unpaid guest)
  const guestsNeedingCashPayment = table.guests.filter(
    (g) => g.paymentStatus !== 'paid' && g.paymentStatus !== 'left'
  );
  // Guests without seat assignment
  const guestsWithoutSeat = table.guests.filter((g) => !g.seatLabel);

  const cashGuest = cashPaymentGuest ? table.guests.find((g) => g.id === cashPaymentGuest) : null;

  const handleAddGuest = () => {
    const seatNum = parseInt(newSeatNumber.trim(), 10);
    if (isNaN(seatNum) || seatNum < 1) return;
    // Create guest and assign seat in one step
    const guestId = `g${table.id}-m${Date.now()}`;
    addGuest(table.id, '');
    // Find the just-added guest (last one) and assign seat
    // We use a slight workaround: addGuest creates with auto name, then we assign seat
    setTimeout(() => {
      const current = useTablesStore.getState().tables.find((t) => t.id === table.id);
      const lastGuest = current?.guests[current.guests.length - 1];
      if (lastGuest) assignSeat(table.id, lastGuest.id, seatNum);
    }, 0);
    toast.success(`✓ Silla ${seatNum} agregada`);
    setNewSeatNumber('');
    setShowAddGuest(false);
  };

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

          {/* Seat initialization for empty tables */}
          {table.guests.length === 0 && (
            <div className="rounded-[10px] border border-dashed border-w-border bg-w-surface p-4 text-center space-y-3">
              <p className="text-[13px] text-w-text">¿Cuántos comensales?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      initializeSeats(table.id, n);
                      toast.success(`✓ ${n} silla${n > 1 ? 's' : ''} creada${n > 1 ? 's' : ''}`);
                    }}
                    className="w-10 h-10 rounded-[8px] border border-w-border bg-w-bg text-w-text font-semibold text-[14px] active:scale-95 transition-transform hover:border-w-brand hover:text-w-brand"
                  >
                    {n === 6 ? '6+' : n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {table.guests.length > 0 && (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center flex-wrap">
                {table.guests.map((g) => <GuestPill key={g.id} guest={g} tableId={table.id} editable />)}
                {!showAddGuest && (
                  <button
                    onClick={() => setShowAddGuest(true)}
                    className="shrink-0 w-8 h-8 rounded-full border border-dashed border-w-text-secondary/40 flex items-center justify-center text-w-text-secondary active:scale-95 transition-transform"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              {showAddGuest && (
                <div className="flex gap-2 mt-1 items-center">
                  <span className="text-[12px] text-w-text-secondary shrink-0">🪑 Silla #</span>
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    value={newSeatNumber}
                    onChange={(e) => setNewSeatNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
                    placeholder="Ej: 5"
                    className="w-16 h-9 rounded-[6px] border border-w-border bg-w-surface px-3 text-[13px] text-w-text text-center placeholder:text-w-text-secondary/50 focus:outline-none focus:border-w-brand"
                  />
                  <button onClick={handleAddGuest} className="px-3 h-9 rounded-[6px] bg-w-brand text-white text-[12px] font-semibold">Agregar</button>
                  <button onClick={() => { setShowAddGuest(false); setNewSeatNumber(''); }} className="px-2 h-9 rounded-[6px] text-w-text-secondary text-[12px]">✕</button>
                </div>
              )}

              {/* Seat assignment banner */}
              {guestsWithoutSeat.length > 0 && table.guests.length > 0 && (
                <div className="mt-2 rounded-[8px] border border-dashed border-w-brand/40 bg-w-brand/5 p-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-w-brand font-medium">🪑 {guestsWithoutSeat.length} sin posición</p>
                    <p className="text-[10px] text-w-text-secondary">Asigna sillas para facilitar el cobro</p>
                  </div>
                  <button
                    onClick={() => {
                      assignAllSeats(table.id);
                      toast.success('✓ Posiciones asignadas');
                    }}
                    className="px-3 py-1.5 rounded-[6px] bg-w-brand text-white text-[11px] font-semibold min-h-[32px] active:scale-[0.98] transition-transform"
                  >
                    Asignar todas
                  </button>
                </div>
              )}
              <div className="mt-2">
                <div className="w-full h-1.5 bg-w-border rounded-full overflow-hidden">
                  <div className="h-full bg-w-brand rounded-full transition-all" style={{ width: `${paidPct}%` }} />
                </div>
                <p className="text-[11px] text-w-text-secondary mt-1">{paidCount} de {table.guests.length} pagaron · {paidPct}%</p>
              </div>
            </>
          )}
        </div>

        {/* Order Verification Section */}
        {guestsWithoutOrder.length > 0 && (
          <div className="rounded-[10px] border border-w-warning/30 bg-w-warning/5 p-3 space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-w-warning">⚠️ Verificar pedidos</p>
            {table.guests.map((g) => {
              const hasOrder = !(g.orderMethod === 'manual' && g.amountOwed === 0 && g.paymentStatus === 'pending');
              return (
                <div key={g.id} className="flex items-center justify-between min-h-[36px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]">{hasOrder ? '✅' : '⚠️'}</span>
                    <span className="text-[13px] text-w-text">{guestDisplayName(g)}</span>
                    <span className="text-[11px] text-w-text-secondary">{hasOrder ? 'Pidió por QR' : 'Sin pedido'}</span>
                  </div>
                  {!hasOrder && (
                    <button
                      onClick={() => setManualOrderGuest({ id: g.id, name: guestDisplayName(g) })}
                      className="px-3 py-1.5 rounded-[6px] bg-w-brand text-white text-[11px] font-semibold min-h-[32px] active:scale-[0.98] transition-transform"
                    >
                      + Capturar orden
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span className="text-w-text">
                              {item.name} ×{item.qty}
                            </span>
                            {item.assignedTo ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-w-brand/10 text-w-brand shrink-0">
                                {table.guests.find((g) => g.id === item.assignedTo)?.seatLabel || table.guests.find((g) => g.id === item.assignedTo)?.name || ''}
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-w-text-secondary/10 text-w-text-secondary shrink-0">
                                Sin asignar
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-w-text-secondary shrink-0">${item.price * item.qty}</span>
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
        {/* Inline Order Review for Pending Round */}
          {pendingRound && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[12px] border-2 border-w-brand/50 bg-w-brand/5 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[16px]">📋</span>
                  <span className="text-[15px] font-semibold text-w-text">Revisión de orden</span>
                  <RoundBadge round={pendingRound.number} />
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-w-warning/15 text-w-warning font-medium">Pendiente</span>
              </div>

              {/* Items grouped by guest */}
              <div className="space-y-2">
                {pendingRound.items.map((item, idx) => {
                  const assignedGuest = item.assignedTo ? table.guests.find((g) => g.id === item.assignedTo) : null;
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-w-surface rounded-[8px] border border-w-border p-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] text-w-text font-medium">{item.name}</span>
                          {assignedGuest && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-w-brand/10 text-w-brand shrink-0">
                              {guestDisplayName(assignedGuest)}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-w-text-secondary font-mono">${item.price} c/u</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (item.qty > 1) {
                              editItemInRound(table.id, pendingRound.number, idx, { qty: item.qty - 1 });
                            } else {
                              removeItemFromRound(table.id, pendingRound.number, idx);
                            }
                          }}
                          className="w-7 h-7 rounded-full border border-w-border flex items-center justify-center text-w-text-secondary active:scale-95"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-[13px] font-mono text-w-text w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => editItemInRound(table.id, pendingRound.number, idx, { qty: item.qty + 1 })}
                          className="w-7 h-7 rounded-full border border-w-border flex items-center justify-center text-w-text-secondary active:scale-95"
                        >
                          <PlusCircle size={12} />
                        </button>
                        <button
                          onClick={() => removeItemFromRound(table.id, pendingRound.number, idx)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-w-error/70 active:scale-95 ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add item for any guest */}
              <div className="border-t border-w-border/50 pt-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-w-text-secondary mb-1.5">Agregar a esta ronda</p>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                  {table.guests.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setManualOrderGuest({ id: g.id, name: guestDisplayName(g) })}
                      className="shrink-0 px-2.5 py-1.5 rounded-[6px] border border-dashed border-w-brand/40 text-w-brand text-[11px] font-medium active:scale-95 transition-transform"
                    >
                      + {guestDisplayName(g)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center border-t border-w-border/50 pt-2">
                <span className="text-[13px] text-w-text font-medium">Total ronda:</span>
                <span className="font-mono text-[15px] font-bold text-w-text">
                  ${pendingRound.items.reduce((s, i) => s + i.price * i.qty, 0)} MXN
                </span>
              </div>

              {/* Actions */}
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
            </motion.div>
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

          {/* In-person payment section */}
          {guestsNeedingCashPayment.length > 0 && (
            <div className="rounded-[10px] border border-w-border bg-w-surface p-3 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-w-text-secondary">💰 Cobro presencial</p>
              {guestsNeedingCashPayment.map((g) => (
                <div key={g.id} className="flex items-center justify-between min-h-[36px]">
                  <div>
                    <span className="text-[13px] text-w-text">{guestDisplayName(g)}</span>
                    <span className="font-mono text-[12px] text-w-text-secondary ml-2">${g.amountOwed}</span>
                  </div>
                  <button
                    onClick={() => setCashPaymentGuest(g.id)}
                    className="px-3 py-1.5 rounded-[6px] bg-w-success text-white text-[11px] font-semibold min-h-[32px] active:scale-[0.98] transition-transform"
                  >
                    Cobrar en mesa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        {table.tipTotal > 0 && (
          <p className="text-center font-mono text-[13px] text-w-tip">
            ${table.tipTotal} MXN recibidos en propinas
          </p>
        )}
      </div>

      {/* Manual Order Sheet */}
      <AnimatePresence>
        {manualOrderGuest && (
          <ManualOrderSheet
            tableId={table.id}
            guestId={manualOrderGuest.id}
            guestName={manualOrderGuest.name}
            onDismiss={() => setManualOrderGuest(null)}
          />
        )}
      </AnimatePresence>

      {/* Cash Payment Sheet */}
      <AnimatePresence>
        {cashGuest && (
          <CashPaymentSheet
            tableId={table.id}
            guest={cashGuest}
            rounds={table.rounds}
            allGuests={table.guests}
            onDismiss={() => setCashPaymentGuest(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
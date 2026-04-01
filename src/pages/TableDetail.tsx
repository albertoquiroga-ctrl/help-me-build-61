import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2, Minus, PlusCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTablesStore, guestDisplayName, computeTableBill, computeTotalPaid } from '@/stores/tablesStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useBarStore, isDrinkItem } from '@/stores/barStore';
import type { GuestInfo, OrderItem } from '@/stores/tablesStore';
import GuestPill from '@/components/waiter/GuestPill';
import RoundBadge from '@/components/waiter/RoundBadge';
import ManualOrderSheet from '@/components/waiter/ManualOrderSheet';
import CashPaymentSheet from '@/components/waiter/CashPaymentSheet';
import CookingTimer from '@/components/waiter/CookingTimer';
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
  const [viewMode, setViewMode] = useState<'rounds' | 'by-guest'>('rounds');
  const [expandedGuest, setExpandedGuest] = useState<string | null>(null);
  const [manualOrderGuest, setManualOrderGuest] = useState<{ id: string; name: string } | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const addGuest = useTablesStore((s) => s.addGuest);
  const initializeGuests = useTablesStore((s) => s.initializeGuests);
  const closeTable = useTablesStore((s) => s.closeTable);
  const resolve = useNotificationsStore((s) => s.resolve);
  const allBarOrders = useBarStore((s) => s.orders);
  const barDrinkOrders = useMemo(() => allBarOrders.filter((o) => o.tableId === id && (o.status === 'pending' || o.status === 'preparing')), [allBarOrders, id]);

  if (!table) return <div className="min-h-screen bg-w-bg flex items-center justify-center text-w-text-secondary">Mesa no encontrada</div>;

  const totalBill = computeTableBill(table);
  const totalPaid = computeTotalPaid(table);
  const remaining = Math.max(0, totalBill - totalPaid);
  const paidPct = totalBill > 0 ? Math.min(100, Math.round((totalPaid / totalBill) * 100)) : 0;
  const fullyPaid = totalBill > 0 && totalPaid >= totalBill;

  const readyRound = table.rounds.find((r) => r.status === 'ready');
  const cookingRound = table.rounds.find((r) => r.status === 'cooking');
  const pendingRound = table.rounds.find((r) => r.status === 'pending');
  const allDelivered = table.rounds.length > 0 && table.rounds.every((r) => r.status === 'delivered');

  const totalTips = table.tipTotal;

  const handleCloseTable = () => {
    const notifStore = useNotificationsStore.getState();
    const closeNotif = notifStore.queue.find((n) => n.type === 'table-close' && n.tableId === table.id && !n.resolved);
    if (closeNotif) notifStore.resolve(closeNotif.id, 'Mesa cerrada ✓');
    closeTable(table.id);
    toast.success(`✓ Mesa ${table.number} cerrada y disponible`);
    navigate('/waiter/dashboard');
  };

  const handleAddGuest = () => {
    addGuest(table.id, newGuestName.trim());
    toast.success(`✓ Comensal agregado`);
    setNewGuestName('');
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

          {/* Guest initialization for empty tables */}
          {table.guests.length === 0 && (
            <div className="rounded-[10px] border border-dashed border-w-border bg-w-surface p-4 text-center space-y-3">
              <p className="text-[13px] text-w-text">¿Cuántos comensales?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      initializeGuests(table.id, n);
                      toast.success(`✓ ${n} comensal${n > 1 ? 'es' : ''} agregado${n > 1 ? 's' : ''}`);
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
                  <input
                    autoFocus
                    type="text"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
                    placeholder="Nombre (opcional)"
                    className="flex-1 h-9 rounded-[6px] border border-w-border bg-w-surface px-3 text-[13px] text-w-text placeholder:text-w-text-secondary/50 focus:outline-none focus:border-w-brand"
                  />
                  <button onClick={handleAddGuest} className="px-3 h-9 rounded-[6px] bg-w-brand text-white text-[12px] font-semibold">Agregar</button>
                  <button onClick={() => { setShowAddGuest(false); setNewGuestName(''); }} className="px-2 h-9 rounded-[6px] text-w-text-secondary text-[12px]">✕</button>
                </div>
              )}

              {/* Payment progress — money-based */}
              {totalBill > 0 && (
                <div className="mt-2">
                  <div className="w-full h-2 bg-w-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${paidPct}%`,
                        background: fullyPaid ? 'hsl(var(--w-success))' : 'hsl(var(--w-brand))',
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-w-text-secondary mt-1">
                    <span className="font-mono font-semibold text-w-text">${totalPaid}</span> de <span className="font-mono">${totalBill}</span> pagado · {paidPct}%
                    {remaining > 0 && <span className="text-w-priority ml-1">· Resta ${remaining}</span>}
                  </p>
                </div>
              )}

              {/* QR payments from app */}
              {table.payments.filter((p) => p.method === 'qr').length > 0 && (
                <div className="mt-2 rounded-[8px] border border-w-success/30 bg-w-success/5 p-2.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-w-success mb-1">📱 Pagos desde la app</p>
                  {table.payments.filter((p) => p.method === 'qr').map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-w-text">{p.guestName || 'Comensal'}</span>
                      <span className="font-mono text-w-success font-medium">${p.amount}{p.tipAmount > 0 ? ` +$${p.tipAmount} propina` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Manual order capture — always available */}
        {table.guests.length > 0 && (
          <div className="rounded-[10px] border border-w-border bg-w-surface p-3 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-w-text-secondary">📝 Capturar orden</p>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {table.guests.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setManualOrderGuest({ id: g.id, name: guestDisplayName(g) })}
                  className="shrink-0 px-2.5 py-1.5 rounded-[6px] border border-dashed border-w-brand/40 text-w-brand text-[11px] font-medium active:scale-95 transition-transform min-h-[32px]"
                >
                  + {guestDisplayName(g)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rounds / By Guest toggle */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => setViewMode('rounds')}
              className={`px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors ${viewMode === 'rounds' ? 'bg-w-brand text-white' : 'bg-w-surface text-w-text-secondary border border-w-border'}`}
            >
              🍽 Rondas
            </button>
            <button
              onClick={() => setViewMode('by-guest')}
              className={`px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors ${viewMode === 'by-guest' ? 'bg-w-brand text-white' : 'bg-w-surface text-w-text-secondary border border-w-border'}`}
            >
              👤 Por comensal
            </button>
          </div>

          {viewMode === 'rounds' && (
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
                        {round.status === 'cooking' && round.cookingStartedAt && round.estimatedMinutes && (
                          <CookingTimer startedAt={round.cookingStartedAt} estimatedMinutes={round.estimatedMinutes} compact />
                        )}
                        {isExpanded ? <ChevronUp size={14} className="text-w-text-secondary" /> : <ChevronDown size={14} className="text-w-text-secondary" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-w-border pt-2 space-y-1.5">
                        {round.items.map((item, i) => (
                           <div key={i} className="text-[12px]">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <span className="text-w-text">
                                  {item.name} ×{item.qty}
                                </span>
                                {item.assignedTo && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-w-brand/10 text-w-brand shrink-0">
                                    {table.guests.find((g) => g.id === item.assignedTo)?.name || ''}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-w-text-secondary shrink-0">${item.price * item.qty}</span>
                            </div>
                            {(item.modifiers?.length || item.extras?.length) ? (
                              <div className="flex flex-wrap gap-1 mt-0.5 ml-0">
                                {item.modifiers?.map((m, mi) => (
                                  <span key={mi} className="text-[9px] px-1 py-0.5 rounded bg-w-warning/15 text-w-warning">{m}</span>
                                ))}
                                {item.extras?.map((e, ei) => (
                                  <span key={ei} className="text-[9px] px-1 py-0.5 rounded bg-w-brand/15 text-w-brand">+{e.name}</span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'by-guest' && (
            <div className="space-y-2">
              {table.guests.map((guest) => {
                const guestItems: { roundNumber: number; roundLabel: string; roundStatus: string; item: typeof table.rounds[0]['items'][0]; }[] = [];
                table.rounds.forEach((round) => {
                  round.items.forEach((item) => {
                    if (item.assignedTo === guest.id) {
                      guestItems.push({ roundNumber: round.number, roundLabel: round.label, roundStatus: round.status, item });
                    }
                  });
                });
                const guestTotal = guestItems.reduce((sum, gi) => sum + gi.item.price * gi.item.qty, 0);
                const isExpanded = expandedGuest === guest.id;
                const payBadge = guest.paymentStatus === 'paid' ? { label: '✓ Pagado', cls: 'bg-w-success/15 text-w-success' }
                  : guest.paymentStatus === 'left' ? { label: 'Se fue', cls: 'bg-w-text-secondary/15 text-w-text-secondary' }
                  : guest.paymentStatus === 'failed' ? { label: '⚠ Falló', cls: 'bg-w-priority/15 text-w-priority' }
                  : { label: 'Pendiente', cls: 'bg-w-warning/15 text-w-warning' };

                return (
                  <div key={guest.id} className="rounded-[10px] border border-w-border bg-w-surface overflow-hidden">
                    <button
                      onClick={() => setExpandedGuest(isExpanded ? null : guest.id)}
                      className="w-full flex items-center justify-between p-3 min-h-[44px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]">{guest.orderMethod === 'qr' ? '📱' : '👤'}</span>
                        <span className="text-[13px] text-w-text font-medium">{guestDisplayName(guest)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-w-text">${guestTotal}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-[6px] ${payBadge.cls}`}>{payBadge.label}</span>
                        {isExpanded ? <ChevronUp size={14} className="text-w-text-secondary" /> : <ChevronDown size={14} className="text-w-text-secondary" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-w-border pt-2 space-y-1.5">
                        {guestItems.length === 0 ? (
                          <p className="text-[12px] text-w-text-secondary italic">Sin items asignados</p>
                        ) : (
                          guestItems.map((gi, idx) => {
                            const rBadge = statusBadge[gi.roundStatus];
                            return (
                              <div key={idx} className="text-[12px]">
                                <div className="flex justify-between">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-[4px] ${rBadge.bg} ${rBadge.text} shrink-0`}>R{gi.roundNumber}</span>
                                    <span className="text-w-text">{gi.item.name} ×{gi.item.qty}</span>
                                  </div>
                                  <span className="font-mono text-w-text-secondary shrink-0">${gi.item.price * gi.item.qty}</span>
                                </div>
                                {(gi.item.modifiers?.length || gi.item.extras?.length) ? (
                                  <div className="flex flex-wrap gap-1 mt-0.5 ml-8">
                                    {gi.item.modifiers?.map((m, mi) => (
                                      <span key={mi} className="text-[9px] px-1 py-0.5 rounded bg-w-warning/15 text-w-warning">{m}</span>
                                    ))}
                                    {gi.item.extras?.map((e, ei) => (
                                      <span key={ei} className="text-[9px] px-1 py-0.5 rounded bg-w-brand/15 text-w-brand">+{e.name}</span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                    useTablesStore.getState().removeRound(table.id, pendingRound.number);
                    toast.warning(`Ronda R${pendingRound.number} rechazada`);
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

          {/* Cooking rounds → timer + reminder */}
          {table.rounds.filter((r) => r.status === 'cooking').map((cookingR) => (
            <motion.div
              key={`cooking-${cookingR.number}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[10px] border border-w-warning/30 bg-w-warning/5 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">🔥</span>
                  <span className="text-[13px] font-semibold text-w-text">R{cookingR.number} en cocina</span>
                  <RoundBadge round={cookingR.number} />
                </div>
              </div>
              {cookingR.cookingStartedAt && cookingR.estimatedMinutes && (
                <CookingTimer startedAt={cookingR.cookingStartedAt} estimatedMinutes={cookingR.estimatedMinutes} />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const notifStore = useNotificationsStore.getState();
                    notifStore.addNotification({
                      id: `reminder-${table.id}-r${cookingR.number}-${Date.now()}`,
                      type: 'kitchen-msg',
                      priority: 'high',
                      tableId: table.id,
                      title: `🔔 Recordatorio · Mesa ${table.number} · R${cookingR.number}`,
                      subtitle: `El mesero solicita actualización de la orden`,
                      channel: 'cocina',
                      timestamp: new Date().toISOString(),
                      dismissed: false,
                      resolved: false,
                    });
                    toast.success(`🔔 Recordatorio enviado a cocina · R${cookingR.number}`);
                  }}
                  className="flex-1 h-10 rounded-[8px] border border-w-warning text-w-warning font-semibold text-[12px] active:scale-[0.98] transition-transform"
                >
                  🔔 Recordar a cocina
                </button>
              </div>
            </motion.div>
          ))}

          {/* Drink orders at bar */}
          {barDrinkOrders.length > 0 && barDrinkOrders.map((drinkO) => (
              <motion.div
                key={`drink-${drinkO.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[10px] border border-w-brand/30 bg-w-brand/5 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">🍸</span>
                    <span className="text-[13px] font-semibold text-w-text">{drinkO.itemName} ×{drinkO.qty}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-[6px] ${drinkO.status === 'preparing' ? 'bg-w-brand/15 text-w-brand' : 'bg-w-warning/15 text-w-warning'}`}>
                    {drinkO.status === 'preparing' ? 'Preparando' : 'Pendiente en barra'}
                  </span>
                </div>
                <CookingTimer startedAt={drinkO.createdAt} estimatedMinutes={5} />
                <button
                  onClick={() => {
                    const notifStore = useNotificationsStore.getState();
                    notifStore.addNotification({
                      id: `bar-reminder-${drinkO.id}-${Date.now()}`,
                      type: 'bar-msg',
                      priority: 'high',
                      tableId: table.id,
                      title: `🔔 Recordatorio · Mesa ${table.number} · ${drinkO.itemName}`,
                      subtitle: `El mesero solicita actualización de la bebida`,
                      channel: 'barra',
                      timestamp: new Date().toISOString(),
                      dismissed: false,
                      resolved: false,
                    });
                    toast.success(`🔔 Recordatorio enviado a barra · ${drinkO.itemName}`);
                  }}
                  className="w-full h-10 rounded-[8px] border border-w-brand text-w-brand font-semibold text-[12px] active:scale-[0.98] transition-transform"
                >
                  🔔 Recordar a barra
                </button>
              </motion.div>
          ))}

          {allDelivered && totalPaid === 0 && table.guests.length > 0 && (
            <button
              onClick={() => toast.info('💳 Sugerencia de cuenta enviada a los comensales')}
              className="w-full h-12 rounded-[8px] border border-w-brand text-w-brand font-semibold text-[14px] active:scale-[0.98] transition-transform"
            >
              💳 Sugerir cuenta
            </button>
          )}

          {/* Payment button */}
          {totalBill > 0 && !fullyPaid && (
            <button
              onClick={() => setShowPayment(true)}
              className="w-full h-12 rounded-[8px] bg-w-success text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            >
              💰 Registrar pago · Resta ${remaining}
            </button>
          )}

          {/* Close table section */}
          {fullyPaid && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[12px] border-2 border-w-success/40 bg-w-success/5 p-4 space-y-3"
            >
              <div className="text-center space-y-1">
                <p className="text-[16px] font-semibold text-w-success">🧹 Todo pagado · Levantar muertos</p>
                <p className="text-[12px] text-w-text-secondary">
                  Total: <span className="font-mono font-bold text-w-text">${totalPaid} MXN</span>
                  {totalTips > 0 && <> · Propinas: <span className="font-mono font-bold text-w-tip">${totalTips} MXN</span></>}
                </p>
              </div>
              <button
                onClick={handleCloseTable}
                className="w-full h-12 rounded-[8px] bg-w-success text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
              >
                ✓ Mesa limpia · Cerrar y liberar
              </button>
              <p className="text-[10px] text-w-text-secondary text-center">La hostess podrá asignar nuevos clientes</p>
            </motion.div>
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

      {/* Payment Sheet */}
      <AnimatePresence>
        {showPayment && (
          <CashPaymentSheet
            tableId={table.id}
            tableNumber={table.number}
            onDismiss={() => setShowPayment(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

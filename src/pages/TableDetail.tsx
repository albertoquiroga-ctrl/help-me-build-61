import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Minus, PlusCircle, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTablesStore, computeTableBill, computeTotalPaid, getItemsByCategory } from '@/stores/tablesStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useBarStore } from '@/stores/barStore';
import LoyaltyBanner from '@/components/waiter/LoyaltyBanner';
import SmartSuggestion from '@/components/waiter/SmartSuggestion';
import { generateSmartSuggestions } from '@/lib/smartSuggestions';
import type { SmartSuggestionData } from '@/lib/smartSuggestions';
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

const CATEGORY_ICONS: Record<string, string> = {
  'Bebidas': '🍹',
  'Entradas': '🥗',
  'Platos Fuertes': '🥩',
  'Postres': '🍮',
  'Otros': '🍽',
};

/** Base estimated minutes per category (the "slowest item" baseline) */
const CATEGORY_BASE_MINUTES: Record<string, number> = {
  'Bebidas': 5,
  'Entradas': 10,
  'Platos Fuertes': 20,
  'Postres': 12,
  'Otros': 15,
};

export default function TableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const table = useTablesStore((s) => s.tables.find((t) => t.id === id));
  const markDelivered = useTablesStore((s) => s.markDelivered);
  const markItemDelivered = useTablesStore((s) => s.markItemDelivered);
  const updateRoundStatus = useTablesStore((s) => s.updateRoundStatus);
  const removeItemFromRound = useTablesStore((s) => s.removeItemFromRound);
  const editItemInRound = useTablesStore((s) => s.editItemInRound);
  const closeTable = useTablesStore((s) => s.closeTable);
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const allBarOrders = useBarStore((s) => s.orders);
  const barDrinkOrders = useMemo(() => allBarOrders.filter((o) => o.tableId === id && o.status !== 'delivered'), [allBarOrders, id]);

  // Reactive service call notifications for this table
  const pendingServiceCalls = useNotificationsStore((s) =>
    s.queue.filter((n) => n.type === 'service-call' && n.tableId === id && !n.resolved)
  );

  // Smart suggestions based on behavioral patterns
  const smartSuggestions = useMemo(() => {
    if (!table) return [];
    return generateSmartSuggestions(table);
  }, [table]);

  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const visibleSuggestions = smartSuggestions.filter(s => !dismissedSuggestions.has(s.id));
  const handleDismissSuggestion = (id: string) => setDismissedSuggestions(prev => new Set(prev).add(id));

  if (!table) return <div className="min-h-screen bg-w-bg flex items-center justify-center text-w-text-secondary">Mesa no encontrada</div>;

  const totalBill = computeTableBill(table);
  const totalPaid = computeTotalPaid(table);
  const remaining = Math.max(0, totalBill - totalPaid);
  const paidPct = totalBill > 0 ? Math.min(100, Math.round((totalPaid / totalBill) * 100)) : 0;
  const fullyPaid = totalBill > 0 && totalPaid >= totalBill;

  const pendingRound = table.rounds.find((r) => r.status === 'pending');
  const readyRound = table.rounds.find((r) => r.status === 'ready');
  const allDelivered = table.rounds.length > 0 && table.rounds.every((r) => r.status === 'delivered');

  const totalTips = table.tipTotal;
  const itemsByCategory = getItemsByCategory(table);

  const handleCloseTable = () => {
    const notifStore = useNotificationsStore.getState();
    const closeNotif = notifStore.queue.find((n) => n.type === 'table-close' && n.tableId === table.id && !n.resolved);
    if (closeNotif) notifStore.resolve(closeNotif.id, 'Mesa cerrada ✓');
    closeTable(table.id);
    toast.success(`✓ Mesa ${table.number} cerrada y disponible`);
    navigate('/waiter/dashboard');
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
        {/* Payment progress */}
        {totalBill > 0 && (
          <div>
            <div className="w-full h-2 bg-w-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${paidPct}%`,
                  background: fullyPaid ? 'hsl(var(--success))' : 'hsl(var(--brand-primary))',
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
          <div className="rounded-[8px] border border-w-success/30 bg-w-success/5 p-2.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-w-success mb-1">📱 Pagos desde la app</p>
            {table.payments.filter((p) => p.method === 'qr').map((p) => (
              <div key={p.id} className="flex items-center justify-between text-[11px]">
                <span className="text-w-text">{p.guestName || 'Comensal'}</span>
                <span className="font-mono text-w-success font-medium">${p.amount}{p.tipAmount > 0 ? ` +$${p.tipAmount} propina` : ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* Loyalty guest banner (persistent) */}
        {table.loyaltyGuest && (
          <LoyaltyBanner guest={table.loyaltyGuest} />
        )}

        {/* Smart suggestions (behavioral, dismissible) */}
        <AnimatePresence>
          {visibleSuggestions.map((s) => (
            <SmartSuggestion key={s.id} suggestion={s} onDismiss={handleDismissSuggestion} />
          ))}
        </AnimatePresence>

        {/* Capture order button */}
        <button
          onClick={() => setShowManualOrder(true)}
          className="w-full h-12 rounded-[10px] border-2 border-dashed border-w-brand/40 text-w-brand font-semibold text-[14px] active:scale-[0.98] transition-transform"
        >
          📝 Capturar orden
        </button>

        {/* Items by category */}
        {Object.keys(itemsByCategory).length > 0 && (
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-w-text-secondary mb-2">🧾 Cuenta</p>
            <div className="space-y-3">
              {Object.entries(itemsByCategory).map(([cat, items]) => (
                <div key={cat} className="rounded-[10px] border border-w-border bg-w-surface overflow-hidden">
                  <div className="px-3 py-2 border-b border-w-border bg-w-bg/50">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-w-text-secondary">
                      {CATEGORY_ICONS[cat] || '🍽'} {cat}
                    </p>
                  </div>
                  <div className="px-3 py-2 space-y-1.5">
                    {items.map((item, idx) => (
                      <div key={idx} className="text-[12px]">
                        <div className="flex justify-between">
                          <span className="text-w-text">{item.name} ×{item.qty}</span>
                          <span className="font-mono text-w-text-secondary shrink-0">${item.price * item.qty}</span>
                        </div>
                        {(item.modifiers?.length || item.extras?.length) ? (
                          <div className="flex flex-wrap gap-1 mt-0.5">
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
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-between items-center px-1">
                <span className="text-[13px] font-semibold text-w-text">Total</span>
                <span className="font-mono text-[15px] font-bold text-w-text">${totalBill} MXN</span>
              </div>
            </div>
          </div>
        )}

        {/* Service calls from diners */}
        {pendingServiceCalls.length > 0 && pendingServiceCalls.map((sc) => (
          <motion.div
            key={sc.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-[10px] border-2 border-w-priority/40 bg-w-priority/5 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[16px]">🔔</span>
                <div>
                  <p className="text-[13px] font-semibold text-w-text">{sc.title}</p>
                  <p className="text-[11px] text-w-text-secondary">{sc.subtitle}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-w-priority/15 text-w-priority font-medium animate-pulse">
                Pendiente
              </span>
            </div>
            <button
              onClick={() => {
                useNotificationsStore.getState().resolve(sc.id, 'Atendido ✓');
                toast.success(`✓ Llamado atendido · Mesa ${table.number}`);
              }}
              className="w-full h-10 rounded-[8px] bg-w-priority text-white font-semibold text-[12px] active:scale-[0.98] transition-transform"
            >
              ✓ Marcar como atendido
            </button>
          </motion.div>
        ))}

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
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-w-warning/15 text-w-warning font-medium">Pendiente</span>
              </div>

              <div className="space-y-2">
                {pendingRound.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-w-surface rounded-[8px] border border-w-border p-2.5">
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-w-text font-medium">{item.name}</span>
                      <span className="text-[11px] text-w-text-secondary font-mono ml-1">${item.price} c/u</span>
                      {(item.modifiers?.length || item.extras?.length) ? (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.modifiers?.map((m, mi) => (
                            <span key={mi} className="text-[9px] px-1 py-0.5 rounded bg-w-warning/15 text-w-warning">{m}</span>
                          ))}
                          {item.extras?.map((e, ei) => (
                            <span key={ei} className="text-[9px] px-1 py-0.5 rounded bg-w-brand/15 text-w-brand">+{e.name}</span>
                          ))}
                        </div>
                      ) : null}
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
                ))}
              </div>

              {/* Add more items */}
              <button
                onClick={() => setShowManualOrder(true)}
                className="w-full h-9 rounded-[8px] border border-dashed border-w-brand/40 text-w-brand text-[12px] font-medium active:scale-[0.98] transition-transform"
              >
                + Agregar más items
              </button>

              {/* Total */}
              <div className="flex justify-between items-center border-t border-w-border/50 pt-2">
                <span className="text-[13px] text-w-text font-medium">Total orden:</span>
                <span className="font-mono text-[15px] font-bold text-w-text">
                  ${pendingRound.items.reduce((s, i) => s + i.price * i.qty, 0)} MXN
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateRoundStatus(table.id, pendingRound.number, 'confirmed');
                    toast.success(`✓ Orden confirmada · Mesa ${table.number}`);
                  }}
                  className="flex-1 h-12 rounded-[8px] bg-w-brand text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
                >
                  Confirmar ✓
                </button>
                <button
                  onClick={() => {
                    useTablesStore.getState().removeRound(table.id, pendingRound.number);
                    toast.warning('Orden rechazada');
                  }}
                  className="flex-1 h-12 rounded-[8px] border border-w-error text-w-error font-semibold text-[14px] active:scale-[0.98] transition-transform"
                >
                  Rechazar
                </button>
              </div>
            </motion.div>
          )}


          {/* Active orders grouped by category with per-category timers */}
          {(() => {
            const activeRounds = table.rounds.filter((r) => r.status !== 'delivered' && r.status !== 'pending');
            if (activeRounds.length === 0) return null;

            // Group items across active rounds by category, keeping per-item tracking
            const categoryGroups: Record<string, {
              items: { name: string; qty: number; delivered?: boolean; roundNumber: number; itemIndex: number }[];
              startedAt: string;
              status: string;
              roundNumbers: number[];
            }> = {};
            activeRounds.forEach((r) => {
              const startedAt = r.cookingStartedAt || r.createdAt;
              r.items.forEach((item, itemIdx) => {
                const cat = item.category || 'Otros';
                if (!categoryGroups[cat]) {
                  categoryGroups[cat] = { items: [], startedAt, status: r.status, roundNumbers: [] };
                }
                categoryGroups[cat].items.push({
                  name: item.name,
                  qty: item.qty,
                  delivered: item.delivered,
                  roundNumber: r.number,
                  itemIndex: itemIdx,
                });
                if (!categoryGroups[cat].roundNumbers.includes(r.number)) {
                  categoryGroups[cat].roundNumbers.push(r.number);
                }
                // Use earliest startedAt
                if (new Date(startedAt) < new Date(categoryGroups[cat].startedAt)) {
                  categoryGroups[cat].startedAt = startedAt;
                }
                // Use worst status (cooking > confirmed > ready)
                const statusPriority: Record<string, number> = { confirmed: 0, cooking: 1, ready: 2 };
                if ((statusPriority[r.status] ?? 0) > (statusPriority[categoryGroups[cat].status] ?? 0)) {
                  categoryGroups[cat].status = r.status;
                }
              });
            });

            return Object.entries(categoryGroups)
              .filter(([, group]) => group.items.some((i) => !i.delivered))
              .map(([cat, group]) => {
              const isCooking = group.status === 'cooking';
              const isReady = group.status === 'ready';
              const isConfirmed = group.status === 'confirmed';
              const badge = statusBadge[group.status] || statusBadge['confirmed'];
              const borderColor = isReady ? 'border-w-success/30' : isCooking ? 'border-w-warning/30' : 'border-w-brand/30';
              const bgColor = isReady ? 'bg-w-success/5' : isCooking ? 'bg-w-warning/5' : 'bg-w-brand/5';
              const icon = CATEGORY_ICONS[cat] || '🍽';
              const estimatedMinutes = Math.round((CATEGORY_BASE_MINUTES[cat] || 15) * 1.2);

              return (
                <motion.div
                  key={`cat-timer-${cat}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-[10px] border ${borderColor} ${bgColor} p-3 space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">{icon}</span>
                      <span className="text-[13px] font-semibold text-w-text">{cat}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-[6px] ${badge.bg} ${badge.text}`}>{badge.label}</span>
                  </div>
                  {/* Per-item delivery checklist */}
                  <div className="space-y-1">
                    {group.items.map((item, idx) => (
                      <div key={`${item.roundNumber}-${item.itemIndex}-${idx}`} className="flex items-center justify-between">
                        <span className={`text-[11px] ${item.delivered ? 'text-w-success line-through' : 'text-w-text-secondary'}`}>
                          {item.name}{item.qty > 1 ? ` ×${item.qty}` : ''}
                        </span>
                        {item.delivered ? (
                          <span className="text-[10px] text-w-success font-medium">✓</span>
                        ) : (
                          <button
                            onClick={() => {
                              markItemDelivered(table.id, item.roundNumber, item.itemIndex);
                              toast.success(`✓ ${item.name} entregado · Mesa ${table.number}`);
                            }}
                            className="text-[10px] px-2 py-1 rounded-[6px] border border-w-success/50 text-w-success font-medium active:scale-[0.95] transition-transform"
                          >
                            ✓ Entregado
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <CookingTimer
                    startedAt={group.startedAt}
                    estimatedMinutes={estimatedMinutes}
                  />
                  {/* Reminder + mark all delivered */}
                  <div className="flex gap-2">
                    {(isCooking || isConfirmed) && (() => {
                      const isBeverage = cat === 'Bebidas';
                      return (
                        <button
                          onClick={() => {
                            const notifStore = useNotificationsStore.getState();
                            notifStore.addNotification({
                              id: `reminder-${table.id}-${cat}-${Date.now()}`,
                              type: isBeverage ? 'bar-msg' : 'kitchen-msg',
                              priority: 'high',
                              tableId: table.id,
                              title: `🔔 Recordatorio · Mesa ${table.number}`,
                              subtitle: `El mesero solicita actualización de ${cat}`,
                              channel: isBeverage ? 'barra' : 'cocina',
                              timestamp: new Date().toISOString(),
                              dismissed: false,
                              resolved: false,
                            });
                            toast.success(isBeverage ? '🔔 Recordatorio enviado a barra' : '🔔 Recordatorio enviado a cocina');
                          }}
                          className="flex-1 h-10 rounded-[8px] border border-w-warning text-w-warning font-semibold text-[12px] active:scale-[0.98] transition-transform"
                        >
                          {isBeverage ? '🍹 Recordar a barra' : '🔔 Recordar a cocina'}
                        </button>
                      );
                    })()}
                    {group.items.some((i) => !i.delivered) && (
                      <button
                        onClick={() => {
                          group.items.forEach((item) => {
                            if (!item.delivered) {
                              markItemDelivered(table.id, item.roundNumber, item.itemIndex);
                            }
                          });
                          toast.success(`✓ Todo ${cat} entregado · Mesa ${table.number}`);
                        }}
                        className={`flex-1 h-10 rounded-[8px] ${isReady ? 'bg-w-success text-white' : 'border border-w-success text-w-success'} font-semibold text-[12px] active:scale-[0.98] transition-transform`}
                      >
                        ✓ Entregar todo
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            });
          })()}

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
              <div className="flex gap-2">
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
                  className="flex-1 h-10 rounded-[8px] border border-w-brand text-w-brand font-semibold text-[12px] active:scale-[0.98] transition-transform"
                >
                  🔔 Recordar a barra
                </button>
                <button
                  onClick={() => {
                    useBarStore.getState().updateStatus(drinkO.id, 'delivered');
                    toast.success(`✓ ${drinkO.itemName} marcado como entregado · Mesa ${table.number}`);
                  }}
                  className="flex-1 h-10 rounded-[8px] border border-w-success text-w-success font-semibold text-[12px] active:scale-[0.98] transition-transform"
                >
                  ✓ Entregado
                </button>
              </div>
            </motion.div>
          ))}

          {allDelivered && totalPaid === 0 && table.rounds.length > 0 && (
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

          {/* Close table */}
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
        {showManualOrder && (
          <ManualOrderSheet
            tableId={table.id}
            onDismiss={() => setShowManualOrder(false)}
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

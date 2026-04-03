import { create } from 'zustand';
import { useNotificationsStore } from './notificationsStore';

export type RoundStatus = 'pending' | 'confirmed' | 'cooking' | 'ready' | 'delivered';
export type TableStatus = 'active' | 'paying' | 'empty' | 'problem';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  category?: string;
  modifiers?: string[];
  extras?: { name: string; price: number }[];
  delivered?: boolean;
}

export interface Round {
  number: number;
  label: string;
  items: OrderItem[];
  status: RoundStatus;
  createdAt: string;
  estimatedMinutes?: number;
  cookingStartedAt?: string;
}

/** Payment record for amount-based tracking */
export interface PaymentRecord {
  id: string;
  amount: number;
  tipAmount: number;
  method: 'cash' | 'card-physical' | 'qr';
  guestName?: string;
  timestamp: string;
  voucherPhoto?: string;
}

/** Loyalty guest seated at this table (persistent, not notification-based) */
export interface LoyaltyGuest {
  name: string;
  tier: 'gold' | 'silver' | 'bronze';
  visits: number;
  favoriteItems: string[];
  lastVisit: string;
  avgSpend: number;
}

export interface TableNote {
  id: string;
  text: string;
  createdAt: string;
  tag?: 'warning' | 'info' | 'vip';
}

export interface WaiterTable {
  id: string;
  number: number;
  rounds: Round[];
  payments: PaymentRecord[];
  status: TableStatus;
  statusText: string;
  timeOpened: number;
  tipTotal: number;
  section?: string;
  assignedWaiter?: string;
  loyaltyGuest?: LoyaltyGuest;
  notes: TableNote[];
}

/** Compute total bill from all rounds */
export function computeTableBill(table: WaiterTable): number {
  return table.rounds.reduce((sum, r) =>
    sum + r.items.reduce((s, item) => {
      const extrasTotal = item.extras?.reduce((e, ex) => e + ex.price, 0) || 0;
      return s + (item.price + extrasTotal) * item.qty;
    }, 0), 0);
}

/** Compute total paid from payments */
export function computeTotalPaid(table: WaiterTable): number {
  return table.payments.reduce((sum, p) => sum + p.amount, 0);
}

/** Get all items across rounds as flat list */
export function getAllItems(table: WaiterTable): OrderItem[] {
  return table.rounds.flatMap((r) => r.items);
}

/** Get items grouped by category */
export function getItemsByCategory(table: WaiterTable): Record<string, OrderItem[]> {
  const cats: Record<string, OrderItem[]> = {};
  table.rounds.forEach((r) => {
    r.items.forEach((item) => {
      const cat = item.category || 'Otros';
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(item);
    });
  });
  return cats;
}

const CATEGORY_BASE_MINUTES: Record<string, number> = {
  'Bebidas': 5, 'Entradas': 10, 'Platos Fuertes': 20, 'Postres': 12, 'Otros': 15,
};

function getRoundEstimate(r: Round): number {
  const maxBase = r.items.reduce((max, item) => {
    const base = CATEGORY_BASE_MINUTES[item.category || 'Otros'] || 15;
    return Math.max(max, base);
  }, 5);
  return Math.round(maxBase * 1.2);
}

/** Derive status + statusText from table data */
export function deriveTableStatus(table: WaiterTable): { status: TableStatus; statusText: string } {
  const hasPendingRound = table.rounds.some((r) => r.status === 'pending');
  if (hasPendingRound) return { status: 'active', statusText: 'Confirmación pendiente' };

  const hasReadyRound = table.rounds.some((r) => r.status === 'ready');
  if (hasReadyRound) return { status: 'active', statusText: 'Orden lista para recoger' };

  const hasCookingRound = table.rounds.some((r) => r.status === 'cooking');
  const hasConfirmedRound = table.rounds.some((r) => r.status === 'confirmed');
  if (hasCookingRound || hasConfirmedRound) {
    const activeRounds = table.rounds.filter((r) => r.status === 'cooking' || r.status === 'confirmed');
    const nearest = activeRounds.reduce((best, r) => {
      const started = r.cookingStartedAt || r.createdAt;
      const elapsedSec = (Date.now() - new Date(started).getTime()) / 1000;
      const categories = new Set(r.items.map((i) => i.category || 'Otros'));
      for (const cat of categories) {
        const base = CATEGORY_BASE_MINUTES[cat] || 15;
        const est = Math.round(base * 1.2);
        const remaining = est * 60 - elapsedSec;
        if (best === null || remaining < best.remaining) {
          best = { remaining, est, started };
        }
      }
      return best;
    }, null as { remaining: number; est: number; started: string } | null);

    if (nearest) {
      const remainingSec = Math.max(0, nearest.remaining);
      const remainingMin = Math.ceil(remainingSec / 60);
      if (remainingSec <= 0) {
        return { status: 'active', statusText: '⏰ Orden retrasada' };
      }
      return { status: 'active', statusText: `🔥 ~${remainingMin} min restante` };
    }
    return { status: 'active', statusText: 'En cocina' };
  }

  const allDelivered = table.rounds.length > 0 && table.rounds.every((r) => r.status === 'delivered');
  const totalBill = computeTableBill(table);
  const totalPaid = computeTotalPaid(table);
  const fullyPaid = totalBill > 0 && totalPaid >= totalBill;

  if (fullyPaid) return { status: 'paying', statusText: 'Todo pagado' };
  if (allDelivered && totalPaid > 0) return { status: 'paying', statusText: 'Pagando' };
  if (allDelivered) return { status: 'active', statusText: 'Todo entregado' };

  if (table.rounds.length === 0 && table.status === 'empty') return { status: 'empty', statusText: 'Disponible' };
  if (table.rounds.length === 0) return { status: 'active', statusText: 'Mesa abierta' };

  return { status: 'active', statusText: 'En orden' };
}

interface TablesState {
  tables: WaiterTable[];
  openTable: (id: string) => void;
  updateTable: (id: string, updates: Partial<WaiterTable>) => void;
  addRound: (id: string, round: Round) => void;
  updateRoundStatus: (tableId: string, roundNumber: number, status: RoundStatus) => void;
  markDelivered: (id: string, roundNumber: number) => void;
  markItemDelivered: (tableId: string, roundNumber: number, itemIndex: number) => void;
  closeTable: (id: string) => void;
  recalculateStatus: (id: string) => void;
  addManualOrder: (tableId: string, items: OrderItem[]) => void;
  recordPayment: (tableId: string, amount: number, method: 'cash' | 'card-physical', tipAmount?: number, guestName?: string) => void;
  removeItemFromRound: (tableId: string, roundNumber: number, itemIndex: number) => void;
  removeRound: (tableId: string, roundNumber: number) => void;
  editItemInRound: (tableId: string, roundNumber: number, itemIndex: number, updates: Partial<OrderItem>) => void;
  attachVoucher: (tableId: string, paymentId: string, photoDataUrl: string) => void;
}

function applyDerived(tables: WaiterTable[], id: string): WaiterTable[] {
  return tables.map((t) => {
    if (t.id !== id) return t;
    const { status, statusText } = deriveTableStatus(t);
    return { ...t, status, statusText };
  });
}

/** Check if table is fully paid and fire a notification */
function checkAllPaidAndNotify(tables: WaiterTable[], tableId: string) {
  const table = tables.find((t) => t.id === tableId);
  if (!table || table.rounds.length === 0) return;
  const totalBill = computeTableBill(table);
  const totalPaid = computeTotalPaid(table);
  if (totalBill <= 0 || totalPaid < totalBill) return;
  const notifStore = useNotificationsStore.getState();
  const alreadyExists = notifStore.queue.some((n) => n.type === 'table-close' && n.tableId === tableId && !n.resolved);
  if (alreadyExists) return;
  notifStore.addNotification({
    id: `n-close-${tableId}-${Date.now()}`,
    type: 'table-close',
    priority: 'medium',
    tableId,
    title: `🧹 Levantar muertos · Mesa ${table.number}`,
    subtitle: `Todo pagado · $${totalPaid} MXN · Propinas $${table.tipTotal}`,
    channel: 'mesas',
    timestamp: new Date().toISOString(),
    dismissed: false,
    resolved: false,
  });
}

const initialTables: WaiterTable[] = [
  {
    id: '1', number: 1, section: 'Interior', assignedWaiter: 'Carlos',
    rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '2', number: 2, section: 'Interior', assignedWaiter: 'Carlos',
    loyaltyGuest: {
      name: 'Sofía Hernández',
      tier: 'silver',
      visits: 7,
      favoriteItems: ['Margarita Clásica', 'Tacos de Asada', 'Churros'],
      lastVisit: '5 días',
      avgSpend: 340,
    },
    rounds: [
      { number: 1, label: 'Bebidas', items: [
        { name: 'Margarita Clásica', qty: 2, price: 120, category: 'Bebidas' },
        { name: 'Agua de Jamaica', qty: 1, price: 65, category: 'Bebidas' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 40 * 60000).toISOString() },
      { number: 2, label: 'Plato Fuerte', items: [
        { name: 'Tacos de Asada', qty: 2, price: 160, category: 'Platos Fuertes' },
        { name: 'Ensalada Mixta', qty: 1, price: 130, category: 'Platos Fuertes' },
      ], status: 'cooking', createdAt: new Date(Date.now() - 8 * 60000).toISOString(), estimatedMinutes: 15, cookingStartedAt: new Date(Date.now() - 18 * 60000).toISOString() },
    ],
    payments: [
      { id: 'p2-1', amount: 195, tipAmount: 85, method: 'qr', guestName: 'Laura', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: 'p2-2', amount: 130, tipAmount: 20, method: 'card-physical', guestName: 'Miguel', timestamp: new Date(Date.now() - 8 * 60000).toISOString() },
    ],
    status: 'active', statusText: 'En cocina', timeOpened: 45, tipTotal: 105,
  },
  {
    id: '4', number: 4, section: 'Barra', assignedWaiter: 'María',
    loyaltyGuest: {
      name: 'Andrea Ríos',
      tier: 'gold',
      visits: 12,
      favoriteItems: ['Margarita de Tamarindo', 'Tacos al Pastor', 'Flan Napolitano'],
      lastVisit: '3 días',
      avgSpend: 420,
    },
    rounds: [
      { number: 1, label: 'Bebidas + Entradas', items: [
        { name: 'Margarita Clásica', qty: 2, price: 120, category: 'Bebidas' },
        { name: 'Guacamole', qty: 1, price: 95, category: 'Entradas' },
        { name: 'Agua de Jamaica', qty: 1, price: 65, category: 'Bebidas' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
      { number: 2, label: 'Plato Fuerte', items: [
        { name: 'Entrecot a las Brasas', qty: 2, price: 295, category: 'Platos Fuertes' },
        { name: 'Pasta con Trufa', qty: 1, price: 245, category: 'Platos Fuertes' },
        { name: 'Ensalada Mixta', qty: 1, price: 130, category: 'Platos Fuertes' },
      ], status: 'cooking', createdAt: new Date(Date.now() - 5 * 60000).toISOString(), estimatedMinutes: 20, cookingStartedAt: new Date(Date.now() - 5 * 60000).toISOString() },
    ],
    payments: [
      { id: 'p4-1', amount: 415, tipAmount: 74, method: 'qr', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: 'p4-2', amount: 225, tipAmount: 48, method: 'cash', guestName: 'Pedro', timestamp: new Date(Date.now() - 12 * 60000).toISOString() },
      { id: 'p4-3', amount: 180, tipAmount: 30, method: 'card-physical', guestName: 'Ana', timestamp: new Date(Date.now() - 9 * 60000).toISOString() },
    ],
    status: 'active', statusText: 'En cocina', timeOpened: 32, tipTotal: 152,
  },
  {
    id: '6', number: 6, section: 'Sillones', assignedWaiter: 'Carlos',
    rounds: [
      { number: 1, label: 'Bebidas', items: [
        { name: 'Margarita Clásica', qty: 1, price: 120, category: 'Bebidas' },
        { name: 'Agua de Jamaica', qty: 1, price: 65, category: 'Bebidas' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 65 * 60000).toISOString() },
      { number: 2, label: 'Entradas', items: [
        { name: 'Guacamole', qty: 1, price: 95, category: 'Entradas' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 50 * 60000).toISOString() },
      { number: 3, label: 'Plato Fuerte', items: [
        { name: 'Entrecot a las Brasas', qty: 1, price: 295, category: 'Platos Fuertes' },
        { name: 'Pasta con Trufa', qty: 1, price: 245, category: 'Platos Fuertes' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
    ],
    payments: [
      { id: 'p6-1', amount: 510, tipAmount: 52, method: 'qr', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: 'p6-2', amount: 310, tipAmount: 45, method: 'card-physical', guestName: 'Roberto', timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
    ],
    status: 'paying', statusText: 'Todo pagado', timeOpened: 70, tipTotal: 97,
  },
  {
    id: '7', number: 7, section: 'Terraza', assignedWaiter: 'Luis',
    loyaltyGuest: {
      name: 'Ricardo Méndez',
      tier: 'bronze',
      visits: 3,
      favoriteItems: ['Guacamole', 'Quesadillas de Flor', 'Agua de Jamaica'],
      lastVisit: '2 semanas',
      avgSpend: 280,
    },
    rounds: [
      { number: 1, label: 'Bebidas', items: [
        { name: 'Margarita Clásica', qty: 3, price: 120, category: 'Bebidas' },
        { name: 'Agua de Jamaica', qty: 2, price: 65, category: 'Bebidas' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { number: 2, label: 'Entradas', items: [
        { name: 'Guacamole', qty: 2, price: 95, category: 'Entradas' },
        { name: 'Quesadillas de Flor', qty: 1, price: 110, category: 'Entradas' },
      ], status: 'pending', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    ],
    payments: [],
    status: 'active', statusText: 'En orden', timeOpened: 28, tipTotal: 0,
  },
  {
    id: '3', number: 3, section: 'Interior', assignedWaiter: 'Carlos',
    rounds: [
      { number: 1, label: 'Bebidas', items: [
        { name: 'Cerveza Artesanal', qty: 2, price: 95, category: 'Bebidas' },
        { name: 'Limonada', qty: 1, price: 55, category: 'Bebidas' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
    ],
    payments: [],
    status: 'active', statusText: 'Todo entregado', timeOpened: 22, tipTotal: 0,
  },
  {
    id: '5', number: 5, section: 'Bancos altos', assignedWaiter: 'María',
    rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '8', number: 8, section: 'Bancos altos', assignedWaiter: 'María',
    rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '9', number: 9, section: 'Área de fumar', assignedWaiter: 'Luis',
    rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '10', number: 10, section: 'Terraza', assignedWaiter: 'Luis',
    rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '12', number: 12, section: 'Sillones', assignedWaiter: 'María',
    rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '13', number: 13, section: 'Interior', assignedWaiter: 'Luis',
    rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '14', number: 14, section: 'Área de fumar', assignedWaiter: 'Carlos',
    rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '15', number: 15, section: 'Terraza', assignedWaiter: 'Luis',
    rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '11', number: 11, section: 'Barra', assignedWaiter: 'María',
    rounds: [
      { number: 1, label: 'Completo', items: [
        { name: 'Tacos de Asada', qty: 1, price: 160, category: 'Platos Fuertes' },
        { name: 'Pasta con Trufa', qty: 1, price: 245, category: 'Platos Fuertes' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 50 * 60000).toISOString() },
    ],
    payments: [
      { id: 'p11-1', amount: 245, tipAmount: 36, method: 'qr', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
    ],
    status: 'active', statusText: 'En orden', timeOpened: 55, tipTotal: 36,
  },
];

export const useTablesStore = create<TablesState>((set) => ({
  tables: initialTables,
  openTable: (id) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== id) return t;
        return { ...t, rounds: [], payments: [], timeOpened: 0, status: 'active' as TableStatus, statusText: 'Mesa abierta', tipTotal: 0 };
      });
      return { tables: applyDerived(updated, id) };
    }),
  updateTable: (id, updates) =>
    set((s) => {
      const updated = s.tables.map((t) => (t.id === id ? { ...t, ...updates } : t));
      return { tables: applyDerived(updated, id) };
    }),
  addRound: (id, round) =>
    set((s) => {
      const updated = s.tables.map((t) =>
        t.id === id ? { ...t, rounds: [...t.rounds, round] } : t
      );
      return { tables: applyDerived(updated, id) };
    }),
  updateRoundStatus: (tableId, roundNumber, status) =>
    set((s) => {
      const updated = s.tables.map((t) =>
        t.id === tableId
          ? { ...t, rounds: t.rounds.map((r) => {
              if (r.number !== roundNumber) return r;
              const extra: Partial<Round> = {};
              if (status === 'cooking' && !r.cookingStartedAt) {
                extra.cookingStartedAt = new Date().toISOString();
                extra.estimatedMinutes = r.estimatedMinutes ?? 15;
              }
              return { ...r, status, ...extra };
            }) }
          : t
      );
      return { tables: applyDerived(updated, tableId) };
    }),
  markDelivered: (id, roundNumber) =>
    set((s) => {
      const updated = s.tables.map((t) =>
        t.id === id
          ? { ...t, rounds: t.rounds.map((r) => (r.number === roundNumber ? { ...r, status: 'delivered' as RoundStatus } : r)) }
          : t
      );
      return { tables: applyDerived(updated, id) };
    }),
  markItemDelivered: (tableId, roundNumber, itemIndex) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          rounds: t.rounds.map((r) => {
            if (r.number !== roundNumber) return r;
            const newItems = r.items.map((item, idx) =>
              idx === itemIndex ? { ...item, delivered: true } : item
            );
            const allDelivered = newItems.every((item) => item.delivered);
            return { ...r, items: newItems, status: allDelivered ? 'delivered' as RoundStatus : r.status };
          }),
        };
      });
      return { tables: applyDerived(updated, tableId) };
    }),
  closeTable: (id) =>
    set((s) => ({
      tables: s.tables.map((t) =>
        t.id === id ? { ...t, status: 'empty' as TableStatus, statusText: 'Disponible', rounds: [], payments: [], tipTotal: 0, timeOpened: 0 } : t
      ),
    })),
  recalculateStatus: (id) =>
    set((s) => ({ tables: applyDerived(s.tables, id) })),
  addManualOrder: (tableId, items) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== tableId) return t;
        const pendingIdx = t.rounds.findIndex((r) => r.status === 'pending');
        let rounds: Round[];
        if (pendingIdx >= 0) {
          rounds = t.rounds.map((r, idx) =>
            idx === pendingIdx ? { ...r, items: [...r.items, ...items] } : r
          );
        } else {
          const nextNum = t.rounds.length > 0 ? Math.max(...t.rounds.map((r) => r.number)) + 1 : 1;
          rounds = [...t.rounds, {
            number: nextNum, label: 'Orden manual',
            items, status: 'pending' as RoundStatus, createdAt: new Date().toISOString(),
          }];
        }
        return { ...t, rounds };
      });
      return { tables: applyDerived(updated, tableId) };
    }),
  recordPayment: (tableId, amount, method, tipAmount = 0, guestName) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== tableId) return t;
        const payment: PaymentRecord = {
          id: `pay-${Date.now()}`,
          amount,
          tipAmount,
          method,
          guestName,
          timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        };
        return { ...t, payments: [...t.payments, payment], tipTotal: t.tipTotal + tipAmount };
      });
      const result = applyDerived(updated, tableId);
      checkAllPaidAndNotify(result, tableId);
      return { tables: result };
    }),
  removeItemFromRound: (tableId, roundNumber, itemIndex) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== tableId) return t;
        const rounds = t.rounds.map((r) => {
          if (r.number !== roundNumber) return r;
          const items = r.items.filter((_, i) => i !== itemIndex);
          return { ...r, items };
        }).filter((r) => r.items.length > 0);
        return { ...t, rounds };
      });
      return { tables: applyDerived(updated, tableId) };
    }),
  editItemInRound: (tableId, roundNumber, itemIndex, updates) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== tableId) return t;
        const rounds = t.rounds.map((r) => {
          if (r.number !== roundNumber) return r;
          const items = r.items.map((item, i) => (i === itemIndex ? { ...item, ...updates } : item));
          return { ...r, items };
        });
        return { ...t, rounds };
      });
      return { tables: applyDerived(updated, tableId) };
    }),
  removeRound: (tableId, roundNumber) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== tableId) return t;
        const rounds = t.rounds.filter((r) => r.number !== roundNumber);
        return { ...t, rounds };
      });
      return { tables: applyDerived(updated, tableId) };
    }),
  attachVoucher: (tableId, paymentId, photoDataUrl) =>
    set((s) => ({
      tables: s.tables.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          payments: t.payments.map((p) =>
            p.id === paymentId ? { ...p, voucherPhoto: photoDataUrl } : p
          ),
        };
      }),
    })),
}));

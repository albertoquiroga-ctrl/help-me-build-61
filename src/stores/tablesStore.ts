import { create } from 'zustand';
import { useNotificationsStore } from './notificationsStore';

export type PaymentStatus = 'pending' | 'paid' | 'left' | 'failed';
export type RoundStatus = 'pending' | 'confirmed' | 'cooking' | 'ready' | 'delivered';
export type TableStatus = 'active' | 'paying' | 'empty' | 'problem';

export type OrderMethod = 'qr' | 'manual';
export type PaymentMethod = 'qr' | 'cash' | 'card-physical' | null;

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  assignedTo?: string; // guest ID
  modifiers?: string[]; // e.g. "sin sal", "sin cebolla"
  extras?: { name: string; price: number }[]; // e.g. "doble jamón +$25"
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

export interface GuestInfo {
  id: string;
  name: string;
  amountOwed: number;
  amountPaid: number;
  tipAmount: number;
  paymentStatus: PaymentStatus;
  orderMethod: OrderMethod;
  paymentMethod: PaymentMethod;
}

/** Payment record for amount-based tracking */
export interface PaymentRecord {
  id: string;
  amount: number;
  tipAmount: number;
  method: 'cash' | 'card-physical' | 'qr';
  guestName?: string;
  timestamp: string;
}

/** Display name for a guest */
export function guestDisplayName(guest: GuestInfo): string {
  return guest.name;
}

export interface WaiterTable {
  id: string;
  number: number;
  guests: GuestInfo[];
  rounds: Round[];
  payments: PaymentRecord[];
  status: TableStatus;
  statusText: string;
  timeOpened: number; // minutes
  tipTotal: number;
  section?: string;
  assignedWaiter?: string;
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

/** Derive status + statusText from table data */
export function deriveTableStatus(table: WaiterTable): { status: TableStatus; statusText: string } {
  const hasFailedPayment = table.guests.some((g) => g.paymentStatus === 'failed');
  if (hasFailedPayment) return { status: 'problem', statusText: '⚠️ Pago fallido' };

  const hasPendingRound = table.rounds.some((r) => r.status === 'pending');
  if (hasPendingRound) return { status: 'active', statusText: 'Confirmación pendiente' };

  const hasReadyRound = table.rounds.some((r) => r.status === 'ready');
  if (hasReadyRound) return { status: 'active', statusText: 'Orden lista para recoger' };

  const hasCookingRound = table.rounds.some((r) => r.status === 'cooking');
  if (hasCookingRound) return { status: 'active', statusText: 'En cocina' };

  const allDelivered = table.rounds.length > 0 && table.rounds.every((r) => r.status === 'delivered');
  const totalBill = computeTableBill(table);
  const totalPaid = computeTotalPaid(table);
  const fullyPaid = totalBill > 0 && totalPaid >= totalBill;

  if (fullyPaid) return { status: 'paying', statusText: 'Todo pagado' };
  if (allDelivered && totalPaid > 0) return { status: 'paying', statusText: 'Pagando' };
  if (allDelivered) return { status: 'active', statusText: 'Todo entregado' };

  if (table.guests.length === 0 && table.rounds.length === 0) return { status: 'empty', statusText: 'Disponible' };

  return { status: 'active', statusText: 'En orden' };
}

interface TablesState {
  tables: WaiterTable[];
  openTable: (id: string, guestCount: number) => void;
  updateTable: (id: string, updates: Partial<WaiterTable>) => void;
  addRound: (id: string, round: Round) => void;
  updateRoundStatus: (tableId: string, roundNumber: number, status: RoundStatus) => void;
  markDelivered: (id: string, roundNumber: number) => void;
  markGuestPaymentFailed: (tableId: string, guestId: string) => void;
  markGuestLeft: (tableId: string, guestId: string) => void;
  closeTable: (id: string) => void;
  recalculateStatus: (id: string) => void;
  addManualOrder: (tableId: string, guestId: string, items: OrderItem[]) => void;
  markGuestNoOrder: (tableId: string, guestId: string) => void;
  addGuest: (tableId: string, name: string) => void;
  initializeGuests: (tableId: string, count: number) => void;
  renameGuest: (tableId: string, guestId: string, newName: string) => void;
  recordPayment: (tableId: string, amount: number, method: 'cash' | 'card-physical', tipAmount?: number, guestName?: string) => void;
  removeGuest: (tableId: string, guestId: string) => void;
  removeItemFromRound: (tableId: string, roundNumber: number, itemIndex: number) => void;
  removeRound: (tableId: string, roundNumber: number) => void;
  editItemInRound: (tableId: string, roundNumber: number, itemIndex: number, updates: Partial<OrderItem>) => void;
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
    guests: [], rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '2', number: 2, section: 'Interior', assignedWaiter: 'Carlos',
    guests: [
      { id: 'g2-1', name: 'Comensal 1', amountOwed: 280, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending', orderMethod: 'qr', paymentMethod: null },
      { id: 'g2-2', name: 'Pedro', amountOwed: 280, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending', orderMethod: 'qr', paymentMethod: null },
      { id: 'g2-3', name: 'Laura', amountOwed: 195, amountPaid: 195, tipAmount: 85, paymentStatus: 'paid', orderMethod: 'qr', paymentMethod: 'qr' },
    ],
    rounds: [
      { number: 1, label: 'Bebidas', items: [
        { name: 'Margarita Clásica', qty: 1, price: 120, assignedTo: 'g2-1' },
        { name: 'Margarita Clásica', qty: 1, price: 120, assignedTo: 'g2-2' },
        { name: 'Agua de Jamaica', qty: 1, price: 65, assignedTo: 'g2-3' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 40 * 60000).toISOString() },
      { number: 2, label: 'Plato Fuerte', items: [
        { name: 'Tacos de Asada', qty: 1, price: 160, assignedTo: 'g2-1' },
        { name: 'Tacos de Asada', qty: 1, price: 160, assignedTo: 'g2-2' },
        { name: 'Ensalada Mixta', qty: 1, price: 130, assignedTo: 'g2-3' },
      ], status: 'cooking', createdAt: new Date(Date.now() - 8 * 60000).toISOString(), estimatedMinutes: 15, cookingStartedAt: new Date(Date.now() - 18 * 60000).toISOString() },
    ],
    payments: [
      { id: 'p2-1', amount: 195, tipAmount: 85, method: 'qr', guestName: 'Laura', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
    ],
    status: 'active', statusText: 'En cocina', timeOpened: 45, tipTotal: 85,
  },
  {
    id: '4', number: 4, section: 'Barra', assignedWaiter: 'María',
    guests: [
      { id: 'g4-1', name: 'Comensal 1', amountOwed: 415, amountPaid: 415, tipAmount: 74, paymentStatus: 'paid', orderMethod: 'qr', paymentMethod: 'qr' },
      { id: 'g4-2', name: 'Ana', amountOwed: 415, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending', orderMethod: 'qr', paymentMethod: null },
      { id: 'g4-3', name: 'Comensal 3', amountOwed: 310, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending', orderMethod: 'manual', paymentMethod: null },
      { id: 'g4-4', name: 'Comensal 4', amountOwed: 225, amountPaid: 225, tipAmount: 48, paymentStatus: 'paid', orderMethod: 'manual', paymentMethod: 'cash' },
    ],
    rounds: [
      { number: 1, label: 'Bebidas + Entradas', items: [
        { name: 'Margarita Clásica', qty: 1, price: 120, assignedTo: 'g4-1' },
        { name: 'Margarita Clásica', qty: 1, price: 120, assignedTo: 'g4-2' },
        { name: 'Guacamole', qty: 1, price: 95, assignedTo: 'g4-4' },
        { name: 'Agua de Jamaica', qty: 1, price: 65, assignedTo: 'g4-3' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
      { number: 2, label: 'Plato Fuerte', items: [
        { name: 'Entrecot a las Brasas', qty: 1, price: 295, assignedTo: 'g4-1' },
        { name: 'Entrecot a las Brasas', qty: 1, price: 295, assignedTo: 'g4-2' },
        { name: 'Pasta con Trufa', qty: 1, price: 245, assignedTo: 'g4-3' },
        { name: 'Ensalada Mixta', qty: 1, price: 130, assignedTo: 'g4-4' },
      ], status: 'cooking', createdAt: new Date(Date.now() - 5 * 60000).toISOString(), estimatedMinutes: 20, cookingStartedAt: new Date(Date.now() - 5 * 60000).toISOString() },
    ],
    payments: [
      { id: 'p4-1', amount: 415, tipAmount: 74, method: 'qr', guestName: 'Comensal 1', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: 'p4-2', amount: 225, tipAmount: 48, method: 'cash', guestName: 'Comensal 4', timestamp: new Date(Date.now() - 12 * 60000).toISOString() },
    ],
    status: 'active', statusText: 'En cocina', timeOpened: 32, tipTotal: 122,
  },
  {
    id: '6', number: 6, section: 'Sillones', assignedWaiter: 'Carlos',
    guests: [
      { id: 'g6-1', name: 'Comensal 1', amountOwed: 510, amountPaid: 510, tipAmount: 52, paymentStatus: 'paid', orderMethod: 'qr', paymentMethod: 'qr' },
      { id: 'g6-2', name: 'Mariana', amountOwed: 310, amountPaid: 310, tipAmount: 45, paymentStatus: 'paid', orderMethod: 'qr', paymentMethod: 'qr' },
    ],
    rounds: [
      { number: 1, label: 'Bebidas', items: [
        { name: 'Margarita Clásica', qty: 1, price: 120, assignedTo: 'g6-1' },
        { name: 'Agua de Jamaica', qty: 1, price: 65, assignedTo: 'g6-2' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 65 * 60000).toISOString() },
      { number: 2, label: 'Entradas', items: [
        { name: 'Guacamole', qty: 1, price: 95, assignedTo: 'g6-1' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 50 * 60000).toISOString() },
      { number: 3, label: 'Plato Fuerte', items: [
        { name: 'Entrecot a las Brasas', qty: 1, price: 295, assignedTo: 'g6-1' },
        { name: 'Pasta con Trufa', qty: 1, price: 245, assignedTo: 'g6-2' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
    ],
    payments: [
      { id: 'p6-1', amount: 510, tipAmount: 52, method: 'qr', guestName: 'Comensal 1', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: 'p6-2', amount: 310, tipAmount: 45, method: 'qr', guestName: 'Mariana', timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
    ],
    status: 'paying', statusText: 'Todo pagado', timeOpened: 70, tipTotal: 97,
  },
  {
    id: '7', number: 7, section: 'Terraza', assignedWaiter: 'Luis',
    guests: [
      { id: 'g7-1', name: 'Comensal 1', amountOwed: 0, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending', orderMethod: 'manual', paymentMethod: null },
      { id: 'g7-2', name: 'Comensal 2', amountOwed: 0, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending', orderMethod: 'manual', paymentMethod: null },
      { id: 'g7-3', name: 'Fernanda', amountOwed: 0, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending', orderMethod: 'qr', paymentMethod: null },
      { id: 'g7-4', name: 'Comensal 4', amountOwed: 0, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending', orderMethod: 'manual', paymentMethod: null },
      { id: 'g7-5', name: 'Comensal 5', amountOwed: 0, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending', orderMethod: 'manual', paymentMethod: null },
    ],
    rounds: [
      { number: 1, label: 'Bebidas', items: [
        { name: 'Margarita Clásica', qty: 1, price: 120, assignedTo: 'g7-1' },
        { name: 'Margarita Clásica', qty: 1, price: 120, assignedTo: 'g7-4' },
        { name: 'Margarita Clásica', qty: 1, price: 120, assignedTo: 'g7-5' },
        { name: 'Agua de Jamaica', qty: 1, price: 65, assignedTo: 'g7-2' },
        { name: 'Agua de Jamaica', qty: 1, price: 65, assignedTo: 'g7-3' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { number: 2, label: 'Entradas', items: [
        { name: 'Guacamole', qty: 2, price: 95, assignedTo: 'g7-3' },
        { name: 'Nachos con Queso', qty: 1, price: 85, assignedTo: 'g7-1' },
        { name: 'Quesadilla de Huitlacoche', qty: 1, price: 110, assignedTo: 'g7-2' },
      ], status: 'pending', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    ],
    payments: [],
    status: 'active', statusText: 'En orden', timeOpened: 28, tipTotal: 0,
  },
  {
    id: '3', number: 3, section: 'Interior', assignedWaiter: 'Carlos',
    guests: [], rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '5', number: 5, section: 'Bancos altos', assignedWaiter: 'María',
    guests: [], rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '8', number: 8, section: 'Bancos altos', assignedWaiter: 'María',
    guests: [], rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '9', number: 9, section: 'Área de fumar', assignedWaiter: 'Luis',
    guests: [], rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '10', number: 10, section: 'Terraza', assignedWaiter: 'Luis',
    guests: [], rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '12', number: 12, section: 'Sillones', assignedWaiter: 'María',
    guests: [], rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '13', number: 13, section: 'Interior', assignedWaiter: 'Luis',
    guests: [], rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '14', number: 14, section: 'Área de fumar', assignedWaiter: 'Carlos',
    guests: [], rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '15', number: 15, section: 'Terraza', assignedWaiter: 'Luis',
    guests: [], rounds: [], payments: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '11', number: 11, section: 'Barra', assignedWaiter: 'María',
    guests: [
      { id: 'g11-1', name: 'Comensal 1', amountOwed: 160, amountPaid: 0, tipAmount: 0, paymentStatus: 'failed', orderMethod: 'manual', paymentMethod: null },
      { id: 'g11-2', name: 'Valentina', amountOwed: 245, amountPaid: 245, tipAmount: 36, paymentStatus: 'paid', orderMethod: 'qr', paymentMethod: 'qr' },
    ],
    rounds: [
      { number: 1, label: 'Completo', items: [
        { name: 'Tacos de Asada', qty: 1, price: 160, assignedTo: 'g11-1' },
        { name: 'Pasta con Trufa', qty: 1, price: 245, assignedTo: 'g11-2' },
      ], status: 'delivered', createdAt: new Date(Date.now() - 50 * 60000).toISOString() },
    ],
    payments: [
      { id: 'p11-1', amount: 245, tipAmount: 36, method: 'qr', guestName: 'Valentina', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
    ],
    status: 'problem', statusText: '⚠️ Pago fallido', timeOpened: 55, tipTotal: 36,
  },
];

export const useTablesStore = create<TablesState>((set) => ({
  tables: initialTables,
  openTable: (id, guestCount) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== id) return t;
        const newGuests: GuestInfo[] = Array.from({ length: guestCount }, (_, i) => ({
          id: `g${id}-s${i + 1}-${Date.now()}`,
          name: `Comensal ${i + 1}`,
          amountOwed: 0,
          amountPaid: 0,
          tipAmount: 0,
          paymentStatus: 'pending' as PaymentStatus,
          orderMethod: 'manual' as OrderMethod,
          paymentMethod: null,
        }));
        return { ...t, guests: newGuests, rounds: [], payments: [], timeOpened: 0, status: 'active' as TableStatus, statusText: 'Mesa abierta', tipTotal: 0 };
      });
      return { tables: updated };
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
  markGuestPaymentFailed: (tableId, guestId) =>
    set((s) => {
      const updated = s.tables.map((t) =>
        t.id === tableId
          ? { ...t, guests: t.guests.map((g) => (g.id === guestId ? { ...g, paymentStatus: 'failed' as PaymentStatus } : g)) }
          : t
      );
      return { tables: applyDerived(updated, tableId) };
    }),
  markGuestLeft: (tableId, guestId) =>
    set((s) => {
      const updated = s.tables.map((t) =>
        t.id === tableId
          ? { ...t, guests: t.guests.map((g) => (g.id === guestId ? { ...g, paymentStatus: 'left' as PaymentStatus } : g)) }
          : t
      );
      return { tables: applyDerived(updated, tableId) };
    }),
  closeTable: (id) =>
    set((s) => ({
      tables: s.tables.map((t) =>
        t.id === id ? { ...t, status: 'empty' as TableStatus, statusText: 'Disponible', guests: [], rounds: [], payments: [], tipTotal: 0, timeOpened: 0 } : t
      ),
    })),
  recalculateStatus: (id) =>
    set((s) => ({ tables: applyDerived(s.tables, id) })),
  addManualOrder: (tableId, guestId, items) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== tableId) return t;
        const guests = t.guests.map((g) =>
          g.id === guestId
            ? { ...g, orderMethod: 'manual' as OrderMethod, amountOwed: g.amountOwed + items.reduce((sum, i) => sum + i.price * i.qty, 0) }
            : g
        );
        const taggedItems = items.map((i) => ({ ...i, assignedTo: guestId }));
        const pendingIdx = t.rounds.findIndex((r) => r.status === 'pending');
        let rounds: Round[];
        if (pendingIdx >= 0) {
          rounds = t.rounds.map((r, idx) =>
            idx === pendingIdx ? { ...r, items: [...r.items, ...taggedItems] } : r
          );
        } else {
          const nextNum = t.rounds.length > 0 ? Math.max(...t.rounds.map((r) => r.number)) + 1 : 1;
          rounds = [...t.rounds, {
            number: nextNum, label: `Manual · ${guests.find((g) => g.id === guestId)?.name || 'Comensal'}`,
            items: taggedItems, status: 'pending' as RoundStatus, createdAt: new Date().toISOString(),
          }];
        }
        return { ...t, guests, rounds };
      });
      return { tables: applyDerived(updated, tableId) };
    }),
  markGuestNoOrder: (tableId, guestId) =>
    set((s) => {
      const updated = s.tables.map((t) =>
        t.id === tableId
          ? { ...t, guests: t.guests.map((g) => (g.id === guestId ? { ...g, orderMethod: 'manual' as OrderMethod, amountOwed: 0 } : g)) }
          : t
      );
      return { tables: applyDerived(updated, tableId) };
    }),
  addGuest: (tableId, name) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== tableId) return t;
        const guestNum = t.guests.length + 1;
        const finalName = name || `Comensal ${guestNum}`;
        const newGuest: GuestInfo = {
          id: `g${tableId}-m${Date.now()}`,
          name: finalName,
          amountOwed: 0,
          amountPaid: 0,
          tipAmount: 0,
          paymentStatus: 'pending',
          orderMethod: 'manual',
          paymentMethod: null,
        };
        return { ...t, guests: [...t.guests, newGuest] };
      });
      return { tables: applyDerived(updated, tableId) };
    }),
  initializeGuests: (tableId, count) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== tableId) return t;
        const newGuests: GuestInfo[] = Array.from({ length: count }, (_, i) => ({
          id: `g${tableId}-s${i + 1}-${Date.now()}`,
          name: `Comensal ${i + 1}`,
          amountOwed: 0,
          amountPaid: 0,
          tipAmount: 0,
          paymentStatus: 'pending' as PaymentStatus,
          orderMethod: 'manual' as OrderMethod,
          paymentMethod: null,
        }));
        return { ...t, guests: [...t.guests, ...newGuests] };
      });
      return { tables: applyDerived(updated, tableId) };
    }),
  renameGuest: (tableId, guestId, newName) =>
    set((s) => ({
      tables: s.tables.map((t) =>
        t.id === tableId
          ? { ...t, guests: t.guests.map((g) => (g.id === guestId ? { ...g, name: newName } : g)) }
          : t
      ),
    })),
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
  removeGuest: (tableId, guestId) =>
    set((s) => {
      const updated = s.tables.map((t) => {
        if (t.id !== tableId) return t;
        const guest = t.guests.find((g) => g.id === guestId);
        if (!guest || guest.orderMethod !== 'manual') return t;
        return { ...t, guests: t.guests.filter((g) => g.id !== guestId) };
      });
      return { tables: applyDerived(updated, tableId) };
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
        const removedRound = t.rounds.find((r) => r.number === roundNumber);
        const guests = t.guests.map((g) => {
          const removedAmount = removedRound?.items
            .filter((item) => item.assignedTo === g.id)
            .reduce((sum, item) => sum + item.qty * item.price, 0) ?? 0;
          if (removedAmount <= 0) return g;
          return { ...g, amountOwed: Math.max(0, g.amountOwed - removedAmount) };
        });
        return { ...t, rounds, guests };
      });
      return { tables: applyDerived(updated, tableId) };
    }),
}));

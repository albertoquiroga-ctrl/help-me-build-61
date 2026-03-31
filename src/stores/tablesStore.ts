import { create } from 'zustand';

export type PaymentStatus = 'pending' | 'paid' | 'left' | 'failed';
export type RoundStatus = 'pending' | 'confirmed' | 'cooking' | 'ready' | 'delivered';
export type TableStatus = 'active' | 'paying' | 'empty' | 'problem';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Round {
  number: number;
  label: string;
  items: OrderItem[];
  status: RoundStatus;
  createdAt: string;
}

export interface GuestInfo {
  id: string;
  name: string;
  amountOwed: number;
  amountPaid: number;
  tipAmount: number;
  paymentStatus: PaymentStatus;
}

export interface WaiterTable {
  id: string;
  number: number;
  guests: GuestInfo[];
  rounds: Round[];
  status: TableStatus;
  statusText: string;
  timeOpened: number; // minutes
  tipTotal: number;
  section?: string;
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
  const paidCount = table.guests.filter((g) => g.paymentStatus === 'paid' || g.paymentStatus === 'left').length;
  const allPaid = table.guests.length > 0 && paidCount === table.guests.length;

  if (allPaid) return { status: 'paying', statusText: 'Todos pagaron' };
  if (allDelivered && paidCount > 0) return { status: 'paying', statusText: 'Pagando' };
  if (allDelivered) return { status: 'active', statusText: 'Todo entregado' };

  if (table.guests.length === 0 && table.rounds.length === 0) return { status: 'empty', statusText: 'Disponible' };

  return { status: 'active', statusText: 'En orden' };
}

interface TablesState {
  tables: WaiterTable[];
  updateTable: (id: string, updates: Partial<WaiterTable>) => void;
  addRound: (id: string, round: Round) => void;
  updateRoundStatus: (tableId: string, roundNumber: number, status: RoundStatus) => void;
  markDelivered: (id: string, roundNumber: number) => void;
  markGuestPaymentFailed: (tableId: string, guestId: string) => void;
  markGuestLeft: (tableId: string, guestId: string) => void;
  closeTable: (id: string) => void;
  recalculateStatus: (id: string) => void;
}

function applyDerived(tables: WaiterTable[], id: string): WaiterTable[] {
  return tables.map((t) => {
    if (t.id !== id) return t;
    const { status, statusText } = deriveTableStatus(t);
    return { ...t, status, statusText };
  });
}

const initialTables: WaiterTable[] = [
  {
    id: '2', number: 2, section: 'Norte',
    guests: [
      { id: 'g2-1', name: 'Lucía', amountOwed: 185, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending' },
      { id: 'g2-2', name: 'Pedro', amountOwed: 215, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending' },
      { id: 'g2-3', name: 'Sofía', amountOwed: 195, amountPaid: 195, tipAmount: 85, paymentStatus: 'paid' },
    ],
    rounds: [
      { number: 1, label: 'Bebidas', items: [{ name: 'Margarita Clásica', qty: 2, price: 120 }, { name: 'Agua de Jamaica', qty: 1, price: 65 }], status: 'delivered', createdAt: new Date(Date.now() - 40 * 60000).toISOString() },
      { number: 2, label: 'Plato Fuerte', items: [{ name: 'Tacos de Asada', qty: 2, price: 160 }, { name: 'Ensalada Mixta', qty: 1, price: 130 }], status: 'cooking', createdAt: new Date(Date.now() - 8 * 60000).toISOString() },
    ],
    status: 'active', statusText: 'En cocina', timeOpened: 45, tipTotal: 85,
  },
  {
    id: '4', number: 4, section: 'Norte',
    guests: [
      { id: 'g4-1', name: 'C1', amountOwed: 240, amountPaid: 240, tipAmount: 74, paymentStatus: 'paid' },
      { id: 'g4-2', name: 'Ana', amountOwed: 185, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending' },
      { id: 'g4-3', name: 'Carlos', amountOwed: 195, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending' },
      { id: 'g4-4', name: 'C4', amountOwed: 95, amountPaid: 95, tipAmount: 48, paymentStatus: 'paid' },
    ],
    rounds: [
      { number: 1, label: 'Bebidas + Entradas', items: [{ name: 'Margarita Clásica', qty: 2, price: 120 }, { name: 'Guacamole', qty: 1, price: 95 }, { name: 'Agua de Jamaica', qty: 1, price: 65 }], status: 'delivered', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
      { number: 2, label: 'Plato Fuerte', items: [{ name: 'Entrecot a las Brasas', qty: 2, price: 295 }, { name: 'Pasta con Trufa', qty: 1, price: 245 }, { name: 'Ensalada Mixta', qty: 1, price: 130 }], status: 'cooking', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    ],
    status: 'active', statusText: 'En cocina', timeOpened: 32, tipTotal: 122,
  },
  {
    id: '6', number: 6, section: 'Sur',
    guests: [
      { id: 'g6-1', name: 'Diego', amountOwed: 295, amountPaid: 295, tipAmount: 52, paymentStatus: 'paid' },
      { id: 'g6-2', name: 'Mariana', amountOwed: 245, amountPaid: 245, tipAmount: 45, paymentStatus: 'paid' },
    ],
    rounds: [
      { number: 1, label: 'Bebidas', items: [{ name: 'Margarita Clásica', qty: 1, price: 120 }, { name: 'Agua de Jamaica', qty: 1, price: 65 }], status: 'delivered', createdAt: new Date(Date.now() - 65 * 60000).toISOString() },
      { number: 2, label: 'Entradas', items: [{ name: 'Guacamole', qty: 1, price: 95 }], status: 'delivered', createdAt: new Date(Date.now() - 50 * 60000).toISOString() },
      { number: 3, label: 'Plato Fuerte', items: [{ name: 'Entrecot a las Brasas', qty: 1, price: 295 }, { name: 'Pasta con Trufa', qty: 1, price: 245 }], status: 'delivered', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
    ],
    status: 'paying', statusText: 'Todos pagaron', timeOpened: 70, tipTotal: 97,
  },
  {
    id: '7', number: 7, section: 'Terraza',
    guests: [
      { id: 'g7-1', name: 'Grupo 1', amountOwed: 0, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending' },
      { id: 'g7-2', name: 'Grupo 2', amountOwed: 0, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending' },
      { id: 'g7-3', name: 'Grupo 3', amountOwed: 0, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending' },
      { id: 'g7-4', name: 'Grupo 4', amountOwed: 0, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending' },
      { id: 'g7-5', name: 'Grupo 5', amountOwed: 0, amountPaid: 0, tipAmount: 0, paymentStatus: 'pending' },
    ],
    rounds: [
      { number: 1, label: 'Bebidas', items: [{ name: 'Margarita Clásica', qty: 3, price: 120 }, { name: 'Agua de Jamaica', qty: 2, price: 65 }], status: 'delivered', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { number: 2, label: 'Entradas', items: [{ name: 'Guacamole', qty: 2, price: 95 }], status: 'confirmed', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    ],
    status: 'active', statusText: 'En orden', timeOpened: 28, tipTotal: 0,
  },
  {
    id: '9', number: 9, section: 'Sur',
    guests: [], rounds: [],
    status: 'empty', statusText: 'Disponible', timeOpened: 0, tipTotal: 0,
  },
  {
    id: '11', number: 11, section: 'Norte',
    guests: [
      { id: 'g11-1', name: 'Roberto', amountOwed: 185, amountPaid: 0, tipAmount: 0, paymentStatus: 'failed' },
      { id: 'g11-2', name: 'Valentina', amountOwed: 210, amountPaid: 210, tipAmount: 36, paymentStatus: 'paid' },
    ],
    rounds: [
      { number: 1, label: 'Completo', items: [{ name: 'Tacos de Asada', qty: 1, price: 160 }, { name: 'Pasta con Trufa', qty: 1, price: 245 }], status: 'delivered', createdAt: new Date(Date.now() - 50 * 60000).toISOString() },
    ],
    status: 'problem', statusText: '⚠️ Pago fallido', timeOpened: 55, tipTotal: 36,
  },
];

export const useTablesStore = create<TablesState>((set) => ({
  tables: initialTables,
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
          ? { ...t, rounds: t.rounds.map((r) => (r.number === roundNumber ? { ...r, status } : r)) }
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
        t.id === id ? { ...t, status: 'empty' as TableStatus, statusText: 'Disponible', guests: [], rounds: [], tipTotal: 0, timeOpened: 0 } : t
      ),
    })),
  recalculateStatus: (id) =>
    set((s) => ({ tables: applyDerived(s.tables, id) })),
}));

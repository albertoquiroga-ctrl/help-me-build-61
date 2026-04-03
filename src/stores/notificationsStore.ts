import { create } from 'zustand';

export type NotifPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotifType = 'new-order' | 'order-ready' | 'check-in' | 'service-call' | 'check-request' | 'table-close' | 'payment-failed' | 'early-exit' | 'manager-msg' | 'kitchen-msg' | 'bar-msg' | 'host-msg' | 'qr-open-request';
export type NotifChannel = 'mesas' | 'gerente' | 'cocina' | 'barra' | 'hostess';

export interface LoyaltyInfo {
  memberName: string;
  tier: 'gold' | 'silver' | 'bronze';
  visits: number;
  favoriteItems: string[];
  lastVisit: string;
  avgSpend: number;
  suggestion: string;
}

export interface WaiterNotification {
  id: string;
  type: NotifType;
  priority: NotifPriority;
  tableId: string;
  title: string;
  subtitle: string;
  channel?: NotifChannel;
  data?: any;
  loyalty?: LoyaltyInfo;
  timestamp: string;
  dismissed: boolean;
  resolved: boolean;
  resolution?: string;
}

interface NotificationsState {
  queue: WaiterNotification[];
  activeOverlay: string | null;
  unreadCount: number;
  autoReadAloud: boolean;
  addNotification: (n: WaiterNotification) => void;
  dismiss: (id: string) => void;
  resolve: (id: string, resolution: string) => void;
  setActiveOverlay: (id: string | null) => void;
  markAllRead: () => void;
  toggleAutoReadAloud: () => void;
}

const initialNotifications: WaiterNotification[] = [
  { id: 'n1', type: 'payment-failed', priority: 'urgent', tableId: '11', title: 'Pago fallido · Mesa 11 · C1 · $185', subtitle: 'Tarjeta rechazada', channel: 'mesas', timestamp: new Date(Date.now() - 2 * 60000).toISOString(), dismissed: false, resolved: false },
  { id: 'n0', type: 'new-order', priority: 'high', tableId: '7', title: 'Nueva orden · Mesa 7 · R2 · $385', subtitle: '3 items · Confirma o se envía en 45s', channel: 'mesas', timestamp: new Date(Date.now() - 1 * 60000).toISOString(), dismissed: false, resolved: false },
  // Loyalty check-in — active demo notification
  {
    id: 'n15', type: 'check-in', priority: 'medium', tableId: '4', title: 'Check-in · Mesa 4 · Cliente frecuente 🌟', subtitle: 'Andrea Ríos — 12 visitas · Ofrécele su favorito',
    channel: 'mesas', timestamp: new Date(Date.now() - 0.5 * 60000).toISOString(), dismissed: false, resolved: false,
    loyalty: {
      memberName: 'Andrea Ríos',
      tier: 'gold',
      visits: 12,
      favoriteItems: ['Margarita de Tamarindo', 'Tacos al Pastor', 'Flan Napolitano'],
      lastVisit: '3 días',
      avgSpend: 420,
      suggestion: 'Ofrécele una Margarita de Tamarindo cortesía — es su favorita y viene seguido 🍹',
    },
  },
  { id: 'n2', type: 'new-order', priority: 'medium', tableId: '2', title: 'Nueva orden · Mesa 2 · R2 · $430', subtitle: 'Auto-confirmado', channel: 'mesas', timestamp: new Date(Date.now() - 8 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Auto-confirmado ✓' },
  { id: 'n3', type: 'order-ready', priority: 'high', tableId: '4', title: 'Orden lista · Mesa 4 · R1 · 3 items', subtitle: 'Recogido', channel: 'mesas', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Entregado ✓' },
  { id: 'n4', type: 'check-in', priority: 'low', tableId: '7', title: 'Check-in · Mesa 7 · 22 min sin pedir', subtitle: 'Expirado', channel: 'mesas', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Expirado' },
  { id: 'n5', type: 'service-call', priority: 'medium', tableId: '4', title: 'Llamado servicio · Mesa 4 · C3 · Sal', subtitle: 'Atendido', channel: 'mesas', timestamp: new Date(Date.now() - 20 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Atendido ✓' },
  { id: 'n5b', type: 'service-call', priority: 'high', tableId: '3', title: 'Llamado servicio · Mesa 3 · Comensal pide atención', subtitle: 'El comensal presionó "Hablar al mesero"', channel: 'mesas', timestamp: new Date(Date.now() - 2 * 60000).toISOString(), dismissed: false, resolved: false },
  { id: 'n16', type: 'check-request', priority: 'high', tableId: '3', title: '🧾 Pidieron la cuenta · Mesa 3', subtitle: 'El comensal solicitó la cuenta desde la app', channel: 'mesas', timestamp: new Date(Date.now() - 1 * 60000).toISOString(), dismissed: false, resolved: false },
  { id: 'n6', type: 'order-ready', priority: 'high', tableId: '6', title: 'Orden lista · Mesa 6 · R2 · 2 items', subtitle: 'Entregado', channel: 'mesas', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Entregado ✓' },
  // Internal messages
  { id: 'n7', type: 'manager-msg', priority: 'high', tableId: '12', title: 'Llegó grupo VIP de 8 · Mesa 12', subtitle: 'Prioridad alta, atender de inmediato', channel: 'gerente', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), dismissed: false, resolved: false },
  { id: 'n8', type: 'bar-msg', priority: 'medium', tableId: '2', title: 'Bebidas listas · Mesa 2 · 3 drinks', subtitle: '2 Margaritas, 1 Mezcal Oaxaqueño', channel: 'barra', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Recogido ✓' },
  { id: 'n9', type: 'host-msg', priority: 'high', tableId: '7', title: 'Mesa 7 acaba de llegar · 5 personas', subtitle: 'Ningún comensal ha escaneado QR aún', channel: 'hostess', timestamp: new Date(Date.now() - 4 * 60000).toISOString(), dismissed: false, resolved: false },
  { id: 'n10', type: 'kitchen-msg', priority: 'medium', tableId: '4', title: 'Platos listos · Mesa 4 · R1 · 3 items', subtitle: 'Tacos al pastor, Enchiladas, Sopa', channel: 'cocina', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Recogido ✓' },
  { id: 'n11', type: 'kitchen-msg', priority: 'high', tableId: '6', title: 'Platos listos · Mesa 6 · R2 · 2 items', subtitle: 'Listo para recoger en barra caliente', channel: 'cocina', timestamp: new Date(Date.now() - 3 * 60000).toISOString(), dismissed: false, resolved: false },
  { id: 'n12', type: 'bar-msg', priority: 'medium', tableId: '11', title: 'Drinks listos · Mesa 11 · 2 cocktails', subtitle: 'Paloma y Negroni', channel: 'barra', timestamp: new Date(Date.now() - 6 * 60000).toISOString(), dismissed: false, resolved: false },
  { id: 'n13', type: 'host-msg', priority: 'medium', tableId: '3', title: 'Mesa 3 llegó · 4 personas · Reservación', subtitle: 'Esperando en entrada, asignar mesa', channel: 'hostess', timestamp: new Date(Date.now() - 18 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Asignada ✓' },
  { id: 'n14', type: 'qr-open-request', priority: 'high', tableId: '9', title: 'QR escaneado · Mesa 9', subtitle: 'Un cliente quiere abrir la mesa', channel: 'mesas', timestamp: new Date(Date.now() - 1 * 60000).toISOString(), dismissed: false, resolved: false, data: { requestedGuests: 1 } },
];

export const useNotificationsStore = create<NotificationsState>((set) => ({
  queue: initialNotifications,
  activeOverlay: null,
  unreadCount: 6,
  autoReadAloud: false,
  addNotification: (n) =>
    set((s) => ({ queue: [n, ...s.queue], unreadCount: s.unreadCount + 1 })),
  dismiss: (id) =>
    set((s) => ({ queue: s.queue.map((n) => (n.id === id ? { ...n, dismissed: true } : n)) })),
  resolve: (id, resolution) =>
    set((s) => ({ queue: s.queue.map((n) => (n.id === id ? { ...n, resolved: true, dismissed: true, resolution } : n)) })),
  setActiveOverlay: (id) => set({ activeOverlay: id }),
  markAllRead: () => set({ unreadCount: 0 }),
  toggleAutoReadAloud: () => set((s) => ({ autoReadAloud: !s.autoReadAloud })),
}));

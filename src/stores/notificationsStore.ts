import { create } from 'zustand';

export type NotifPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotifType = 'new-order' | 'order-ready' | 'check-in' | 'service-call' | 'table-close' | 'payment-failed' | 'early-exit' | 'manager-msg' | 'kitchen-msg' | 'bar-msg' | 'host-msg';
export type NotifChannel = 'mesas' | 'gerente' | 'cocina' | 'barra' | 'hostess';

export interface WaiterNotification {
  id: string;
  type: NotifType;
  priority: NotifPriority;
  tableId: string;
  title: string;
  subtitle: string;
  channel?: NotifChannel;
  data?: any;
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
  { id: 'n2', type: 'new-order', priority: 'medium', tableId: '2', title: 'Nueva orden · Mesa 2 · R2 · $430', subtitle: 'Auto-confirmado', channel: 'mesas', timestamp: new Date(Date.now() - 8 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Auto-confirmado ✓' },
  { id: 'n3', type: 'order-ready', priority: 'high', tableId: '4', title: 'Orden lista · Mesa 4 · R1 · 3 items', subtitle: 'Recogido', channel: 'mesas', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Entregado ✓' },
  { id: 'n4', type: 'check-in', priority: 'low', tableId: '7', title: 'Check-in · Mesa 7 · 22 min sin pedir', subtitle: 'Expirado', channel: 'mesas', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Expirado' },
  { id: 'n5', type: 'service-call', priority: 'medium', tableId: '4', title: 'Llamado servicio · Mesa 4 · C3 · Sal', subtitle: 'Atendido', channel: 'mesas', timestamp: new Date(Date.now() - 20 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Atendido ✓' },
  { id: 'n6', type: 'order-ready', priority: 'high', tableId: '6', title: 'Orden lista · Mesa 6 · R2 · 2 items', subtitle: 'Entregado', channel: 'mesas', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Entregado ✓' },
  // Internal messages
  { id: 'n7', type: 'manager-msg', priority: 'high', tableId: '', title: 'Llegó grupo VIP de 8 · mesa 12', subtitle: 'Prioridad alta, atender de inmediato', channel: 'gerente', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), dismissed: false, resolved: false },
  { id: 'n8', type: 'bar-msg', priority: 'medium', tableId: '', title: 'Se acabó el mezcal Amores', subtitle: 'Ofrecer Alipús como alternativa', channel: 'barra', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Leído ✓' },
  { id: 'n9', type: 'host-msg', priority: 'low', tableId: '', title: 'Mesa 3 llega en 5 min', subtitle: 'Reservación confirmada · 4 personas', channel: 'hostess', timestamp: new Date(Date.now() - 18 * 60000).toISOString(), dismissed: true, resolved: true, resolution: 'Leído ✓' },
  { id: 'n10', type: 'kitchen-msg', priority: 'urgent', tableId: '', title: 'Horno fuera de servicio', subtitle: 'Sin pizzas hasta nuevo aviso', channel: 'cocina', timestamp: new Date(Date.now() - 3 * 60000).toISOString(), dismissed: false, resolved: false },
];

export const useNotificationsStore = create<NotificationsState>((set) => ({
  queue: initialNotifications,
  activeOverlay: null,
  unreadCount: 3,
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

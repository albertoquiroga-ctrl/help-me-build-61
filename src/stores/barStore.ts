import { create } from 'zustand';

export type DrinkPrepStatus = 'pending' | 'preparing' | 'ready';

export interface DrinkOrder {
  id: string;
  tableId: string;
  tableNumber: number;
  roundNumber: number;
  itemName: string;
  qty: number;
  status: DrinkPrepStatus;
  createdAt: string;
}

// Known drink names to filter from rounds
export const DRINK_NAMES = [
  'Agua mineral', 'Agua natural', 'Limonada', 'Naranjada',
  'Cerveza', 'Cerveza clara', 'Cerveza oscura',
  'Margarita', 'Mojito', 'Paloma', 'Piña colada',
  'Café americano', 'Café con leche', 'Cappuccino', 'Espresso',
  'Jugo de naranja', 'Jugo verde', 'Smoothie',
  'Refresco', 'Coca-Cola', 'Sprite',
  'Michelada', 'Sangría', 'Tequila', 'Mezcal',
];

export function isDrinkItem(name: string): boolean {
  return DRINK_NAMES.some((d) => name.toLowerCase().includes(d.toLowerCase()));
}

interface BarState {
  orders: DrinkOrder[];
  setOrders: (orders: DrinkOrder[]) => void;
  updateStatus: (orderId: string, status: DrinkPrepStatus) => void;
}

export const useBarStore = create<BarState>((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
  updateStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
    })),
}));

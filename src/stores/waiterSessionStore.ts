import { create } from 'zustand';

interface WaiterSessionState {
  waiterName: string;
  shiftStart: string;
  shiftDuration: number;
  updateDuration: () => void;
}

const SHIFT_START = new Date(Date.now() - 3 * 60 * 60 * 1000 - 20 * 60 * 1000).toISOString();

export const useWaiterSession = create<WaiterSessionState>((set) => ({
  waiterName: 'Carlos M.',
  shiftStart: SHIFT_START,
  shiftDuration: Math.floor((Date.now() - new Date(SHIFT_START).getTime()) / 1000),
  updateDuration: () =>
    set((s) => ({
      shiftDuration: Math.floor((Date.now() - new Date(s.shiftStart).getTime()) / 1000),
    })),
}));

import { create } from 'zustand';

export interface TipEntry {
  tableNumber: number;
  round: number;
  amount: number;
  timestamp: string;
  guestName: string;
}

interface TipsState {
  todayTotal: number;
  todayCount: number;
  timeline: TipEntry[];
  weeklyTotals: number[];
  propinaModeActive: boolean;
  addTip: (entry: TipEntry) => void;
  togglePropinaMode: () => void;
}

const initialTimeline: TipEntry[] = [
  { tableNumber: 2, round: 2, amount: 85, timestamp: '18:34', guestName: 'Sofía' },
  { tableNumber: 4, round: 1, amount: 74, timestamp: '17:50', guestName: 'C1' },
  { tableNumber: 6, round: 3, amount: 52, timestamp: '17:20', guestName: 'Diego' },
  { tableNumber: 4, round: 2, amount: 48, timestamp: '16:45', guestName: 'C4' },
  { tableNumber: 6, round: 1, amount: 45, timestamp: '15:30', guestName: 'Mariana' },
  { tableNumber: 2, round: 1, amount: 36, timestamp: '14:15', guestName: 'Lucía' },
];

export const useTipsStore = create<TipsState>((set) => ({
  todayTotal: 340,
  todayCount: 6,
  timeline: initialTimeline,
  weeklyTotals: [340, 0, 0, 0, 0, 0, 0],
  propinaModeActive: false,
  addTip: (entry) =>
    set((s) => ({
      todayTotal: s.todayTotal + entry.amount,
      todayCount: s.todayCount + 1,
      timeline: [entry, ...s.timeline],
      weeklyTotals: [s.weeklyTotals[0] + entry.amount, ...s.weeklyTotals.slice(1)],
    })),
  togglePropinaMode: () => set((s) => ({ propinaModeActive: !s.propinaModeActive })),
}));

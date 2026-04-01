import { create } from 'zustand';

export type AppRole = 'waiter' | 'hostess' | 'bar';

interface RoleState {
  activeRole: AppRole;
  setRole: (role: AppRole) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  activeRole: 'waiter',
  setRole: (role) => set({ activeRole: role }),
}));

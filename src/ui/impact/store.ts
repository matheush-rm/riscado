import { create } from 'zustand';

export type Impact = { id: number; side: 1 | -1; y: number; color: string };

type S = { impacts: Impact[]; fire: (i: Omit<Impact, 'id'>) => void; done: (id: number) => void };

let n = 0;
export const useImpacts = create<S>((set) => ({
  impacts: [],
  fire: (i) => set((s) => ({ impacts: [...s.impacts, { ...i, id: ++n }] })),
  done: (id) => set((s) => ({ impacts: s.impacts.filter((x) => x.id !== id) })),
}));

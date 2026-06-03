import { create } from 'zustand';
import { getWeightLogs, addWeightLog, deleteWeightLog } from '../db/weight';
import { getDatabase } from '../db/client';
import type { WeightLog, WeightUnit } from '../types/weight';

interface WeightState {
  entries: WeightLog[];
  unit: WeightUnit;
  isLoading: boolean;

  loadEntries: () => Promise<void>;
  loadUnit: () => Promise<void>;
  logWeight: (weight: number, date: string, notes?: string) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  setUnit: (unit: WeightUnit) => Promise<void>;
}

export const useWeightStore = create<WeightState>()((set, get) => ({
  entries: [],
  unit: 'kg',
  isLoading: false,

  loadEntries: async () => {
    set({ isLoading: true });
    try {
      const entries = await getWeightLogs();
      set({ entries, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadUnit: async () => {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<any>(`SELECT weight_unit FROM user_settings WHERE id = 1`);
      if (row) set({ unit: row.weight_unit as WeightUnit });
    } catch {}
  },

  logWeight: async (weight, date, notes) => {
    const unit = get().unit;
    const entry = await addWeightLog(weight, date, unit, notes);
    const current = get().entries;
    const filtered = current.filter((e) => e.date !== date);
    set({ entries: [entry, ...filtered].sort((a, b) => b.date.localeCompare(a.date)) });
  },

  removeEntry: async (id) => {
    await deleteWeightLog(id);
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
  },

  setUnit: async (unit) => {
    set({ unit });
    try {
      const db = await getDatabase();
      await db.runAsync(`UPDATE user_settings SET weight_unit = ? WHERE id = 1`, [unit]);
    } catch {}
  },
}));

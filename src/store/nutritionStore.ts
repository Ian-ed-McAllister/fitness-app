import { create } from 'zustand';
import { format } from 'date-fns';
import { getDailyLog, deleteFoodLog, deleteFoodLogBySlot } from '../db/food';
import { getDatabase } from '../db/client';
import type { FoodItem, FoodLogEntry, MacroTotals, DailyGoals, MealSlot } from '../types/nutrition';
import { DEFAULT_MEAL_SLOTS } from '../types/nutrition';

interface NutritionState {
  selectedDate: string;
  dailyLog: FoodLogEntry[];
  goals: DailyGoals;
  customMealSlots: string[];
  pendingMealSlot: MealSlot | null;
  isLoading: boolean;
  selectedFoodForMeal: FoodItem | null;

  setSelectedDate: (date: string) => void;
  loadDailyLog: (date?: string) => Promise<void>;
  loadGoals: () => Promise<void>;
  removeLogEntry: (id: string) => Promise<void>;
  setPendingMealSlot: (slot: MealSlot | null) => void;
  setSelectedFoodForMeal: (food: FoodItem | null) => void;
  addCustomMealSlot: (name: string) => Promise<void>;
  removeCustomMealSlot: (name: string) => Promise<void>;
  loadCustomMealSlots: () => Promise<void>;
}

export const useNutritionStore = create<NutritionState>()((set, get) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  dailyLog: [],
  goals: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
  customMealSlots: [],
  pendingMealSlot: null,
  isLoading: false,
  selectedFoodForMeal: null,

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().loadDailyLog(date);
  },

  loadDailyLog: async (date) => {
    const d = date ?? get().selectedDate;
    set({ isLoading: true });
    try {
      const log = await getDailyLog(d);
      set({ dailyLog: log, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadGoals: async () => {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<any>(`SELECT * FROM user_settings WHERE id = 1`);
      if (row) {
        set({
          goals: {
            calories: row.calorie_goal ?? 2000,
            protein: row.protein_goal ?? 150,
            carbs: row.carbs_goal ?? 200,
            fat: row.fat_goal ?? 65,
          },
        });
      }
    } catch {}
  },

  loadCustomMealSlots: async () => {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<any>(`SELECT custom_meal_slots FROM user_settings WHERE id = 1`);
      const parsed: string[] = row?.custom_meal_slots ? JSON.parse(row.custom_meal_slots) : [];
      set({ customMealSlots: parsed });
    } catch {
      set({ customMealSlots: [] });
    }
  },

  addCustomMealSlot: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = get().customMealSlots;
    if (current.includes(trimmed)) return;
    const updated = [...current, trimmed];
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE user_settings SET custom_meal_slots = ? WHERE id = 1`,
      [JSON.stringify(updated)]
    );
    set({ customMealSlots: updated });
  },

  removeCustomMealSlot: async (name) => {
    const updated = get().customMealSlots.filter((s) => s !== name);
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE user_settings SET custom_meal_slots = ? WHERE id = 1`,
      [JSON.stringify(updated)]
    );
    await deleteFoodLogBySlot(name);
    const { selectedDate } = get();
    const dailyLog = await getDailyLog(selectedDate);
    set({ customMealSlots: updated, dailyLog });
  },

  removeLogEntry: async (id) => {
    await deleteFoodLog(id);
    set((s) => ({ dailyLog: s.dailyLog.filter((e) => e.id !== id) }));
  },

  setPendingMealSlot: (slot) => set({ pendingMealSlot: slot }),
  setSelectedFoodForMeal: (food) => set({ selectedFoodForMeal: food }),
}));

export function computeTotals(log: FoodLogEntry[]): MacroTotals {
  return log.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.food.calories * entry.servings,
      protein: acc.protein + entry.food.protein * entry.servings,
      carbs: acc.carbs + entry.food.carbs * entry.servings,
      fat: acc.fat + entry.food.fat * entry.servings,
      fiber: acc.fiber + (entry.food.fiber ?? 0) * entry.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

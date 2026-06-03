export type FoodSource = 'default' | 'custom' | 'openfoodfacts';

export type MealSlot = string;

export const DEFAULT_MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;

export const DEFAULT_SLOT_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  source: FoodSource;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  vitaminC?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  createdAt: number;
}

export interface FoodLogEntry {
  id: string;
  foodId: string;
  food: FoodItem;
  date: string;
  mealSlot: MealSlot;
  servings: number;
  createdAt: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  items: SavedMealItem[];
  createdAt: number;
}

export interface SavedMealItem {
  id: string;
  mealId: string;
  foodId: string;
  food: FoodItem;
  servings: number;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

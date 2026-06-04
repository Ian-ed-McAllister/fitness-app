import * as Crypto from 'expo-crypto';
import { getDatabase } from './client';
import type { FoodItem, FoodLogEntry, MealSlot } from '../types/nutrition';

function rowToFoodItem(row: any): FoodItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    barcode: row.barcode ?? undefined,
    source: row.source,
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    fiber: row.fiber ?? undefined,
    sugar: row.sugar ?? undefined,
    sodium: row.sodium ?? undefined,
    saturatedFat: row.saturated_fat ?? undefined,
    vitaminC: row.vitamin_c ?? undefined,
    vitaminD: row.vitamin_d ?? undefined,
    calcium: row.calcium ?? undefined,
    iron: row.iron ?? undefined,
    potassium: row.potassium ?? undefined,
    createdAt: row.created_at,
  };
}

function rowToFoodLogEntry(row: any): FoodLogEntry {
  return {
    id: row.log_id,
    foodId: row.food_id,
    date: row.date,
    mealSlot: row.meal_slot as MealSlot,
    servings: row.servings,
    createdAt: row.log_created_at,
    food: {
      id: row.food_id,
      name: row.name,
      brand: row.brand ?? undefined,
      barcode: row.barcode ?? undefined,
      source: row.source,
      servingSize: row.serving_size,
      servingUnit: row.serving_unit,
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber ?? undefined,
      sugar: row.sugar ?? undefined,
      sodium: row.sodium ?? undefined,
      saturatedFat: row.saturated_fat ?? undefined,
      createdAt: row.f_created_at,
    },
  };
}

export async function searchFoods(query: string, limit = 40): Promise<FoodItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM foods WHERE name LIKE ? ORDER BY
      CASE source WHEN 'custom' THEN 0 WHEN 'openfoodfacts' THEN 1 ELSE 2 END,
      name ASC LIMIT ?`,
    [`%${query}%`, limit]
  );
  return rows.map(rowToFoodItem);
}

export async function getRecentFoods(limit = 20): Promise<FoodItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT DISTINCT f.* FROM foods f
     INNER JOIN food_log fl ON fl.food_id = f.id
     ORDER BY fl.created_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map(rowToFoodItem);
}

export async function getFoodById(id: string): Promise<FoodItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(`SELECT * FROM foods WHERE id = ?`, [id]);
  return row ? rowToFoodItem(row) : null;
}

export async function getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(`SELECT * FROM foods WHERE barcode = ?`, [barcode]);
  return row ? rowToFoodItem(row) : null;
}

export async function saveFood(food: Omit<FoodItem, 'id' | 'createdAt'>): Promise<FoodItem> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const createdAt = Date.now();
  await db.runAsync(
    `INSERT INTO foods (id, name, brand, barcode, source, serving_size, serving_unit,
      calories, protein, carbs, fat, fiber, sugar, sodium, saturated_fat,
      vitamin_c, vitamin_d, calcium, iron, potassium, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, food.name, food.brand ?? null, food.barcode ?? null, food.source,
      food.servingSize, food.servingUnit, food.calories, food.protein,
      food.carbs, food.fat, food.fiber ?? null, food.sugar ?? null,
      food.sodium ?? null, food.saturatedFat ?? null,
      food.vitaminC ?? null, food.vitaminD ?? null, food.calcium ?? null,
      food.iron ?? null, food.potassium ?? null, createdAt,
    ]
  );
  return { ...food, id, createdAt };
}

export async function getDailyLog(date: string): Promise<FoodLogEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT
      fl.id        AS log_id,
      fl.food_id,
      fl.date,
      fl.meal_slot,
      fl.servings,
      fl.created_at AS log_created_at,
      f.name,
      f.brand,
      f.barcode,
      f.source,
      f.serving_size,
      f.serving_unit,
      f.calories,
      f.protein,
      f.carbs,
      f.fat,
      f.fiber,
      f.sugar,
      f.sodium,
      f.saturated_fat,
      f.created_at AS f_created_at
    FROM food_log fl
    JOIN foods f ON fl.food_id = f.id
    WHERE fl.date = ?
    ORDER BY fl.meal_slot ASC, fl.created_at ASC`,
    [date]
  );
  return rows.map(rowToFoodLogEntry);
}

export async function addFoodLog(params: {
  foodId: string;
  date: string;
  mealSlot: MealSlot;
  servings: number;
}): Promise<void> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO food_log (id, food_id, date, meal_slot, servings, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, params.foodId, params.date, params.mealSlot, params.servings, Date.now()]
  );
}

export async function deleteFoodLog(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM food_log WHERE id = ?`, [id]);
}

export async function deleteFoodLogBySlot(slot: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM food_log WHERE meal_slot = ?`, [slot]);
}

export async function updateFoodLog(id: string, servings: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE food_log SET servings = ? WHERE id = ?`, [servings, id]);
}

export interface DayNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function getCaloriesHistory(days: number): Promise<DayNutrition[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT
       fl.date,
       SUM(f.calories * fl.servings) as calories,
       SUM(f.protein  * fl.servings) as protein,
       SUM(f.carbs    * fl.servings) as carbs,
       SUM(f.fat      * fl.servings) as fat
     FROM food_log fl
     JOIN foods f ON f.id = fl.food_id
     WHERE fl.date >= date('now', ?)
     GROUP BY fl.date
     ORDER BY fl.date ASC`,
    [`-${days - 1} days`]
  );
  return rows.map((r) => ({
    date: r.date,
    calories: Math.round(r.calories ?? 0),
    protein: Math.round((r.protein ?? 0) * 10) / 10,
    carbs: Math.round((r.carbs ?? 0) * 10) / 10,
    fat: Math.round((r.fat ?? 0) * 10) / 10,
  }));
}

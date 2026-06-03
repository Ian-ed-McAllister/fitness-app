import * as Crypto from 'expo-crypto';
import { getDatabase } from './client';
import { getFoodById } from './food';
import type { SavedMeal, SavedMealItem } from '../types/nutrition';

export async function getSavedMeals(): Promise<SavedMeal[]> {
  const db = await getDatabase();
  const mealRows = await db.getAllAsync<any>(
    `SELECT * FROM saved_meals ORDER BY name ASC`
  );

  const meals: SavedMeal[] = [];
  for (const mealRow of mealRows) {
    const itemRows = await db.getAllAsync<any>(
      `SELECT mi.*, f.name, f.brand, f.barcode, f.source, f.serving_size, f.serving_unit,
              f.calories, f.protein, f.carbs, f.fat, f.fiber, f.sugar, f.sodium,
              f.saturated_fat, f.created_at as f_created_at
       FROM meal_items mi
       JOIN foods f ON mi.food_id = f.id
       WHERE mi.meal_id = ?`,
      [mealRow.id]
    );

    const items: SavedMealItem[] = itemRows.map((r: any) => ({
      id: r.id,
      mealId: r.meal_id,
      foodId: r.food_id,
      servings: r.servings,
      food: {
        id: r.food_id,
        name: r.name,
        brand: r.brand ?? undefined,
        barcode: r.barcode ?? undefined,
        source: r.source,
        servingSize: r.serving_size,
        servingUnit: r.serving_unit,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        fiber: r.fiber ?? undefined,
        sugar: r.sugar ?? undefined,
        sodium: r.sodium ?? undefined,
        saturatedFat: r.saturated_fat ?? undefined,
        createdAt: r.f_created_at,
      },
    }));

    meals.push({
      id: mealRow.id,
      name: mealRow.name,
      createdAt: mealRow.created_at,
      items,
    });
  }
  return meals;
}

export async function createSavedMeal(
  name: string,
  items: Array<{ foodId: string; servings: number }>
): Promise<SavedMeal> {
  const db = await getDatabase();
  const mealId = Crypto.randomUUID();
  const createdAt = Date.now();

  await db.runAsync(
    `INSERT INTO saved_meals (id, name, created_at) VALUES (?, ?, ?)`,
    [mealId, name, createdAt]
  );

  const savedItems: SavedMealItem[] = [];
  for (const item of items) {
    const itemId = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO meal_items (id, meal_id, food_id, servings) VALUES (?, ?, ?, ?)`,
      [itemId, mealId, item.foodId, item.servings]
    );
    const food = await getFoodById(item.foodId);
    if (food) {
      savedItems.push({ id: itemId, mealId, foodId: item.foodId, food, servings: item.servings });
    }
  }

  return { id: mealId, name, createdAt, items: savedItems };
}

export async function deleteSavedMeal(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM saved_meals WHERE id = ?`, [id]);
}

export async function updateSavedMeal(
  id: string,
  name: string,
  items: Array<{ foodId: string; servings: number }>
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE saved_meals SET name = ? WHERE id = ?`, [name, id]);
  await db.runAsync(`DELETE FROM meal_items WHERE meal_id = ?`, [id]);
  for (const item of items) {
    await db.runAsync(
      `INSERT INTO meal_items (id, meal_id, food_id, servings) VALUES (?, ?, ?, ?)`,
      [Crypto.randomUUID(), id, item.foodId, item.servings]
    );
  }
}

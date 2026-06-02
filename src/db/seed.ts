import { getDatabase } from './client';
import { DEFAULT_FOODS } from '../constants/defaultFoods';
import { DEFAULT_EXERCISES } from '../constants/defaultExercises';

export async function seedInitialData(): Promise<void> {
  const db = await getDatabase();

  const settings = await db.getFirstAsync<{ id: number; is_seeded: number }>(
    'SELECT id, is_seeded FROM user_settings WHERE id = 1'
  );

  if (settings?.is_seeded) return;

  await db.runAsync(
    `INSERT OR IGNORE INTO user_settings (id, weight_unit, calorie_goal, protein_goal, carbs_goal, fat_goal, is_seeded)
     VALUES (1, 'kg', 2000, 150, 200, 65, 1)`
  );

  for (const food of DEFAULT_FOODS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO foods
       (id, name, brand, source, serving_size, serving_unit, calories, protein, carbs, fat, fiber, sugar, sodium, created_at)
       VALUES (?, ?, ?, 'default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        food.id, food.name, food.brand ?? null,
        food.servingSize, food.servingUnit,
        food.calories, food.protein, food.carbs, food.fat,
        food.fiber ?? null, food.sugar ?? null, food.sodium ?? null,
        Date.now(),
      ]
    );
  }

  for (const ex of DEFAULT_EXERCISES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO exercises (id, name, muscle_group, equipment, source)
       VALUES (?, ?, ?, ?, 'default')`,
      [ex.id, ex.name, ex.muscleGroup ?? null, ex.equipment ?? null]
    );
  }
}

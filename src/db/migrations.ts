import { getDatabase } from './client';

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      barcode TEXT,
      source TEXT NOT NULL DEFAULT 'custom',
      serving_size REAL NOT NULL DEFAULT 100,
      serving_unit TEXT NOT NULL DEFAULT 'g',
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      fiber REAL,
      sugar REAL,
      sodium REAL,
      saturated_fat REAL,
      vitamin_c REAL,
      vitamin_d REAL,
      calcium REAL,
      iron REAL,
      potassium REAL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);
    CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);

    CREATE TABLE IF NOT EXISTS food_log (
      id TEXT PRIMARY KEY,
      food_id TEXT NOT NULL REFERENCES foods(id),
      date TEXT NOT NULL,
      meal_slot TEXT NOT NULL,
      servings REAL NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_food_log_date ON food_log(date);

    CREATE TABLE IF NOT EXISTS saved_meals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_items (
      id TEXT PRIMARY KEY,
      meal_id TEXT NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
      food_id TEXT NOT NULL REFERENCES foods(id),
      servings REAL NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS weight_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      weight REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      notes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      muscle_group TEXT,
      equipment TEXT,
      source TEXT NOT NULL DEFAULT 'default'
    );

    CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);

    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      default_sets INTEGER DEFAULT 3,
      default_reps INTEGER DEFAULT 10,
      default_weight REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      template_id TEXT REFERENCES workout_templates(id),
      name TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS session_sets (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER,
      weight REAL,
      rpe INTEGER,
      is_pr INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 1,
      logged_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_session_sets_exercise ON session_sets(exercise_id);

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      weight_unit TEXT NOT NULL DEFAULT 'kg',
      calorie_goal INTEGER DEFAULT 2000,
      protein_goal INTEGER DEFAULT 150,
      carbs_goal INTEGER DEFAULT 200,
      fat_goal INTEGER DEFAULT 65,
      is_seeded INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Additive migrations — safe to re-run (errors mean column already exists)
  const addCols = [
    `ALTER TABLE user_settings ADD COLUMN custom_meal_slots TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE user_settings ADD COLUMN display_name TEXT`,
    `ALTER TABLE user_settings ADD COLUMN date_of_birth TEXT`,
    `ALTER TABLE user_settings ADD COLUMN biological_sex TEXT`,
    `ALTER TABLE user_settings ADD COLUMN height_cm REAL`,
    `ALTER TABLE user_settings ADD COLUMN goal_weight REAL`,
    `ALTER TABLE user_settings ADD COLUMN body_goal TEXT DEFAULT 'maintain'`,
    `ALTER TABLE user_settings ADD COLUMN activity_level TEXT DEFAULT 'moderate'`,
    `ALTER TABLE user_settings ADD COLUMN weekly_workout_target INTEGER DEFAULT 3`,
    `ALTER TABLE user_settings ADD COLUMN water_goal_ml INTEGER DEFAULT 2500`,
    `ALTER TABLE user_settings ADD COLUMN goal_direction TEXT DEFAULT 'maintain'`,
  ];
  for (const sql of addCols) {
    try { await db.execAsync(sql); } catch {}
  }

  // New tables (safe to re-run)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS water_log (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount_ml REAL NOT NULL,
      logged_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_water_log_date ON water_log(date);
  `);
}

import { getDatabase } from './client';
import * as Crypto from 'expo-crypto';
import type { Exercise, WorkoutTemplate, TemplateExercise, WorkoutSession, SessionSet } from '../types/workout';

function rowToExercise(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group ?? undefined,
    equipment: row.equipment ?? undefined,
    source: row.source,
  };
}

// ─── Exercises ───────────────────────────────────────────────────────────────

export async function getAllExercises(muscleGroup?: string): Promise<Exercise[]> {
  const db = await getDatabase();
  let sql = `SELECT * FROM exercises`;
  const params: any[] = [];
  if (muscleGroup) {
    sql += ` WHERE muscle_group = ?`;
    params.push(muscleGroup);
  }
  sql += ` ORDER BY name`;
  const rows = await db.getAllAsync<any>(sql, params);
  return rows.map(rowToExercise);
}

export async function searchExercises(query: string, muscleGroup?: string): Promise<Exercise[]> {
  const db = await getDatabase();
  let sql = `SELECT * FROM exercises WHERE name LIKE ?`;
  const params: any[] = [`%${query}%`];
  if (muscleGroup) {
    sql += ` AND muscle_group = ?`;
    params.push(muscleGroup);
  }
  sql += ` ORDER BY name LIMIT 100`;
  const rows = await db.getAllAsync<any>(sql, params);
  return rows.map(rowToExercise);
}

export async function createCustomExercise(
  name: string,
  muscleGroup?: string,
  equipment?: string
): Promise<Exercise> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO exercises (id, name, muscle_group, equipment, source) VALUES (?, ?, ?, ?, 'custom')`,
    [id, name, muscleGroup ?? null, equipment ?? null]
  );
  return { id, name, muscleGroup: muscleGroup as any, equipment: equipment as any, source: 'custom' };
}

// ─── Templates ───────────────────────────────────────────────────────────────

async function loadTemplateExercises(templateId: string): Promise<TemplateExercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT te.*, e.name as ex_name, e.muscle_group, e.equipment, e.source
     FROM template_exercises te
     JOIN exercises e ON e.id = te.exercise_id
     WHERE te.template_id = ?
     ORDER BY te.position`,
    [templateId]
  );
  return rows.map((r) => ({
    id: r.id,
    templateId: r.template_id,
    exerciseId: r.exercise_id,
    exercise: {
      id: r.exercise_id,
      name: r.ex_name,
      muscleGroup: r.muscle_group ?? undefined,
      equipment: r.equipment ?? undefined,
      source: r.source,
    },
    position: r.position,
    defaultSets: r.default_sets ?? 3,
    defaultReps: r.default_reps ?? 10,
    defaultWeight: r.default_weight ?? 0,
  }));
}

export async function getTemplates(): Promise<WorkoutTemplate[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT wt.*, MAX(ws.finished_at) as last_performed_at
     FROM workout_templates wt
     LEFT JOIN workout_sessions ws ON ws.template_id = wt.id AND ws.finished_at IS NOT NULL
     GROUP BY wt.id
     ORDER BY wt.updated_at DESC`
  );
  const results: WorkoutTemplate[] = [];
  for (const r of rows) {
    const exercises = await loadTemplateExercises(r.id);
    results.push({
      id: r.id,
      name: r.name,
      description: r.description ?? undefined,
      exercises,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      lastPerformedAt: r.last_performed_at ?? undefined,
    });
  }
  return results;
}

export async function getTemplateById(id: string): Promise<WorkoutTemplate | null> {
  const db = await getDatabase();
  const r = await db.getFirstAsync<any>(
    `SELECT wt.*, MAX(ws.finished_at) as last_performed_at
     FROM workout_templates wt
     LEFT JOIN workout_sessions ws ON ws.template_id = wt.id AND ws.finished_at IS NOT NULL
     WHERE wt.id = ?
     GROUP BY wt.id`,
    [id]
  );
  if (!r) return null;
  const exercises = await loadTemplateExercises(id);
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    exercises,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    lastPerformedAt: r.last_performed_at ?? undefined,
  };
}

export async function createTemplate(
  name: string,
  description: string | undefined,
  exercises: Array<{ exerciseId: string; sets: number }>
): Promise<WorkoutTemplate> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO workout_templates (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [id, name.trim(), description?.trim() ?? null, now, now]
  );
  for (let i = 0; i < exercises.length; i++) {
    await db.runAsync(
      `INSERT INTO template_exercises (id, template_id, exercise_id, position, default_sets, default_reps, default_weight)
       VALUES (?, ?, ?, ?, ?, 10, 0)`,
      [Crypto.randomUUID(), id, exercises[i].exerciseId, i, exercises[i].sets]
    );
  }
  return (await getTemplateById(id))!;
}

export async function updateTemplate(
  id: string,
  name: string,
  description: string | undefined,
  exercises: Array<{ exerciseId: string; sets: number }>
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE workout_templates SET name = ?, description = ?, updated_at = ? WHERE id = ?`,
    [name.trim(), description?.trim() ?? null, Date.now(), id]
  );
  await db.runAsync(`DELETE FROM template_exercises WHERE template_id = ?`, [id]);
  for (let i = 0; i < exercises.length; i++) {
    await db.runAsync(
      `INSERT INTO template_exercises (id, template_id, exercise_id, position, default_sets, default_reps, default_weight)
       VALUES (?, ?, ?, ?, ?, 10, 0)`,
      [Crypto.randomUUID(), id, exercises[i].exerciseId, i, exercises[i].sets]
    );
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM workout_templates WHERE id = ?`, [id]);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(templateId: string | undefined, name: string): Promise<string> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO workout_sessions (id, template_id, name, started_at) VALUES (?, ?, ?, ?)`,
    [id, templateId ?? null, name, Date.now()]
  );
  return id;
}

export async function finishSession(id: string, notes?: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE workout_sessions SET finished_at = ?, notes = ? WHERE id = ?`,
    [Date.now(), notes ?? null, id]
  );
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM workout_sessions WHERE id = ?`, [id]);
}

export interface SessionHistoryItem {
  id: string;
  name: string;
  startedAt: number;
  finishedAt?: number;
  notes?: string;
  totalSets: number;
  exerciseCount: number;
  exerciseNames: string[];
}

export async function getSessionHistory(templateId: string): Promise<SessionHistoryItem[]> {
  const db = await getDatabase();
  const sessions = await db.getAllAsync<any>(
    `SELECT ws.id, ws.name, ws.started_at, ws.finished_at, ws.notes,
            COUNT(DISTINCT ss.exercise_id) as exercise_count,
            COUNT(ss.id) as total_sets
     FROM workout_sessions ws
     LEFT JOIN session_sets ss ON ss.session_id = ws.id AND ss.completed = 1
     WHERE ws.template_id = ? AND ws.finished_at IS NOT NULL
     GROUP BY ws.id
     ORDER BY ws.started_at DESC`,
    [templateId]
  );

  const results: SessionHistoryItem[] = [];
  for (const s of sessions) {
    const exRows = await db.getAllAsync<any>(
      `SELECT DISTINCT e.name
       FROM session_sets ss
       JOIN exercises e ON e.id = ss.exercise_id
       WHERE ss.session_id = ?
       ORDER BY e.name`,
      [s.id]
    );
    results.push({
      id: s.id,
      name: s.name,
      startedAt: s.started_at,
      finishedAt: s.finished_at ?? undefined,
      notes: s.notes ?? undefined,
      totalSets: s.total_sets,
      exerciseCount: s.exercise_count,
      exerciseNames: exRows.map((r: any) => r.name),
    });
  }
  return results;
}

// ─── Sets ─────────────────────────────────────────────────────────────────────

export async function logSet(params: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  isPR?: boolean;
}): Promise<SessionSet> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO session_sets (id, session_id, exercise_id, set_number, reps, weight, rpe, is_pr, completed, logged_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      id,
      params.sessionId,
      params.exerciseId,
      params.setNumber,
      params.reps ?? null,
      params.weight ?? null,
      params.rpe ?? null,
      params.isPR ? 1 : 0,
      now,
    ]
  );
  return {
    id,
    sessionId: params.sessionId,
    exerciseId: params.exerciseId,
    setNumber: params.setNumber,
    reps: params.reps,
    weight: params.weight,
    rpe: params.rpe,
    isPR: params.isPR ?? false,
    completed: true,
    loggedAt: now,
  };
}

export async function getLastSessionSets(
  exerciseId: string,
  excludeSessionId: string
): Promise<Array<{ setNumber: number; reps?: number; weight?: number }>> {
  const db = await getDatabase();
  const lastSession = await db.getFirstAsync<any>(
    `SELECT ws.id FROM workout_sessions ws
     JOIN session_sets ss ON ss.session_id = ws.id
     WHERE ss.exercise_id = ? AND ws.id != ? AND ws.finished_at IS NOT NULL
     ORDER BY ws.started_at DESC LIMIT 1`,
    [exerciseId, excludeSessionId]
  );
  if (!lastSession) return [];
  const rows = await db.getAllAsync<any>(
    `SELECT set_number, reps, weight FROM session_sets
     WHERE session_id = ? AND exercise_id = ? AND completed = 1
     ORDER BY set_number`,
    [lastSession.id, exerciseId]
  );
  return rows.map((r) => ({
    setNumber: r.set_number,
    reps: r.reps ?? undefined,
    weight: r.weight ?? undefined,
  }));
}

export interface ExerciseSessionPoint {
  sessionId: string;
  startedAt: number;
  maxWeight: number;
  totalSets: number;
  bestReps: number;
  isPR: boolean;
}

export async function getExerciseProgressHistory(exerciseId: string): Promise<ExerciseSessionPoint[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT
       ws.id as session_id,
       ws.started_at,
       MAX(ss.weight) as max_weight,
       COUNT(ss.id) as total_sets,
       MAX(ss.reps) as best_reps
     FROM session_sets ss
     JOIN workout_sessions ws ON ws.id = ss.session_id
     WHERE ss.exercise_id = ?
       AND ss.completed = 1
       AND ws.finished_at IS NOT NULL
       AND ss.weight IS NOT NULL
       AND ss.weight > 0
     GROUP BY ws.id
     ORDER BY ws.started_at ASC`,
    [exerciseId]
  );

  // Mark each point as a PR if it's the highest weight seen so far
  let runningMax = 0;
  return rows.map((r) => {
    const isPR = r.max_weight > runningMax;
    if (isPR) runningMax = r.max_weight;
    return {
      sessionId: r.session_id,
      startedAt: r.started_at,
      maxWeight: r.max_weight,
      totalSets: r.total_sets,
      bestReps: r.best_reps,
      isPR,
    };
  });
}

export async function getExercisePR(exerciseId: string): Promise<number | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    `SELECT MAX(weight) as max_weight FROM session_sets
     WHERE exercise_id = ? AND completed = 1 AND weight IS NOT NULL`,
    [exerciseId]
  );
  return row?.max_weight ?? null;
}

import * as Crypto from 'expo-crypto';
import { getDatabase } from './client';
import type { WeightLog, WeightUnit } from '../types/weight';

function rowToLog(row: any): WeightLog {
  return {
    id: row.id,
    date: row.date,
    weight: row.weight,
    unit: row.unit as WeightUnit,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getWeightLogs(limit = 200): Promise<WeightLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM weight_logs ORDER BY date DESC LIMIT ?`,
    [limit]
  );
  return rows.map(rowToLog);
}

export async function getWeightLogByDate(date: string): Promise<WeightLog | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM weight_logs WHERE date = ?`,
    [date]
  );
  return row ? rowToLog(row) : null;
}

export async function addWeightLog(
  weight: number,
  date: string,
  unit: WeightUnit,
  notes?: string
): Promise<WeightLog> {
  const db = await getDatabase();
  const existing = await getWeightLogByDate(date);
  if (existing) {
    await db.runAsync(
      `UPDATE weight_logs SET weight = ?, unit = ?, notes = ? WHERE id = ?`,
      [weight, unit, notes ?? null, existing.id]
    );
    return { ...existing, weight, unit, notes };
  }
  const id = Crypto.randomUUID();
  const createdAt = Date.now();
  await db.runAsync(
    `INSERT INTO weight_logs (id, date, weight, unit, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, date, weight, unit, notes ?? null, createdAt]
  );
  return { id, date, weight, unit, notes, createdAt };
}

export async function deleteWeightLog(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM weight_logs WHERE id = ?`, [id]);
}

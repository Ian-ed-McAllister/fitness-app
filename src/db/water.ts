import * as Crypto from 'expo-crypto';
import { getDatabase } from './client';

export async function addWaterEntry(date: string, amountMl: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO water_log (id, date, amount_ml, logged_at) VALUES (?, ?, ?, ?)`,
    [Crypto.randomUUID(), date, amountMl, Date.now()]
  );
}

export async function getTodayWater(date: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    `SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_log WHERE date = ?`,
    [date]
  );
  return row?.total ?? 0;
}

export async function getWaterHistory(days: number): Promise<Array<{ date: string; totalMl: number }>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT date, SUM(amount_ml) as total_ml
     FROM water_log
     WHERE date >= date('now', ?)
     GROUP BY date
     ORDER BY date ASC`,
    [`-${days - 1} days`]
  );
  return rows.map((r) => ({ date: r.date, totalMl: r.total_ml }));
}

export async function deleteWaterEntriesForDate(date: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM water_log WHERE date = ?`, [date]);
}

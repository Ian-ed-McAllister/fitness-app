import { create } from 'zustand';
import { format } from 'date-fns';
import { getDatabase } from '../db/client';
import { addWaterEntry, getTodayWater, getWaterHistory } from '../db/water';
import type { BodyGoal, ActivityLevel, GoalDirection } from '../utils/tdee';
import { GOAL_DIRECTION_MAP } from '../utils/tdee';

export interface ProfileFields {
  displayName: string;
  dateOfBirth: string | null;
  biologicalSex: 'male' | 'female' | null;
  heightCm: number | null;
  goalWeight: number | null;
  bodyGoal: BodyGoal;
  activityLevel: ActivityLevel;
  weeklyWorkoutTarget: number;
  waterGoalMl: number;
  goalDirection: GoalDirection;
}

interface ProfileState extends ProfileFields {
  todayWaterMl: number;
  loggingStreak: number;
  workoutStreak: number;
  waterStreak: number;
  weeklySessionCount: number;
  isLoaded: boolean;

  loadProfile: () => Promise<void>;
  updateProfile: (fields: Partial<ProfileFields>) => Promise<void>;
  loadTodayWater: () => Promise<void>;
  addWater: (ml: number) => Promise<void>;
  computeStreaks: () => Promise<void>;
}

const DEFAULTS: ProfileFields = {
  displayName: '',
  dateOfBirth: null,
  biologicalSex: null,
  heightCm: null,
  goalWeight: null,
  bodyGoal: 'maintain',
  activityLevel: 'moderate',
  weeklyWorkoutTarget: 3,
  waterGoalMl: 2500,
  goalDirection: 'maintain',
};

export const useProfileStore = create<ProfileState>()((set, get) => ({
  ...DEFAULTS,
  todayWaterMl: 0,
  loggingStreak: 0,
  workoutStreak: 0,
  waterStreak: 0,
  weeklySessionCount: 0,
  isLoaded: false,

  loadProfile: async () => {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<any>(`SELECT * FROM user_settings WHERE id = 1`);
      if (row) {
        set({
          displayName: row.display_name ?? '',
          dateOfBirth: row.date_of_birth ?? null,
          biologicalSex: row.biological_sex ?? null,
          heightCm: row.height_cm ?? null,
          goalWeight: row.goal_weight ?? null,
          bodyGoal: (row.body_goal as BodyGoal) ?? 'maintain',
          activityLevel: (row.activity_level as ActivityLevel) ?? 'moderate',
          weeklyWorkoutTarget: row.weekly_workout_target ?? 3,
          waterGoalMl: row.water_goal_ml ?? 2500,
          goalDirection: (row.goal_direction as GoalDirection) ?? 'maintain',
          isLoaded: true,
        });
      }
    } catch {}
    await get().loadTodayWater();
    await get().computeStreaks();
  },

  updateProfile: async (fields) => {
    const db = await getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (fields.displayName !== undefined) { updates.push('display_name = ?'); values.push(fields.displayName); }
    if (fields.dateOfBirth !== undefined) { updates.push('date_of_birth = ?'); values.push(fields.dateOfBirth); }
    if (fields.biologicalSex !== undefined) { updates.push('biological_sex = ?'); values.push(fields.biologicalSex); }
    if (fields.heightCm !== undefined) { updates.push('height_cm = ?'); values.push(fields.heightCm); }
    if (fields.goalWeight !== undefined) { updates.push('goal_weight = ?'); values.push(fields.goalWeight); }
    if (fields.bodyGoal !== undefined) {
      updates.push('body_goal = ?'); values.push(fields.bodyGoal);
      // Sync goal direction from body goal
      const dir = GOAL_DIRECTION_MAP[fields.bodyGoal];
      updates.push('goal_direction = ?'); values.push(dir);
      fields = { ...fields, goalDirection: dir };
    }
    if (fields.activityLevel !== undefined) { updates.push('activity_level = ?'); values.push(fields.activityLevel); }
    if (fields.weeklyWorkoutTarget !== undefined) { updates.push('weekly_workout_target = ?'); values.push(fields.weeklyWorkoutTarget); }
    if (fields.waterGoalMl !== undefined) { updates.push('water_goal_ml = ?'); values.push(fields.waterGoalMl); }
    if (fields.goalDirection !== undefined) { updates.push('goal_direction = ?'); values.push(fields.goalDirection); }

    if (updates.length > 0) {
      await db.runAsync(
        `UPDATE user_settings SET ${updates.join(', ')} WHERE id = 1`,
        values
      );
    }
    set((s) => ({ ...s, ...fields }));
  },

  loadTodayWater: async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const total = await getTodayWater(today);
    set({ todayWaterMl: total });
  },

  addWater: async (ml) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    await addWaterEntry(today, ml);
    set((s) => ({ todayWaterMl: s.todayWaterMl + ml }));
  },

  computeStreaks: async () => {
    try {
      const db = await getDatabase();
      const waterGoal = get().waterGoalMl;
      const weeklyTarget = get().weeklyWorkoutTarget;
      const weekMs = 7 * 24 * 60 * 60 * 1000;

      // All three main queries run in parallel
      const [logDays, waterDays, weekSessions, weeklyRows] = await Promise.all([
        db.getAllAsync<any>(`SELECT DISTINCT date FROM food_log ORDER BY date DESC LIMIT 60`),
        getWaterHistory(60),
        db.getFirstAsync<any>(
          `SELECT COUNT(*) as count FROM workout_sessions
           WHERE finished_at IS NOT NULL AND started_at >= ?`,
          [getWeekStart()]
        ),
        // Single query replaces 12 serial queries — bucket sessions into 7-day windows
        db.getAllAsync<any>(
          `SELECT CAST(started_at / ? AS INTEGER) as week_num, COUNT(*) as cnt
           FROM workout_sessions
           WHERE finished_at IS NOT NULL
           GROUP BY week_num
           ORDER BY week_num DESC
           LIMIT 14`,
          [weekMs]
        ),
      ]);

      const logStreak = computeConsecutiveDayStreak(logDays.map((r) => r.date));
      const waterStreak = computeConsecutiveDayStreak(
        waterDays.filter((d) => d.totalMl >= waterGoal).map((d) => d.date).reverse()
      );
      const weeklyCount = weekSessions?.count ?? 0;
      const workoutStreak = computeWeeklyStreakFromRows(weeklyRows, weeklyTarget);

      set({ loggingStreak: logStreak, waterStreak, weeklySessionCount: weeklyCount, workoutStreak });
    } catch {}
  },
}));

function getWeekStart(): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

function computeConsecutiveDayStreak(datesDesc: string[]): number {
  if (datesDesc.length === 0) return 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  // Streak must start from today or yesterday
  if (datesDesc[0] !== today && datesDesc[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < datesDesc.length; i++) {
    const prev = new Date(datesDesc[i - 1]);
    const curr = new Date(datesDesc[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function computeWeeklyStreakFromRows(
  rows: Array<{ week_num: number; cnt: number }>,
  target: number
): number {
  if (rows.length === 0) return 0;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const currentWeek = Math.floor(Date.now() / weekMs);
  let streak = 0;
  let expected = currentWeek;

  for (const row of rows) {
    if (row.week_num === expected) {
      if (row.cnt >= target) {
        streak++;
      } else if (row.week_num === currentWeek) {
        // Current week not done yet — skip without breaking
      } else {
        break;
      }
      expected--;
    } else if (row.week_num < expected) {
      // Gap in weeks — streak broken
      break;
    }
  }
  return streak;
}

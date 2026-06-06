export type BodyGoal = 'lose_fat' | 'maintain' | 'gain_muscle' | 'bulk' | 'recomp';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete';
export type GoalDirection = 'lose' | 'maintain' | 'gain';

export const BODY_GOAL_LABELS: Record<BodyGoal, string> = {
  lose_fat: 'Lose Fat',
  maintain: 'Maintain',
  gain_muscle: 'Gain Muscle',
  bulk: 'Bulk',
  recomp: 'Body Recomp',
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly Active',
  moderate: 'Moderately Active',
  very_active: 'Very Active',
  athlete: 'Athlete',
};

export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: 'Little or no exercise',
  light: '1–3 days/week',
  moderate: '3–5 days/week',
  very_active: '6–7 days/week',
  athlete: 'Twice a day or physical job',
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

const GOAL_ADJUSTMENTS: Record<BodyGoal, number> = {
  lose_fat: -400,
  maintain: 0,
  gain_muscle: 250,
  bulk: 500,
  recomp: -150,
};

export const GOAL_DIRECTION_MAP: Record<BodyGoal, GoalDirection> = {
  lose_fat: 'lose',
  maintain: 'maintain',
  gain_muscle: 'gain',
  bulk: 'gain',
  recomp: 'maintain',
};

export function calculateTDEE(params: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: 'male' | 'female';
  activityLevel: ActivityLevel;
}): number {
  const { weightKg, heightCm, ageYears, sex, activityLevel } = params;
  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function suggestedCalories(tdee: number, goal: BodyGoal): number {
  return Math.max(1200, Math.round(tdee + GOAL_ADJUSTMENTS[goal]));
}

export function suggestedMacros(
  calories: number,
  weightKg: number
): { protein: number; carbs: number; fat: number } {
  const protein = Math.round(weightKg * 2.2);
  const proteinCals = protein * 4;
  const remaining = Math.max(0, calories - proteinCals);
  const fat = Math.round((remaining * 0.3) / 9);
  const carbs = Math.round((remaining * 0.7) / 4);
  return { protein, carbs, fat };
}

export function ageFromDOB(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

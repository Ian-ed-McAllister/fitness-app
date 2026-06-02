export type WeightUnit = 'kg' | 'lb';

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  unit: WeightUnit;
  notes?: string;
  createdAt: number;
}

export interface UserSettings {
  weightUnit: WeightUnit;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

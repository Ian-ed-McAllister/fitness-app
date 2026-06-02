export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'full body';
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable' | 'kettlebell' | 'band';
export type ExerciseSource = 'default' | 'custom';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  source: ExerciseSource;
}

export interface TemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  exercise: Exercise;
  position: number;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutSession {
  id: string;
  templateId?: string;
  name: string;
  startedAt: number;
  finishedAt?: number;
  notes?: string;
  exercises: SessionExercise[];
}

export interface SessionExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: SessionSet[];
}

export interface SessionSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  isPR: boolean;
  completed: boolean;
  loggedAt: number;
}

export interface ActiveSet {
  exerciseId: string;
  setNumber: number;
  reps: string;
  weight: string;
  completed: boolean;
  isPR: boolean;
}

export interface PreviousSetData {
  reps?: number;
  weight?: number;
}

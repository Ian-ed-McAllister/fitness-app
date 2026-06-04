import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTemplates,
  createTemplate as dbCreateTemplate,
  updateTemplate as dbUpdateTemplate,
  deleteTemplate as dbDeleteTemplate,
  createSession,
  finishSession,
  deleteSession,
  logSet,
  getLastSessionSets,
  getExercisePR,
} from '../db/workouts';
import type { WorkoutTemplate, Exercise, DraftTemplateExercise } from '../types/workout';

export interface LoggedSet {
  id: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  isPR: boolean;
}

export interface ActiveSessionState {
  sessionId: string;
  templateId?: string;
  name: string;
  startedAt: number;
  exercises: Exercise[];
  plannedSets: Record<string, number>;
  loggedSets: Record<string, LoggedSet[]>;
  previousSets: Record<string, Array<{ setNumber: number; reps?: number; weight?: number }>>;
}

interface WorkoutState {
  templates: WorkoutTemplate[];
  activeSession: ActiveSessionState | null;
  draftExercises: DraftTemplateExercise[];
  isLoading: boolean;

  loadTemplates: () => Promise<void>;
  addTemplate: (name: string, desc: string | undefined, drafts: DraftTemplateExercise[]) => Promise<WorkoutTemplate>;
  editTemplate: (id: string, name: string, desc: string | undefined, drafts: DraftTemplateExercise[]) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;

  startSession: (template: WorkoutTemplate | null, customName?: string) => Promise<void>;
  logActiveSet: (exerciseId: string, reps: number | undefined, weight: number | undefined) => Promise<void>;
  addExercisesToSession: (exercises: Exercise[]) => Promise<void>;
  finishActiveSession: (notes?: string) => Promise<void>;
  discardActiveSession: () => Promise<void>;

  setDraftExercises: (drafts: DraftTemplateExercise[]) => void;
  clearDraftExercises: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      templates: [],
      activeSession: null,
      draftExercises: [],
      isLoading: false,

      loadTemplates: async () => {
        set({ isLoading: true });
        try {
          const templates = await getTemplates();
          set({ templates, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addTemplate: async (name, desc, drafts) => {
        const template = await dbCreateTemplate(
          name,
          desc,
          drafts.map((d) => ({ exerciseId: d.exercise.id, sets: d.sets }))
        );
        set((s) => ({ templates: [template, ...s.templates] }));
        return template;
      },

      editTemplate: async (id, name, desc, drafts) => {
        await dbUpdateTemplate(
          id,
          name,
          desc,
          drafts.map((d) => ({ exerciseId: d.exercise.id, sets: d.sets }))
        );
        const updated = await getTemplates();
        set({ templates: updated });
      },

      removeTemplate: async (id) => {
        await dbDeleteTemplate(id);
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
      },

      startSession: async (template, customName) => {
        const name = customName ?? template?.name ?? 'Workout';
        const sessionId = await createSession(template?.id, name);
        const exercises = template ? template.exercises.map((te) => te.exercise) : [];

        const plannedSets: Record<string, number> = {};
        if (template) {
          for (const te of template.exercises) {
            plannedSets[te.exercise.id] = te.defaultSets;
          }
        }

        const previousSets: Record<string, Array<{ setNumber: number; reps?: number; weight?: number }>> = {};
        for (const exercise of exercises) {
          const prev = await getLastSessionSets(exercise.id, sessionId);
          if (prev.length > 0) previousSets[exercise.id] = prev;
        }

        set({
          activeSession: {
            sessionId,
            templateId: template?.id,
            name,
            startedAt: Date.now(),
            exercises,
            plannedSets,
            loggedSets: {},
            previousSets,
          },
        });
      },

      logActiveSet: async (exerciseId, reps, weight) => {
        const { activeSession } = get();
        if (!activeSession) return;

        const existingSets = activeSession.loggedSets[exerciseId] ?? [];
        const setNumber = existingSets.length + 1;

        const currentPR = await getExercisePR(exerciseId);
        const isPR = weight != null && (currentPR == null || weight > currentPR);

        const savedSet = await logSet({
          sessionId: activeSession.sessionId,
          exerciseId,
          setNumber,
          reps,
          weight,
          isPR,
        });

        set((s) => {
          if (!s.activeSession) return s;
          const current = s.activeSession.loggedSets[exerciseId] ?? [];
          return {
            activeSession: {
              ...s.activeSession,
              loggedSets: {
                ...s.activeSession.loggedSets,
                [exerciseId]: [...current, { id: savedSet.id, setNumber, reps, weight, isPR }],
              },
            },
          };
        });
      },

      addExercisesToSession: async (exercises) => {
        const { activeSession } = get();
        if (!activeSession) return;

        const newExercises = exercises.filter(
          (e) => !activeSession.exercises.find((ex) => ex.id === e.id)
        );
        if (newExercises.length === 0) return;

        const newPreviousSets: Record<string, Array<{ setNumber: number; reps?: number; weight?: number }>> = {};
        const newPlanned: Record<string, number> = {};
        for (const exercise of newExercises) {
          const prev = await getLastSessionSets(exercise.id, activeSession.sessionId);
          if (prev.length > 0) newPreviousSets[exercise.id] = prev;
          newPlanned[exercise.id] = 3;
        }

        set((s) => {
          if (!s.activeSession) return s;
          return {
            activeSession: {
              ...s.activeSession,
              exercises: [...s.activeSession.exercises, ...newExercises],
              plannedSets: { ...s.activeSession.plannedSets, ...newPlanned },
              previousSets: { ...s.activeSession.previousSets, ...newPreviousSets },
            },
          };
        });
      },

      finishActiveSession: async (notes) => {
        const { activeSession } = get();
        if (!activeSession) return;
        await finishSession(activeSession.sessionId, notes);
        set({ activeSession: null });
        get().loadTemplates();
      },

      discardActiveSession: async () => {
        const { activeSession } = get();
        if (!activeSession) return;
        await deleteSession(activeSession.sessionId);
        set({ activeSession: null });
      },

      setDraftExercises: (drafts) => set({ draftExercises: drafts }),
      clearDraftExercises: () => set({ draftExercises: [] }),
    }),
    {
      name: 'workout-active-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ activeSession: state.activeSession }),
    }
  )
);

import { useEffect, useState } from 'react';
import { runMigrations } from '../db/migrations';
import { seedInitialData } from '../db/seed';
import { useProfileStore } from '../store/profileStore';
import { useWeightStore } from '../store/weightStore';
import { useNutritionStore } from '../store/nutritionStore';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await runMigrations();
        await seedInitialData();
        setIsReady(true);
        // Pre-load all stores in parallel so data is ready before any tab opens
        await Promise.all([
          useProfileStore.getState().loadProfile(),
          useWeightStore.getState().loadEntries(),
          useWeightStore.getState().loadUnit(),
          useNutritionStore.getState().loadGoals(),
          useNutritionStore.getState().loadCustomMealSlots(),
        ]);
      } catch (e) {
        setError(e as Error);
      }
    }
    init();
  }, []);

  return { isReady, error };
}

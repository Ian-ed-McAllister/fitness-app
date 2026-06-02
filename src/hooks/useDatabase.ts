import { useEffect, useState } from 'react';
import { runMigrations } from '../db/migrations';
import { seedInitialData } from '../db/seed';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await runMigrations();
        await seedInitialData();
        setIsReady(true);
      } catch (e) {
        setError(e as Error);
      }
    }
    init();
  }, []);

  return { isReady, error };
}

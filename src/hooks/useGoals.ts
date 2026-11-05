/**
 * Hooks métier du domaine objectifs.
 */
import { useCallback, useMemo } from 'react';
import { useGoalsStore } from '@/stores/goals.store';
import type { CreateGoalInput } from '@/database/repositories';
import type { Goal } from '@/types';

export interface UseGoalsResult {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  createGoal: (input: CreateGoalInput) => Promise<Goal | null>;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  setProgress: (id: string, progress: number) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Accès aux objectifs.
 *
 * `refresh` est mémorisée et la liste filtrée est elle aussi mémorisée : sans
 * cela, tout `useEffect(…, [refresh])` ou `useEffect(…, [goals])` se relançait
 * à chaque rendu, ce qui produisait des boucles de chargement.
 */
export function useGoals(): UseGoalsResult {
  const goals = useGoalsStore((state) => state.goals);
  const loading = useGoalsStore((state) => state.loading);
  const error = useGoalsStore((state) => state.error);
  const load = useGoalsStore((state) => state.load);
  const createGoal = useGoalsStore((state) => state.createGoal);
  const updateGoal = useGoalsStore((state) => state.updateGoal);
  const completeGoal = useGoalsStore((state) => state.completeGoal);
  const removeGoal = useGoalsStore((state) => state.removeGoal);
  const setProgress = useGoalsStore((state) => state.setProgress);

  // Les objectifs archivés ne sont jamais affichés dans Grow.
  const visibleGoals = useMemo(
    () => goals.filter((goal) => goal.status !== 'archived'),
    [goals],
  );

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return {
    goals: visibleGoals,
    loading,
    error,
    createGoal,
    updateGoal,
    completeGoal,
    removeGoal,
    setProgress,
    refresh,
  };
}

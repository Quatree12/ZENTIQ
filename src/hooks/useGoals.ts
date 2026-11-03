/**
 * Hooks métier du domaine objectifs.
 */
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

export function useGoals(): UseGoalsResult {
  const { goals, loading, error, load, createGoal, updateGoal, completeGoal, removeGoal, setProgress } =
    useGoalsStore();

  return {
    goals: goals.filter((goal) => goal.status !== 'archived'),
    loading,
    error,
    createGoal,
    updateGoal,
    completeGoal,
    removeGoal,
    setProgress,
    refresh: load,
  };
}

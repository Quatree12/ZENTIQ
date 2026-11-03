/**
 * Hooks métier du domaine habitudes.
 */
import { useHabitsStore } from '@/stores/habits.store';
import type { CreateHabitInput, HabitWithStatus } from '@/database/repositories';

export interface UseHabitsResult {
  habits: HabitWithStatus[];
  loading: boolean;
  error: string | null;
  togglingIds: string[];
  toggleHabit: (habitId: string) => Promise<void>;
  createHabit: (input: CreateHabitInput) => Promise<boolean>;
  removeHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  /** Habitudes cochées aujourd'hui. */
  doneCount: number;
  /** Nombre total d'habitudes actives. */
  total: number;
}

export function useHabits(): UseHabitsResult {
  const { habits, loading, error, togglingIds, load, toggleHabit, createHabit, removeHabit, archiveHabit } =
    useHabitsStore();

  return {
    habits,
    loading,
    error,
    togglingIds,
    toggleHabit,
    createHabit,
    removeHabit,
    archiveHabit,
    refresh: load,
    doneCount: habits.filter((habit) => habit.doneToday).length,
    total: habits.length,
  };
}

/**
 * Hooks métier du domaine humeur.
 */
import { useMoodStore } from '@/stores/mood.store';
import type { MoodEntry, MoodLevel } from '@/types';

export interface UseMoodResult {
  todayEntry: MoodEntry | null;
  entries: MoodEntry[];
  average: number | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveToday: (mood: MoodLevel, note?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Accès à l'humeur du jour et à l'historique.
 * Charge les données au premier montage si elles ne sont pas déjà en mémoire.
 */
export function useMood(): UseMoodResult {
  const { todayEntry, entries, average, loading, saving, error, saveToday, load, loadToday } =
    useMoodStore();

  return {
    todayEntry,
    entries,
    average,
    loading,
    saving,
    error,
    saveToday,
    refresh: async () => {
      await Promise.all([loadToday(), load()]);
    },
  };
}

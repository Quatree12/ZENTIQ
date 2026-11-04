/**
 * Hooks métier du domaine humeur.
 */
import { useCallback } from 'react';
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
 *
 * `refresh` est mémorisée via `useCallback`. Sans cela, la fonction était
 * recréée à chaque rendu, et tout `useEffect(…, [refresh])` se relançait en
 * boucle : l'effet appelait `refresh()`, ce qui provoquait un rendu, ce qui
 * recréait `refresh`, et ainsi de suite. C'est ce qui bloquait l'écran Today
 * sur un indicateur de chargement permanent.
 *
 * Les sélecteurs sont individuels plutôt qu'un destructuring global du store :
 * un composant ne se re-rend alors que si la valeur qu'il consomme change.
 */
export function useMood(): UseMoodResult {
  const todayEntry = useMoodStore((state) => state.todayEntry);
  const entries = useMoodStore((state) => state.entries);
  const average = useMoodStore((state) => state.average);
  const loading = useMoodStore((state) => state.loading);
  const saving = useMoodStore((state) => state.saving);
  const error = useMoodStore((state) => state.error);
  const saveToday = useMoodStore((state) => state.saveToday);
  const load = useMoodStore((state) => state.load);
  const loadToday = useMoodStore((state) => state.loadToday);

  const refresh = useCallback(async () => {
    await Promise.all([loadToday(), load()]);
  }, [loadToday, load]);

  return {
    todayEntry,
    entries,
    average,
    loading,
    saving,
    error,
    saveToday,
    refresh,
  };
}

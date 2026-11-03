/**
 * Store de l'humeur.
 *
 * Deux vues cohabitent : l'entrée du jour (utilisée par Today) et l'historique
 * (utilisé par Journey). Elles sont chargées séparément pour ne pas payer le
 * coût de l'historique sur l'écran d'accueil.
 */
import { create } from 'zustand';
import { moodsRepository } from '@/database/repositories';
import type { MoodEntry, MoodLevel } from '@/types';
import { todayKey } from '@/utils/dates';

interface MoodState {
  todayEntry: MoodEntry | null;
  entries: MoodEntry[];
  average: number | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  loadToday: () => Promise<void>;
  load: (limit?: number) => Promise<void>;
  saveToday: (mood: MoodLevel, note?: string) => Promise<boolean>;
  removeEntry: (id: string) => Promise<void>;
  reset: () => void;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const useMoodStore = create<MoodState>((set, get) => ({
  todayEntry: null,
  entries: [],
  average: null,
  loading: false,
  saving: false,
  error: null,

  loadToday: async () => {
    try {
      const todayEntry = await moodsRepository.getToday();
      set({ todayEntry });
    } catch (error) {
      set({ error: messageOf(error, "Le check-in du jour n'a pas pu être lu.") });
    }
  },

  load: async (limit = 30) => {
    set({ loading: true, error: null });
    try {
      const [entries, average] = await Promise.all([
        moodsRepository.listRecent(limit),
        moodsRepository.averageMood(7),
      ]);
      set({ entries, average, loading: false });
    } catch (error) {
      set({ loading: false, error: messageOf(error, "L'historique n'a pas pu être chargé.") });
    }
  },

  saveToday: async (mood, note) => {
    set({ saving: true, error: null });
    try {
      const entry = await moodsRepository.upsertForDate({
        date: todayKey(),
        mood,
        note,
      });
      // L'entrée du jour change : l'historique affiché doit suivre.
      set({
        todayEntry: entry,
        saving: false,
        entries: [entry, ...get().entries.filter((item) => item.id !== entry.id)],
      });
      return true;
    } catch (error) {
      set({ saving: false, error: messageOf(error, "Le check-in n'a pas pu être enregistré.") });
      return false;
    }
  },

  removeEntry: async (id) => {
    try {
      await moodsRepository.remove(id);
      set({
        entries: get().entries.filter((entry) => entry.id !== id),
        todayEntry: get().todayEntry?.id === id ? null : get().todayEntry,
        error: null,
      });
    } catch (error) {
      set({ error: messageOf(error, "L'entrée n'a pas pu être supprimée.") });
    }
  },

  reset: () =>
    set({ todayEntry: null, entries: [], average: null, loading: false, saving: false, error: null }),
}));

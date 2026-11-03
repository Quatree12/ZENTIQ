/**
 * Store des habitudes.
 *
 * `togglingIds` suit les coches en cours : l'UI peut afficher un état d'attente
 * sur la ligne concernée sans bloquer le reste de la liste.
 */
import { create } from 'zustand';
import {
  habitsRepository,
  type CreateHabitInput,
  type HabitWithStatus,
} from '@/database/repositories';
import { todayKey } from '@/utils/dates';

interface HabitsState {
  habits: HabitWithStatus[];
  loading: boolean;
  error: string | null;
  /** Identifiants dont la coche est en cours d'écriture. */
  togglingIds: string[];

  load: () => Promise<void>;
  toggleHabit: (habitId: string, date?: string) => Promise<void>;
  createHabit: (input: CreateHabitInput) => Promise<boolean>;
  removeHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  reset: () => void;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  loading: false,
  error: null,
  togglingIds: [],

  load: async () => {
    set({ loading: true, error: null });
    try {
      const habits = await habitsRepository.listWithStatus(todayKey());
      set({ habits, loading: false });
    } catch (error) {
      set({ loading: false, error: messageOf(error, "Les habitudes n'ont pas pu être chargées.") });
    }
  },

  toggleHabit: async (habitId, date = todayKey()) => {
    set({ togglingIds: [...get().togglingIds, habitId] });
    try {
      await habitsRepository.toggle(habitId, date);
      // Relecture de la vue enrichie : la série et le compteur hebdomadaire
      // dépendent de la coche qui vient de changer.
      const habits = await habitsRepository.listWithStatus(date);
      set({ habits, error: null });
    } catch (error) {
      set({ error: messageOf(error, "La coche n'a pas pu être enregistrée.") });
    } finally {
      set({ togglingIds: get().togglingIds.filter((id) => id !== habitId) });
    }
  },

  createHabit: async (input) => {
    try {
      await habitsRepository.create(input);
      const habits = await habitsRepository.listWithStatus(todayKey());
      set({ habits, error: null });
      return true;
    } catch (error) {
      set({ error: messageOf(error, "L'habitude n'a pas pu être créée.") });
      return false;
    }
  },

  removeHabit: async (id) => {
    try {
      await habitsRepository.remove(id);
      set({ habits: get().habits.filter((habit) => habit.id !== id), error: null });
    } catch (error) {
      set({ error: messageOf(error, "L'habitude n'a pas pu être supprimée.") });
    }
  },

  archiveHabit: async (id) => {
    try {
      await habitsRepository.archive(id);
      set({ habits: get().habits.filter((habit) => habit.id !== id), error: null });
    } catch (error) {
      set({ error: messageOf(error, "L'habitude n'a pas pu être archivée.") });
    }
  },

  reset: () => set({ habits: [], loading: false, error: null, togglingIds: [] }),
}));

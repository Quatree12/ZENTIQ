/**
 * Store des objectifs.
 *
 * Orchestre le repository : charge la liste, expose les actions et tient
 * l'état d'écran (chargement, erreur). Les composants ne touchent jamais Dexie.
 */
import { create } from 'zustand';
import { goalsRepository, type CreateGoalInput } from '@/database/repositories';
import type { Goal } from '@/types';

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<Goal | null>;
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => Promise<void>;
  setProgress: (id: string, progress: number) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  reset: () => void;
}

/** Message d'erreur lisible à partir d'une erreur quelconque. */
function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const goals = await goalsRepository.listAll();
      set({ goals, loading: false });
    } catch (error) {
      set({ loading: false, error: messageOf(error, "Les objectifs n'ont pas pu être chargés.") });
    }
  },

  createGoal: async (input) => {
    try {
      const goal = await goalsRepository.create(input);
      set({ goals: sortGoals([...get().goals, goal]), error: null });
      return goal;
    } catch (error) {
      set({ error: messageOf(error, "L'objectif n'a pas pu être créé.") });
      return null;
    }
  },

  updateGoal: async (id, patch) => {
    try {
      const updated = await goalsRepository.update(id, patch);
      set({ goals: get().goals.map((goal) => (goal.id === id ? updated : goal)), error: null });
    } catch (error) {
      set({ error: messageOf(error, "La modification n'a pas pu être enregistrée.") });
    }
  },

  setProgress: async (id, progress) => {
    await get().updateGoal(id, { progress });
  },

  completeGoal: async (id) => {
    try {
      const updated = await goalsRepository.complete(id);
      set({ goals: get().goals.map((goal) => (goal.id === id ? updated : goal)), error: null });
    } catch (error) {
      set({ error: messageOf(error, "L'objectif n'a pas pu être marqué comme atteint.") });
    }
  },

  removeGoal: async (id) => {
    try {
      await goalsRepository.remove(id);
      set({ goals: get().goals.filter((goal) => goal.id !== id), error: null });
    } catch (error) {
      set({ error: messageOf(error, "L'objectif n'a pas pu être supprimé.") });
    }
  },

  reset: () => set({ goals: [], loading: false, error: null }),
}));

/** Conserve l'ordre d'affichage du repository après un ajout local. */
function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

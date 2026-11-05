import { create } from 'zustand';
import {
  challengesRepository,
  type CreateChallengeInput,
} from '@/database/repositories';
import type { Challenge } from '@/types';

/**
 * Store des challenges.
 *
 * `busyIds` suit les ecritures en cours : l'interface peut afficher un etat
 * d'attente sur la carte concernee sans bloquer le reste de la liste. C'est le
 * meme motif que le store des habitudes.
 */

interface ChallengesState {
  challenges: Challenge[];
  loading: boolean;
  error: string | null;
  /** Identifiants dont une ecriture est en cours. */
  busyIds: string[];

  load: () => Promise<void>;
  createChallenge: (input: CreateChallengeInput) => Promise<Challenge | null>;
  completeDay: (id: string, dayNumber: number, date?: string) => Promise<Challenge | null>;
  uncompleteDay: (id: string, dayNumber: number) => Promise<void>;
  /**
   * Reporte un challenge de quelques jours.
   * Aucune etape n'est decochee : c'est tout l'interet du report.
   */
  postpone: (id: string, days?: number) => Promise<Challenge | null>;
  setAside: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  removeChallenge: (id: string) => Promise<void>;
  reset: () => void;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Relit la liste : le statut, la progression et les jalons sont derives. */
async function reload(): Promise<Challenge[]> {
  return challengesRepository.listAll();
}

export const useChallengesStore = create<ChallengesState>((set, get) => ({
  challenges: [],
  loading: false,
  error: null,
  busyIds: [],

  load: async () => {
    set({ loading: true, error: null });
    try {
      set({ challenges: await reload(), loading: false });
    } catch (error) {
      set({
        loading: false,
        error: messageOf(error, "Les challenges n'ont pas pu etre charges."),
      });
    }
  },

  createChallenge: async (input) => {
    try {
      const challenge = await challengesRepository.create(input);
      set({ challenges: await reload(), error: null });
      return challenge;
    } catch (error) {
      set({ error: messageOf(error, "Le challenge n'a pas pu etre cree.") });
      return null;
    }
  },

  completeDay: async (id, dayNumber, date) => {
    set({ busyIds: [...get().busyIds, id] });
    try {
      const updated = await challengesRepository.completeDay(id, dayNumber, date);
      set({ challenges: await reload(), error: null });
      return updated;
    } catch (error) {
      set({ error: messageOf(error, "La coche n'a pas pu etre enregistree.") });
      return null;
    } finally {
      set({ busyIds: get().busyIds.filter((busyId) => busyId !== id) });
    }
  },

  uncompleteDay: async (id, dayNumber) => {
    set({ busyIds: [...get().busyIds, id] });
    try {
      await challengesRepository.uncompleteDay(id, dayNumber);
      set({ challenges: await reload(), error: null });
    } catch (error) {
      set({ error: messageOf(error, "La coche n'a pas pu etre retiree.") });
    } finally {
      set({ busyIds: get().busyIds.filter((busyId) => busyId !== id) });
    }
  },

  postpone: async (id, days = 1) => {
    set({ busyIds: [...get().busyIds, id] });
    try {
      const updated = await challengesRepository.postpone(id, days);
      set({ challenges: await reload(), error: null });
      return updated;
    } catch (error) {
      set({ error: messageOf(error, "Le challenge n'a pas pu etre decale.") });
      return null;
    } finally {
      set({ busyIds: get().busyIds.filter((busyId) => busyId !== id) });
    }
  },

  setAside: async (id) => {
    try {
      await challengesRepository.setAside(id);
      set({ challenges: await reload(), error: null });
    } catch (error) {
      set({ error: messageOf(error, "Le challenge n'a pas pu etre mis de cote.") });
    }
  },

  resume: async (id) => {
    try {
      await challengesRepository.resume(id);
      set({ challenges: await reload(), error: null });
    } catch (error) {
      set({ error: messageOf(error, "Le challenge n'a pas pu etre repris.") });
    }
  },

  removeChallenge: async (id) => {
    try {
      await challengesRepository.remove(id);
      set({ challenges: get().challenges.filter((item) => item.id !== id), error: null });
    } catch (error) {
      set({ error: messageOf(error, "Le challenge n'a pas pu etre supprime.") });
    }
  },

  reset: () => set({ challenges: [], loading: false, error: null, busyIds: [] }),
}));

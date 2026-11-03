/**
 * Store du profil local.
 *
 * Le profil est un singleton : `load` crée une entrée vide à la première
 * ouverture si elle n'existe pas encore, pour que l'UI ait toujours un objet
 * sur lequel travailler.
 */
import { create } from 'zustand';
import { db, PROFILE_ID } from '@/database/db';
import { prepareInsert, prepareUpdate } from '@/database/repositories';
import type { UserProfile } from '@/types';
import { todayKey } from '@/utils/dates';

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  saveProfile: (
    patch: Partial<Pick<UserProfile, 'firstName' | 'intention' | 'birthDate'>>,
  ) => Promise<void>;
  reset: () => void;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const existing = await db.profile.get(PROFILE_ID);

      if (existing) {
        set({ profile: existing, loading: false });
        return;
      }

      const created = prepareInsert<UserProfile>({
        id: PROFILE_ID,
        firstName: '',
        intention: '',
        startedAt: todayKey(),
      });
      await db.profile.put(created);
      set({ profile: created, loading: false });
    } catch (error) {
      set({ loading: false, error: messageOf(error, "Le profil n'a pas pu être chargé.") });
    }
  },

  saveProfile: async (patch) => {
    const current = get().profile;
    if (!current) return;

    try {
      const updated = prepareUpdate(current, patch);
      await db.profile.put(updated);
      set({ profile: updated, error: null });
    } catch (error) {
      set({ error: messageOf(error, "Le profil n'a pas pu être enregistré.") });
    }
  },

  reset: () => set({ profile: null, loading: false, error: null }),
}));

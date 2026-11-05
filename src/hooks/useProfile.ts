/**
 * Hooks transverses : profil, réglages, favoris.
 */
import { useCallback } from 'react';
import { useFavoritesStore } from '@/stores/favorites.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useUserStore } from '@/stores/user.store';
import type { UserProfile, UserSettings } from '@/types';

export interface UseProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  saveProfile: (
    patch: Partial<Pick<UserProfile, 'firstName' | 'intention' | 'birthDate'>>,
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

/** Accès au profil local. `refresh` mémorisée, comme pour les autres hooks. */
export function useProfile(): UseProfileResult {
  const profile = useUserStore((state) => state.profile);
  const loading = useUserStore((state) => state.loading);
  const error = useUserStore((state) => state.error);
  const load = useUserStore((state) => state.load);
  const saveProfile = useUserStore((state) => state.saveProfile);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return { profile, loading, error, saveProfile, refresh };
}

export interface UseSettingsResult {
  settings: UserSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateSettings: (
    patch: Partial<Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

/** Accès aux préférences. */
export function useSettings(): UseSettingsResult {
  const settings = useSettingsStore((state) => state.settings);
  const loading = useSettingsStore((state) => state.loading);
  const saving = useSettingsStore((state) => state.saving);
  const error = useSettingsStore((state) => state.error);
  const load = useSettingsStore((state) => state.load);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return { settings, loading, saving, error, updateSettings, refresh };
}

export interface UseFavoritesResult {
  favoriteKeys: string[];
  loading: boolean;
  error: string | null;
  isFavorite: (refType: 'quote' | 'affirmation' | 'music', refId: string) => boolean;
  toggleFavorite: (refType: 'quote' | 'affirmation' | 'music', refId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/** Accès aux favoris. */
export function useFavorites(): UseFavoritesResult {
  const favoriteKeys = useFavoritesStore((state) => state.keys);
  const loading = useFavoritesStore((state) => state.loading);
  const error = useFavoritesStore((state) => state.error);
  const load = useFavoritesStore((state) => state.load);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return { favoriteKeys, loading, error, isFavorite, toggleFavorite, refresh };
}

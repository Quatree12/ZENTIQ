/**
 * Hooks transverses : profil, réglages, état de la base, favoris.
 */
import { useFavoritesStore } from '@/stores/favorites.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useUserStore } from '@/stores/user.store';
import type { UserProfile, UserSettings } from '@/types';

export interface UseProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  saveProfile: (patch: Partial<Pick<UserProfile, 'firstName' | 'intention' | 'birthDate'>>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const { profile, loading, error, load, saveProfile } = useUserStore();
  return { profile, loading, error, saveProfile, refresh: load };
}

export interface UseSettingsResult {
  settings: UserSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateSettings: (patch: Partial<Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const { settings, loading, saving, error, load, updateSettings } = useSettingsStore();
  return { settings, loading, saving, error, updateSettings, refresh: load };
}

export interface UseFavoritesResult {
  favoriteKeys: string[];
  loading: boolean;
  error: string | null;
  isFavorite: (refType: 'quote' | 'affirmation' | 'music', refId: string) => boolean;
  toggleFavorite: (refType: 'quote' | 'affirmation' | 'music', refId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFavorites(): UseFavoritesResult {
  const { keys, loading, error, load, isFavorite, toggleFavorite } = useFavoritesStore();
  return { favoriteKeys: keys, loading, error, isFavorite, toggleFavorite, refresh: load };
}

/**
 * Store des favoris.
 *
 * Les clés sont tenues sous la forme `type:id`, ce qui rend la vérification
 * d'état immédiate dans une liste sans requête supplémentaire.
 */
import { create } from 'zustand';
import { favoritesRepository, type FavoriteRefType } from '@/database/repositories';

interface FavoritesState {
  keys: string[];
  loading: boolean;
  error: string | null;

  load: () => Promise<void>;
  isFavorite: (refType: FavoriteRefType, refId: string) => boolean;
  toggleFavorite: (refType: FavoriteRefType, refId: string) => Promise<void>;
  reset: () => void;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Clé composite stable, utilisée comme identifiant de set côté UI. */
export function favoriteKey(refType: FavoriteRefType, refId: string): string {
  return `${refType}:${refId}`;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  keys: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const favorites = await favoritesRepository.listAll();
      set({
        keys: favorites.map((favorite) => favoriteKey(favorite.refType, favorite.refId)),
        loading: false,
      });
    } catch (error) {
      set({ loading: false, error: messageOf(error, "Les favoris n'ont pas pu être chargés.") });
    }
  },

  isFavorite: (refType, refId) => get().keys.includes(favoriteKey(refType, refId)),

  toggleFavorite: async (refType, refId) => {
    const key = favoriteKey(refType, refId);
    const wasFavorite = get().keys.includes(key);

    // Mise à jour optimiste : l'icône réagit immédiatement.
    set({
      keys: wasFavorite ? get().keys.filter((item) => item !== key) : [...get().keys, key],
    });

    try {
      await favoritesRepository.toggle(refType, refId);
      set({ error: null });
    } catch (error) {
      // En cas d'échec, on rétablit l'état réel plutôt que de laisser un
      // affichage qui ne correspond plus à la base.
      set({
        keys: wasFavorite ? [...get().keys, key] : get().keys.filter((item) => item !== key),
        error: messageOf(error, "Le favori n'a pas pu être modifié."),
      });
    }
  },

  reset: () => set({ keys: [], loading: false, error: null }),
}));

import { db } from '@/database/db';
import type { Favorite } from '@/types';
import { guard, prepareInsert } from './base.repository';

/**
 * Accès aux favoris.
 *
 * Table générique : elle référence n'importe quel contenu par `refType` +
 * `refId`, ce qui évite d'ajouter une colonne `favorite` à chaque futur type de
 * contenu.
 *
 * La cohérence est assurée par la couche store, pas par une contrainte SQL :
 * lorsque du contenu est supprimé, le store appelant nettoie ses favoris via
 * `removeAllForRef`.
 */

export type FavoriteRefType = Favorite['refType'];

export const favoritesRepository = {
  async listAll(): Promise<Favorite[]> {
    return guard('favorites.listAll', async () => {
      const favorites = await db.favorites.toArray();
      return favorites.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  },

  /** Favoris d'un type de contenu donné. */
  async listByType(refType: FavoriteRefType): Promise<Favorite[]> {
    return guard('favorites.listByType', async () => {
      const favorites = await db.favorites.where('refType').equals(refType).toArray();
      return favorites.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  },

  /** Vrai si la référence est déjà en favori. */
  async has(refType: FavoriteRefType, refId: string): Promise<boolean> {
    return guard('favorites.has', async () => {
      const match = await db.favorites.where('[refType+refId]').equals([refType, refId]).first();
      return Boolean(match);
    });
  },

  /** Ajoute un favori. Idempotent : un doublon n'est jamais créé. */
  async add(refType: FavoriteRefType, refId: string): Promise<Favorite> {
    return guard('favorites.add', async () => {
      const existing = await db.favorites
        .where('[refType+refId]')
        .equals([refType, refId])
        .first();
      if (existing) return existing;

      const favorite = prepareInsert<Favorite>({ refType, refId });
      await db.favorites.add(favorite);
      return favorite;
    });
  },

  /** Retire un favori. */
  async remove(refType: FavoriteRefType, refId: string): Promise<void> {
    await guard('favorites.remove', async () => {
      const existing = await db.favorites
        .where('[refType+refId]')
        .equals([refType, refId])
        .first();
      if (existing) await db.favorites.delete(existing.id);
    });
  },

  /** Bascule l'état favori et renvoie le nouvel état. */
  async toggle(refType: FavoriteRefType, refId: string): Promise<boolean> {
    const isFavorite = await favoritesRepository.has(refType, refId);
    if (isFavorite) {
      await favoritesRepository.remove(refType, refId);
      return false;
    }
    await favoritesRepository.add(refType, refId);
    return true;
  },

  /**
   * Supprime tous les favoris pointant vers une référence.
   * Appelé lors de la suppression d'un contenu, pour ne pas laisser d'orphelins.
   */
  async removeAllForRef(refType: FavoriteRefType, refId: string): Promise<void> {
    await guard('favorites.removeAllForRef', async () => {
      const matches = await db.favorites.where('[refType+refId]').equals([refType, refId]).toArray();
      if (matches.length > 0) {
        await db.favorites.bulkDelete(matches.map((favorite) => favorite.id));
      }
    });
  },

  async count(): Promise<number> {
    return guard('favorites.count', () => db.favorites.count());
  },
};

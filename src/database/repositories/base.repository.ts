import type { BaseEntity } from '@/types';
import { nowIso } from '@/utils/dates';
import { createId } from '@/utils/id';

/**
 * Base commune à tous les repositories.
 *
 * Elle évite de répéter la génération d'identifiant et l'entretien des
 * horodatages dans chaque méthode, sans masquer les requêtes spécifiques :
 * chaque repository reste lisible et expose exactement ce dont le domaine a
 * besoin.
 *
 * NOTE DE TYPAGE : les contraintes génériques s'appuient sur `BaseEntity`
 * (déclaré dans `@/types`), et non sur une interface locale. Une interface
 * `PersistedEntity` dupliquait les trois mêmes champs ici, ce qui empêchait
 * TypeScript de reconnaître `Goal`, `Favorite` & co. comme satisfaisant la
 * contrainte — d'où une cascade d'erreurs `Property 'id' does not exist`.
 */

/**
 * Prépare une entité à l'insertion : identifiant et horodatages.
 * Accepte une entité partielle pour laisser le domaine décider de ses champs.
 */
export function prepareInsert<T extends BaseEntity>(
  input: Omit<T, keyof BaseEntity> & Partial<BaseEntity>,
): T {
  const timestamp = nowIso();
  return {
    ...input,
    id: input.id ?? createId(),
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
  } as T;
}

/**
 * Prépare une mise à jour partielle : seuls les champs fournis changent,
 * `updatedAt` est rafraîchi, `id` et `createdAt` sont préservés.
 */
export function prepareUpdate<T extends BaseEntity>(
  existing: T,
  patch: Partial<Omit<T, 'id' | 'createdAt'>>,
): T {
  return {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: nowIso(),
  };
}

/**
 * Erreur d'accès aux données, porteuse d'un message déjà destiné à l'UI.
 * Les stores s'en servent pour remplir leur champ `error`.
 */
export class RepositoryError extends Error {
  readonly operation: string;
  readonly cause?: unknown;

  constructor(message: string, operation: string, cause?: unknown) {
    super(message);
    this.name = 'RepositoryError';
    this.operation = operation;
    this.cause = cause;
  }
}

/** Enveloppe une opération et traduit toute erreur inattendue. */
export async function guard<T>(
  operation: string,
  run: () => Promise<T>,
  fallbackMessage = "L'opération n'a pas pu être enregistrée. Réessaie dans un instant.",
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    // Les erreurs déjà qualifiées remontent telles quelles.
    if (error instanceof RepositoryError) throw error;
    throw new RepositoryError(fallbackMessage, operation, error);
  }
}

/** Trie une liste par date décroissante, puis par clé de jour. */
export function sortByDateDesc<T extends { date?: string; createdAt: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const dateA = a.date ?? a.createdAt;
    const dateB = b.date ?? b.createdAt;
    if (dateA === dateB) return b.createdAt.localeCompare(a.createdAt);
    return dateB.localeCompare(dateA);
  });
}

import type { Transaction, Dexie } from 'dexie';
import { TABLES } from './schema';

/**
 * Migrations Dexie.
 *
 * Chaque migration est appliquee par Dexie lors d'une montee de version. Elle
 * s'execute dans une transaction : soit tout passe, soit rien ne change.
 *
 * REGLE : une version publiee n'est jamais modifiee. Toute evolution AJOUTE une
 * entree a ce registre.
 */

export type MigrationFn = (tx: Transaction) => Promise<void>;

export interface Migration {
  /** Version cible de Dexie. */
  version: number;
  /** Description courte, journalisee dans `meta.schema:history`. */
  description: string;
  /** Index de chaque table a cette version. */
  stores: Record<string, string>;
  /** Transformation optionnelle des donnees. */
  upgrade?: MigrationFn;
}

/**
 * Registre des migrations, dans l'ordre croissant.
 *
 * v1 — schema initial. Declare les tables, ne transforme rien.
 *
 * v2 — ajout de `lastReviewedAt` sur les habitudes.
 *
 *   POURQUOI CE CHAMP, ET POURQUOI CETTE MIGRATION EXISTE
 *   ----------------------------------------------------
 *   Le mecanisme de migration n'avait jamais tourne : le registre etait vide,
 *   donc la montee de version n'avait jamais ete exercee. Une migration qui ne
 *   s'execute jamais est une migration dont on ne sait rien.
 *
 *   `lastReviewedAt` permet de savoir quand une habitude a ete relue pour la
 *   derniere fois. L'interface ne l'utilise pas encore : c'est un champ prepare,
 *   pas un comportement ajoute. La migration se contente de le poser a `null`
 *   sur les enregistrements existants, sans rien perdre ni rien changer.
 *
 *   L'index est declare dans `TABLES` (schema.ts) et repris ici.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    description: 'Schema initial : 13 tables',
    stores: {
      profile: 'id',
      settings: 'id',
      moods: 'id, date, mood, createdAt',
      goals: 'id, status, targetDate, isPriority, createdAt',
      habits: 'id, archived, goalId, createdAt',
      habitCompletions: 'id, habitId, date, [habitId+date]',
      challenges: 'id, status, startDate, habitId',
      journal: 'id, date, pinned, createdAt',
      quotes: 'id, category, favorite, author',
      affirmations: 'id, category, favorite',
      music: 'id, category, favorite, artist',
      favorites: 'id, refType, refId, [refType+refId]',
      meta: 'key',
    },
  },
  {
    version: 2,
    description: 'Ajout de lastReviewedAt sur les habitudes',
    stores: { ...TABLES },
    upgrade: async (tx: Transaction) => {
      // `modify` parcourt la table : chaque habitude existante recoit le champ
      // a `null`. On n'ecrit pas une date invente : une habitude jamais relue
      // n'a pas de date de relecture.
      await tx
        .table('habits')
        .toCollection()
        .modify((habit: Record<string, unknown>) => {
          habit.lastReviewedAt = null;
        });
    },
  },
];

/**
 * Applique les migrations declarees sur une instance Dexie.
 *
 * Le parametre est type `Dexie` et non `ZentiqSchema` : `.version()` appartient
 * a la classe Dexie, alors que `ZentiqSchema` ne decrit que la forme des tables
 * et n'a aucune methode. La classe `ZentiqDatabase` etend `Dexie`, elle satisfait
 * donc les deux — c'est ce qui rend l'appel valide depuis `db.ts`.
 *
 * `db.version(n).stores(...)` est appele pour chaque entree ; Dexie se charge
 * de n'executer que celles qui manquent, puis d'appeler les `upgrade`
 * necessaires dans l'ordre.
 */
export function applyMigrations(db: Dexie): void {
  for (const migration of migrations) {
    let version = db.version(migration.version).stores(migration.stores);
    if (migration.upgrade) {
      version = version.upgrade(migration.upgrade);
    }
  }
}

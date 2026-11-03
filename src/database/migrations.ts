import type Dexie from 'dexie';

/**
 * Migrations Dexie.
 *
 * Chaque migration est appliquée par Dexie lors d'une montée de version. Elle
 * s'exécute dans une transaction : soit tout passe, soit rien ne change.
 *
 * La version 1 est la création initiale du schéma — elle déclare les tables
 * sans transformer de données.
 */

export type MigrationFn = (tx: import('dexie').Transaction) => Promise<void>;

export interface Migration {
  /** Version cible de Dexie. */
  version: number;
  /** Description courte, journalisée dans `meta.schema:history`. */
  description: string;
  /** Index de chaque table à cette version. */
  stores: Record<string, string>;
  /** Transformation optionnelle des données. */
  upgrade?: MigrationFn;
}

/**
 * Registre des migrations, dans l'ordre croissant.
 *
 * EXEMPLE POUR UNE PROCHAINE VERSION (à ne pas activer maintenant) :
 *
 *   {
 *     version: 2,
 *     description: 'Ajout du champ lastReviewedAt sur goals',
 *     stores: { ...TABLES, goals: 'id, status, targetDate, isPriority, createdAt, lastReviewedAt' },
 *     upgrade: async (tx) => {
 *       await tx.table('goals').toCollection().modify((goal: Record<string, unknown>) => {
 *         goal.lastReviewedAt = null;
 *       });
 *     },
 *   }
 */
export const migrations: Migration[] = [];

/**
 * Applique les migrations déclarées sur une instance Dexie.
 *
 * `db.version(n).stores(...)` est appelé pour chaque entrée ; Dexie se charge
 * de n'exécuter que celles qui manquent, puis d'appeler les `upgrade`
 * nécessaires dans l'ordre.
 *
 * NOTE DE TYPAGE : le paramètre est typé `Dexie` (la classe), et non
 * `ZentiqSchema` (l'interface décrivant les tables). C'est `version()` qui est
 * appelée ici, or cette méthode appartient à la classe Dexie — l'interface des
 * tables ne la déclare pas.
 */
export function applyMigrations(db: Dexie): void {
  for (const migration of migrations) {
    let version = db.version(migration.version).stores(migration.stores);
    if (migration.upgrade) {
      version = version.upgrade(migration.upgrade);
    }
  }
}

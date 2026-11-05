/**
 * Tables exportables — DERIVEES DU SCHEMA, plus maintenues a la main.
 *
 * POURQUOI CE FICHIER
 * -------------------
 * La liste des tables exportables vivait dans `schema.ts` sous forme de
 * tableau ecrit a la main. Ajouter une table au schema sans l'ajouter a cette
 * liste l'aurait rendue silencieusement ABSENTE des sauvegardes : aucune
 * erreur, aucun avertissement, juste des donnees qu'on ne peut plus exporter.
 *
 * Ici, la liste se deduit de `TABLES` : toute table du schema est exportable,
 * SAUF celles listees dans `INTERNAL_TABLES`. Une table technique ajoutee
 * demain n'apparaitra donc jamais par accident dans une sauvegarde.
 */

import { TABLES, type TableName } from './schema';

/**
 * Tables techniques : jamais exportees.
 *
 * `meta` porte le journal de version du schema lui-meme. L'exporter n'aurait
 * pas de sens : il est regenere a l'ouverture, et le restaurer depuis une
 * sauvegarde ancienne pourrait faire croire a une version qui n'est plus la
 * bonne.
 */
export const INTERNAL_TABLES: readonly TableName[] = ['meta'];

/**
 * Tables sauvegardees et restaurees, dans l'ordre du schema.
 * L'ordre est stable : il suit la declaration de `TABLES`, donc deux exports
 * successifs produisent la meme sequence de tables.
 */
export const EXPORTABLE_TABLES: readonly TableName[] = (
  Object.keys(TABLES) as TableName[]
).filter((table) => !INTERNAL_TABLES.includes(table));

export type ExportableTableName = Exclude<TableName, 'meta'>;

/** Vrai si la table participe aux sauvegardes. */
export function isExportable(table: string): table is ExportableTableName {
  return (EXPORTABLE_TABLES as readonly string[]).includes(table);
}

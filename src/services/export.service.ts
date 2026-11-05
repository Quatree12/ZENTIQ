import { APP_VERSION } from '@/app/app-config';
import { db, PROFILE_ID, SETTINGS_ID, writeMeta } from '@/database/db';
import { META_KEYS, type BackupDocument } from '@/database/schema';
import { EXPORTABLE_TABLES } from '@/database/exportable-tables';
import { nowIso, todayKey } from '@/utils/dates';
import type { TableName } from '@/database/schema';

/**
 * Export des données locales.
 *
 * L'export est un fichier JSON que l'utilisateur télécharge lui-même. Aucun
 * envoi réseau n'a lieu : c'est le seul moyen de sortir ses données de
 * l'appareil, et il reste entièrement sous son contrôle.
 *
 * EXPORT SÉLECTIF
 * ---------------
 * `tables` permet de choisir CE QU'ON EMPORTE, table par table. Le besoin réel :
 * un utilisateur qui veut sauvegarder ses données mais pas son journal — parce
 * qu'il va partager le fichier, ou parce qu'il le juge trop personnel pour
 * dormir dans un dossier de téléchargements.
 *
 * Sans `tables`, tout part : c'est le comportement historique, et il reste le
 * défaut. Une sélection vide est traitée comme « rien », pas comme « tout » —
 * un export vide est visible dans les compteurs, alors qu'un export complet
 * inattendu ne se verrait pas.
 */

export interface ExportOptions {
  /** Inclure le journal personnel (privé par nature). */
  includeJournal?: boolean;
  /** Inclure les contenus inspirants mis en cache. */
  includeContent?: boolean;
  /**
   * Tables à exporter explicitement. Absent = toutes les tables exportables.
   * Un tableau vide produit un document sans données — pas un export complet.
   */
  tables?: TableName[];
}

/** Tables qui portent du contenu inspirant plutôt que des données personnelles. */
const CONTENT_TABLES: TableName[] = ['quotes', 'affirmations', 'music'];

/** Vrai si la table doit être incluse, selon les options. */
function isIncluded(table: TableName, options: ExportOptions): boolean {
  if (options.tables !== undefined) return options.tables.includes(table);

  const { includeJournal = true, includeContent = true } = options;
  if (!includeJournal && table === 'journal') return false;
  if (!includeContent && CONTENT_TABLES.includes(table)) return false;
  return true;
}

/** Construit le document de sauvegarde, complet ou partiel. */
export async function buildBackupDocument(options: ExportOptions = {}): Promise<BackupDocument> {
  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  for (const table of EXPORTABLE_TABLES) {
    if (!isIncluded(table, options)) {
      counts[table] = 0;
      continue;
    }

    const rows = (await db.table(table).toArray()) as unknown[];
    data[table] = rows;
    counts[table] = rows.length;
  }

  return {
    kind: 'zentiq-backup',
    appVersion: APP_VERSION,
    schemaVersion: await currentSchemaVersion(),
    exportedAt: nowIso(),
    counts,
    data,
  };
}

/** Version de schéma enregistrée en base (repli : 1 pour une base neuve). */
async function currentSchemaVersion(): Promise<number> {
  const meta = await db.meta.get(META_KEYS.schemaLastOpened);
  const value = meta?.value;
  return typeof value === 'number' ? value : 1;
}

/** Nom de fichier proposé au téléchargement. */
export function suggestedFileName(): string {
  return `zentiq-sauvegarde-${todayKey()}.json`;
}

/**
 * Déclenche le téléchargement du document de sauvegarde.
 * Renvoie le nombre d'enregistrements exportés, table par table.
 *
 * `lastBackupAt` n'est mis à jour QUE pour un export complet : un export
 * partiel ne doit pas faire croire que tout est sauvegardé. C'est ce que lit le
 * rappel de sauvegarde, et le tromper serait grave.
 */
export async function downloadBackup(options: ExportOptions = {}): Promise<Record<string, number>> {
  const document = await buildBackupDocument(options);
  const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = suggestedFileName();
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Laisse le navigateur démarrer le téléchargement avant de libérer l'URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  const isComplete = options.tables === undefined;
  if (isComplete) await writeMeta(META_KEYS.lastBackupAt, nowIso());

  return document.counts;
}

/**
 * Export rapide d'une seule table, pour un besoin ponctuel.
 * Utilisé par le diagnostic de l'espace ME.
 */
export async function downloadTable(table: string): Promise<void> {
  const rows = (await db.table(table).toArray()) as unknown[];
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = `zentiq-${table}-${todayKey()}.json`;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Statistiques locales affichées dans l'espace ME avant un export.
 * Elles décrivent ce qui va être écrit dans le fichier.
 */
export interface LocalDataSummary {
  counts: Record<string, number>;
  total: number;
}

export async function summarizeLocalData(): Promise<LocalDataSummary> {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const table of EXPORTABLE_TABLES) {
    const count = await db.table(table).count();
    counts[table] = count;
    total += count;
  }

  // Le profil et les réglages sont des singletons : on signale leur présence.
  const hasProfile = (await db.profile.get(PROFILE_ID)) !== undefined;
  const hasSettings = (await db.settings.get(SETTINGS_ID)) !== undefined;

  return {
    counts: { ...counts, profilConfigure: hasProfile ? 1 : 0, reglages: hasSettings ? 1 : 0 },
    total,
  };
}

/* --------------------------------------------------------------------------
   Description des tables, pour l'interface d'export sélectif
   -------------------------------------------------------------------------- */

export interface TableDescriptor {
  table: TableName;
  /** Libellé lisible, jamais un nom technique. */
  label: string;
  /** Ce que contient la table, en une phrase. */
  description: string;
  /** Vrai si la table porte des données intimes. */
  sensitive: boolean;
}

/**
 * Description des tables offertes au choix, dans un ordre de lecture humain :
 * d'abord ce qui décrit la personne, puis ce qu'elle a construit, puis le
 * contenu fourni par ZENTIQ.
 */
export const TABLE_DESCRIPTORS: TableDescriptor[] = [
  {
    table: 'profile',
    label: 'Profil',
    description: 'Prénom, intention et date de départ.',
    sensitive: false,
  },
  {
    table: 'settings',
    label: 'Préférences',
    description: 'Accent, densité, rappels et confort de lecture.',
    sensitive: false,
  },
  {
    table: 'moods',
    label: 'Humeurs',
    description: "Tes check-ins quotidiens et leurs notes.",
    sensitive: true,
  },
  {
    table: 'goals',
    label: 'Objectifs',
    description: "Ce que tu poursuis, et où tu en es.",
    sensitive: false,
  },
  {
    table: 'habits',
    label: 'Habitudes',
    description: 'Les routines que tu suis.',
    sensitive: false,
  },
  {
    table: 'habitCompletions',
    label: 'Réalisations',
    description: 'Les jours où chaque habitude a été cochée.',
    sensitive: false,
  },
  {
    table: 'challenges',
    label: 'Challenges',
    description: 'Tes parcours courts, étapes et jalons compris.',
    sensitive: false,
  },
  {
    table: 'journal',
    label: 'Journal',
    description: 'Tes textes personnels. La table la plus intime de ZENTIQ.',
    sensitive: true,
  },
  {
    table: 'favorites',
    label: 'Favoris',
    description: "Ce que tu as gardé de la bibliothèque.",
    sensitive: false,
  },
  {
    table: 'quotes',
    label: 'Citations',
    description: "Contenu fourni par ZENTIQ, identique pour tout le monde.",
    sensitive: false,
  },
  {
    table: 'affirmations',
    label: 'Affirmations',
    description: "Contenu fourni par ZENTIQ.",
    sensitive: false,
  },
  {
    table: 'music',
    label: 'Musique',
    description: "Références d'écoute fournies par ZENTIQ.",
    sensitive: false,
  },
];

/**
 * Estimation de ce qu'un export sélectionné contiendrait.
 * Ne lit que des compteurs — aucun enregistrement n'est chargé.
 */
export async function estimateExport(tables: TableName[]): Promise<{
  counts: Record<string, number>;
  total: number;
}> {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const table of tables) {
    const count = await db.table(table).count();
    counts[table] = count;
    total += count;
  }

  return { counts, total };
}

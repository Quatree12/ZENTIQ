import { APP_VERSION } from '@/app/app-config';
import { db, PROFILE_ID, SETTINGS_ID, writeMeta } from '@/database/db';
import { EXPORTABLE_TABLES, META_KEYS, type BackupDocument } from '@/database/schema';
import { nowIso, todayKey } from '@/utils/dates';

/**
 * Export des données locales.
 *
 * L'export est un fichier JSON que l'utilisateur télécharge lui-même. Aucun
 * envoi réseau n'a lieu : c'est le seul moyen de sortir ses données de
 * l'appareil, et il reste entièrement sous son contrôle.
 */

export interface ExportOptions {
  /** Inclure le journal personnel (privé par nature). */
  includeJournal?: boolean;
  /** Inclure les contenus inspirants mis en cache. */
  includeContent?: boolean;
}

/** Construit le document de sauvegarde complet. */
export async function buildBackupDocument(options: ExportOptions = {}): Promise<BackupDocument> {
  const { includeJournal = true, includeContent = true } = options;

  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  for (const table of EXPORTABLE_TABLES) {
    if (!includeJournal && table === 'journal') {
      counts[table] = 0;
      continue;
    }
    if (!includeContent && (table === 'quotes' || table === 'affirmations' || table === 'music')) {
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

  await writeMeta(META_KEYS.lastBackupAt, nowIso());
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

  return { counts: { ...counts, profilConfigure: hasProfile ? 1 : 0, reglages: hasSettings ? 1 : 0 }, total };
}

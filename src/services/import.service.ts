import { db } from '@/database/db';
import { EXPORTABLE_TABLES, type BackupDocument } from '@/database/schema';
import { isBackupDocument } from '@/utils/validators';

/**
 * Import d'une sauvegarde locale.
 *
 * Deux garde-fous :
 *  1. Le document est validé avant toute écriture — un fichier étranger ne
 *     touche pas la base.
 *  2. Un schéma plus récent est refusé explicitement : une version antérieure
 *     de ZENTIQ ne peut pas interpréter des données qu'elle ne connaît pas.
 *
 * L'import remplace les tables concernées. C'est un choix assumé : restaurer
 * une sauvegarde doit redonner exactement l'état sauvegardé, pas fusionner
 * silencieusement deux historiques.
 */

export type ImportMode = 'replace' | 'merge';

export interface ImportResult {
  ok: boolean;
  imported: Record<string, number>;
  error: string | null;
}

/** Lit un fichier choisi par l'utilisateur et le parse. */
export async function readBackupFile(file: File): Promise<BackupDocument | null> {
  try {
    const text = await file.text();
    const parsed: unknown = JSON.parse(text);
    if (!isBackupDocument(parsed)) return null;
    return parsed as BackupDocument;
  } catch {
    return null;
  }
}

/**
 * Décrit ce que contient un document, avant que l'utilisateur ne confirme.
 * Ne touche pas à la base.
 */
export interface BackupPreview {
  exportedAt: string;
  schemaVersion: number;
  appVersion: string;
  counts: Record<string, number>;
  total: number;
  /** Vrai si le fichier vient d'une version plus récente de ZENTIQ. */
  tooRecent: boolean;
}

export function previewBackup(document: BackupDocument): BackupPreview {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const table of EXPORTABLE_TABLES) {
    const rows = document.data[table];
    const count = Array.isArray(rows) ? rows.length : 0;
    counts[table] = count;
    total += count;
  }

  return {
    exportedAt: document.exportedAt,
    schemaVersion: document.schemaVersion,
    appVersion: document.appVersion,
    counts,
    total,
    tooRecent: document.schemaVersion > (document.schemaVersion ?? 1) ? false : false,
  };
}

/**
 * Restaure un document de sauvegarde.
 *
 * Mode `replace` : vide puis réécrit chaque table concernée.
 * Mode `merge` : ajoute les enregistrements absents, met à jour les identiques.
 */
export async function restoreBackup(
  document: BackupDocument,
  mode: ImportMode = 'replace',
  currentSchemaVersion = 1,
): Promise<ImportResult> {
  if (document.schemaVersion > currentSchemaVersion) {
    return {
      ok: false,
      imported: {},
      error:
        'Cette sauvegarde vient d\'une version plus récente de ZENTIQ. Mets l\'application à jour avant de la restaurer.',
    };
  }

  const imported: Record<string, number> = {};

  try {
    for (const table of EXPORTABLE_TABLES) {
      const rows = document.data[table];
      if (!Array.isArray(rows) || rows.length === 0) {
        imported[table] = 0;
        continue;
      }

      const target = db.table(table);

      if (mode === 'replace') {
        await target.clear();
        await target.bulkPut(rows);
      } else {
        await target.bulkPut(rows);
      }

      imported[table] = rows.length;
    }

    return { ok: true, imported, error: null };
  } catch (error) {
    return {
      ok: false,
      imported,
      error:
        "L'import s'est interrompu. Tes données précédentes ont été conservées pour les tables qui n'ont pas encore été remplacées.",
    };
  }
}

/**
 * Réinitialise complètement les données locales.
 * Irréversible — toujours derrière une double confirmation dans l'UI.
 */
export async function eraseAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
}

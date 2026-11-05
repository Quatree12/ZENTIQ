/**
 * Rappel de sauvegarde.
 *
 * POURQUOI CE SERVICE
 * -------------------
 * Le reglage `autoBackupReminder` existait dans les preferences, etait
 * persiste, et n'etait lu par PERSONNE. C'est le meme defaut qu'a eu
 * « Affichage compact » avant correction : une preference sans consommateur.
 *
 * CE QUE CE SERVICE FAIT, ET CE QU'IL NE FAIT PAS
 * -----------------------------------------------
 * Il ne sauvegarde RIEN automatiquement. Une sauvegarde automatique en
 * arriere-plan serait trompeuse : l'utilisateur croirait ses donnees a l'abri
 * alors que le fichier dormirait dans un dossier de telechargements qu'il ne
 * connait pas. L'export reste un geste volontaire, declenche d'un toucher.
 *
 * Il dit seulement QUAND la derniere sauvegarde date assez pour qu'on le
 * signale. Le rappel ne s'affiche jamais sur une base vide : proposer de
 * sauvegarder rien n'aurait pas de sens.
 */

import { db, readMeta } from '@/database/db';
import { META_KEYS } from '@/database/schema';
import type { UserSettings } from '@/types';
import { daysBetween, todayKey } from '@/utils/dates';

/** Nombre de jours avant de suggerer une sauvegarde. */
export const BACKUP_REMINDER_AFTER_DAYS = 14;

export interface BackupReminder {
  /** Vrai si le rappel doit etre affiche. */
  shouldSuggest: boolean;
  /** Date de la derniere sauvegarde, `YYYY-MM-DD`. `null` si jamais faite. */
  lastBackupDate: string | null;
  /** Jours ecoules depuis, `null` si aucune sauvegarde. */
  daysSince: number | null;
  /** Phrase affichee a l'utilisateur, quand il y a lieu. */
  message: string | null;
}

/**
 * Evalue s'il faut suggerer une sauvegarde.
 *
 * Renvoie `shouldSuggest: false` quand :
 *   - le reglage est desactive par l'utilisateur ;
 *   - la base est vide (rien a sauvegarder) ;
 *   - la derniere sauvegarde date de moins de 14 jours.
 */
export async function evaluateBackupReminder(settings: UserSettings): Promise<BackupReminder> {
  const empty: BackupReminder = {
    shouldSuggest: false,
    lastBackupDate: null,
    daysSince: null,
    message: null,
  };

  // Le reglage n'est pas encore charge, ou l'utilisateur l'a desactive.
  if (!settings.autoBackupReminder) return empty;

  // Une base vide n'a rien a sauvegarder : on ne sollicite personne pour rien.
  const [moodCount, habitCount, journalCount, goalCount, challengeCount] = await Promise.all([
    db.moods.count(),
    db.habits.count(),
    db.journal.count(),
    db.goals.count(),
    db.challenges.count(),
  ]);

  const total = moodCount + habitCount + journalCount + goalCount + challengeCount;
  if (total === 0) return empty;

  const lastBackupRaw = await readMeta<string>(META_KEYS.lastBackupAt);
  const lastBackupDate = lastBackupRaw ? lastBackupRaw.slice(0, 10) : null;

  if (lastBackupDate === null) {
    return {
      shouldSuggest: true,
      lastBackupDate: null,
      daysSince: null,
      message:
        "Tu n'as pas encore exporte de sauvegarde. Tes donnees vivent uniquement sur cet appareil : un fichier exporte te permettrait de les retrouver si tu changes de telephone.",
    };
  }

  const daysSince = daysBetween(lastBackupDate, todayKey());
  if (daysSince < BACKUP_REMINDER_AFTER_DAYS) {
    return { shouldSuggest: false, lastBackupDate, daysSince, message: null };
  }

  return {
    shouldSuggest: true,
    lastBackupDate,
    daysSince,
    message:
      'Ta derniere sauvegarde date de ' +
      daysSince +
      ' jours. Un export te prendrait quelques secondes.',
  };
}

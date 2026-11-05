/**
 * Rappel de sauvegarde.
 *
 * POURQUOI CE SERVICE
 * -------------------
 * Le réglage `autoBackupReminder` existait dans les préférences, était
 * persisté, et n'était lu par PERSONNE. C'est le même défaut qu'a eu
 * « Affichage compact » avant correction : une préférence sans consommateur.
 *
 * CE QUE CE SERVICE FAIT, ET CE QU'IL NE FAIT PAS
 * -----------------------------------------------
 * Il ne sauvegarde RIEN automatiquement. Une sauvegarde automatique en
 * arrière-plan serait trompeuse : l'utilisateur croirait ses données à l'abri
 * alors que le fichier dormirait dans un dossier de téléchargements qu'il ne
 * connaît pas. L'export reste un geste volontaire, déclenché d'un toucher.
 *
 * Il dit seulement QUAND la dernière sauvegarde date assez pour qu'on le
 * signale. Le rappel ne s'affiche jamais sur une base vide : proposer de
 * sauvegarder rien n'aurait pas de sens.
 */

import { db, readMeta } from '@/database/db';
import { META_KEYS } from '@/database/schema';
import type { UserSettings } from '@/types';
import { daysBetween, todayKey } from '@/utils/dates';

/** Nombre de jours avant de suggérer une sauvegarde. */
export const BACKUP_REMINDER_AFTER_DAYS = 14;

export interface BackupReminder {
  /** Vrai si le rappel doit être affiché. */
  shouldSuggest: boolean;
  /** Date de la dernière sauvegarde, `YYYY-MM-DD`. `null` si jamais faite. */
  lastBackupDate: string | null;
  /** Jours écoulés depuis, `null` si aucune sauvegarde. */
  daysSince: number | null;
  /** Phrase affichée à l'utilisateur, quand il y a lieu. */
  message: string | null;
}

/**
 * Évalue s'il faut suggérer une sauvegarde.
 *
 * Renvoie `shouldSuggest: false` quand :
 *   - le réglage est désactivé par l'utilisateur ;
 *   - la base est vide (rien à sauvegarder) ;
 *   - la dernière sauvegarde date de moins de 14 jours.
 */
export async function evaluateBackupReminder(settings: UserSettings): Promise<BackupReminder> {
  const empty: BackupReminder = {
    shouldSuggest: false,
    lastBackupDate: null,
    daysSince: null,
    message: null,
  };

  // Le réglage n'est pas encore chargé, ou l'utilisateur l'a désactivé.
  if (!settings.autoBackupReminder) return empty;

  // Une base vide n'a rien à sauvegarder : on ne sollicite personne pour rien.
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
        "Tu n'as pas encore exporté de sauvegarde. Tes données vivent uniquement sur cet appareil : un fichier exporté te permettrait de les retrouver si tu changes de téléphone.",
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
      'Ta dernière sauvegarde date de ' +
      daysSince +
      ' jours. Un export te prendrait quelques secondes.',
  };
}

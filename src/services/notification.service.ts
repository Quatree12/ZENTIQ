import type { UserSettings } from '@/types';
import { fromDateKey, nextAllowedDay, todayKey } from '@/utils/dates';

/**
 * Notifications locales.
 *
 * AUCUNE notification push n'est implementee : il n'y a pas de serveur, donc
 * pas d'envoi a distance. Ce service prepare et programme des rappels locaux
 * via l'API Notification.
 *
 * TROIS SITUATIONS, ET POURQUOI LES DISTINGUER
 * --------------------------------------------
 * 1. `Notification` absent de `window`. Sur iOS, ce cas couvre DEUX realites
 *    tres differentes que le mot « non pris en charge » confondait :
 *      - un onglet Safari ordinaire, ou l'API n'est jamais exposee ;
 *      - une fenetre de navigation privee, ou elle est coupee.
 *    Dans les deux cas, l'API reste accessible SI l'application est ajoutee a
 *    l'ecran d'accueil : Safari ne l'expose qu'aux web apps installees.
 *
 * 2. `Notification.permission === 'denied'` : l'utilisateur a refuse, ou le
 *    reglage du systeme bloque. Il doit agir dans les reglages, pas ici.
 *
 * 3. Autorisation accordee : le rappel peut etre planifie, mais iOS ne sait
 *    pas le declencher application fermee. L'ecran le dit.
 *
 * Le message affiche decrit donc la SITUATION, et surtout l'ACTION a faire.
 * Dire « ce navigateur ne prend pas en charge les notifications » etait exact
 * au sens technique, mais n'aidait personne : le navigateur les prend en
 * charge, c'est le mode d'acces qui n'y donne pas droit.
 */

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

/** Etat actuel de l'autorisation de notification. */
export function getPermissionState(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as PermissionState;
}

/** Demande l'autorisation. Renvoie l'etat obtenu. */
export async function requestPermission(): Promise<PermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    const permission = await Notification.requestPermission();
    return permission as PermissionState;
  } catch {
    return 'denied';
  }
}

/** Vrai si un rappel peut effectivement etre affiche. */
export function canNotify(): boolean {
  return getPermissionState() === 'granted';
}

/**
 * Vrai si le navigateur sait planifier une notification a heure fixe.
 * Sur iOS, l'API existe mais reste limitee : teste et documente a l'ecran.
 */
export function supportsScheduledNotifications(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  return 'showTrigger' in (window as unknown as Record<string, unknown>);
}

/**
 * Vrai si une web app installee est detectee (mode standalone).
 * Sert a formuler le bon conseil : installer d'abord, ou autoriser ensuite.
 */
export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;
  return Boolean(standalone || iosStandalone);
}

/** Message de rappel — encourageant, jamais culpabilisant. */
const REMINDER_MESSAGES = [
  "Un petit pas aujourd'hui suffit.",
  'Ton rythme compte plus que ta vitesse.',
  'Prends une minute pour toi.',
  'Tu avances, meme tranquillement.',
];

/** Affiche une notification immediate. */
export function notifyNow(title = 'ZENTIQ', body?: string): boolean {
  if (!canNotify()) return false;
  const message =
    body ?? REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)] ?? '';
  try {
    new Notification(title, {
      body: message,
      icon: '/icons/icon-192.png',
      tag: 'zentiq-reminder',
    });
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------------
   Planification en session
   -------------------------------------------------------------------------- */

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Programme le prochain rappel selon les reglages.
 * Annule toute planification precedente : un seul rappel est en attente.
 */
export function scheduleDailyReminder(settings: UserSettings): void {
  cancelScheduledReminder();

  if (!settings.dailyReminderEnabled || !canNotify()) return;

  const target = resolveNextOccurrence(
    new Date(),
    parseHours(settings.dailyReminderTime),
    parseMinutes(settings.dailyReminderTime),
    settings.dailyReminderDays,
  );

  if (!target) return;
  const delay = target.getTime() - Date.now();

  // Au-dela de 24 h, on ne garde pas de minuteur en memoire : il sera
  // reprogramme a la prochaine ouverture.
  if (delay <= 0 || delay > 86_400_000) return;

  scheduledTimer = setTimeout(() => {
    notifyNow();
    scheduledTimer = null;
  }, delay);
}

/** Annule le rappel en attente. */
export function cancelScheduledReminder(): void {
  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

/** Heure « HH:mm » parsee, avec repli sur 8 h. */
function parseHours(time: string): number {
  const value = Number(time.split(':')[0] ?? 8);
  return Number.isFinite(value) ? value : 8;
}

/** Minutes « HH:mm » parsees, avec repli sur 0. */
function parseMinutes(time: string): number {
  const value = Number(time.split(':')[1] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Prochaine occurrence du rappel, en respectant les jours autorises.
 *
 * Renvoie `null` quand aucun jour n'est autorise : sans jour, il n'y a pas de
 * prochaine occurrence, et inventer « demain » contredirait le reglage.
 */
function resolveNextOccurrence(
  now: Date,
  hours: number,
  minutes: number,
  allowedDays: number[],
): Date | null {
  if (allowedDays.length === 0) return null;

  const today = todayKey();
  const candidate = fromDateKey(nextAllowedDay(today, allowedDays));
  candidate.setHours(hours, minutes, 0, 0);

  if (candidate.getTime() > now.getTime()) return candidate;

  // L'heure est passee : on cherche la prochaine occurrence STRICTEMENT apres
  // aujourd'hui, sinon on reviendrait sur la meme journee.
  let cursor = shiftKey(today, 1);
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const key = nextAllowedDay(cursor, allowedDays);
    const shifted = fromDateKey(key);
    shifted.setHours(hours, minutes, 0, 0);
    if (shifted.getTime() > now.getTime()) return shifted;
    cursor = shiftKey(key, 1);
  }

  return null;
}

/** Decalage de cle de jour, sans dependre d'un import supplementaire. */
function shiftKey(key: string, delta: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + delta);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Message d'etat affiche dans les preferences.
 *
 * Il decrit la SITUATION REELLE et l'ACTION a faire — jamais « non pris en
 * charge », qui laissait croire a une limite du navigateur alors qu'il s'agit
 * d'un mode d'acces.
 */
export function describeReminderStatus(settings: UserSettings): string {
  const permission = getPermissionState();

  if (permission === 'unsupported') {
    return isInstalled()
      ? "Les notifications sont indisponibles sur cet appareil. Le reste de l'application fonctionne normalement."
      : "Pour recevoir un rappel, ajoute d'abord ZENTIQ a ton ecran d'accueil : Safari ne donne acces aux notifications qu'aux applications installees. Le reste fonctionne sans cela.";
  }
  if (permission === 'denied') {
    return 'Les notifications sont bloquees pour ZENTIQ. Autorise-les dans les reglages du navigateur ou du systeme, puis reviens ici.';
  }
  if (!settings.dailyReminderEnabled) {
    return 'Rappel quotidien desactive. Active-le pour recevoir un message aux jours choisis.';
  }
  if (permission === 'default') {
    return "Autorise les notifications pour activer le rappel quotidien a l'heure choisie.";
  }
  if (settings.dailyReminderDays.length === 0) {
    return 'Aucun jour selectionne : choisis au moins un jour pour que le rappel puisse se declencher.';
  }

  // On distingue les deux comportements reels, sans laisser croire au premier
  // quand c'est le second qui s'appliquera.
  if (!supportsScheduledNotifications()) {
    return `Rappel actif a ${settings.dailyReminderTime}. Sur cet appareil, il s'affiche quand ZENTIQ est ouvert — les rappels en arriere-plan ne sont pas disponibles ici.`;
  }

  return `Rappel actif a ${settings.dailyReminderTime}. Il s'affiche aux jours choisis, meme si l'application est fermee sur cet appareil.`;
}

/** Resume des jours choisis, pour l'affichage compact des preferences. */
export function describeReminderDays(days: number[]): string {
  if (days.length === 0) return 'Aucun jour';
  if (days.length === 7) return 'Tous les jours';

  const ordered = [...days].sort((a, b) => a - b);
  const isWeekdays = ordered.join(',') === '1,2,3,4,5';
  if (isWeekdays) return 'Du lundi au vendredi';

  const labels = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
  return ordered.map((day) => labels[day] ?? '').join(' ').trim();
}

import type { UserSettings } from '@/types';
import { fromDateKey, nextAllowedDay, todayKey } from '@/utils/dates';

/**
 * Notifications locales.
 *
 * AUCUNE notification push n'est implémentée : il n'y a pas de serveur, donc
 * pas d'envoi à distance. Ce service prépare et programme des rappels locaux
 * via l'API Notification + un minuteur en page.
 *
 * Limite assumée et documentée : un rappel ne peut se déclencher que lorsque
 * l'application est ouverte (ou en arrière-plan récent). Pour des rappels
 * fiables à heure fixe, il faudrait une notification planifiée par le système,
 * prévue dans une phase ultérieure.
 */

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

/** État actuel de l'autorisation de notification. */
export function getPermissionState(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as PermissionState;
}

/** Demande l'autorisation. Renvoie l'état obtenu. */
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

/** Vrai si un rappel peut effectivement être affiché. */
export function canNotify(): boolean {
  return getPermissionState() === 'granted';
}

/** Message de rappel — encourageant, jamais culpabilisant. */
const REMINDER_MESSAGES = [
  'Un petit pas aujourd\'hui suffit.',
  'Ton rythme compte plus que ta vitesse.',
  'Prends une minute pour toi.',
  'Tu avances, même tranquillement.',
];

/** Affiche une notification immédiate. */
export function notifyNow(title = 'ZENTIQ', body?: string): boolean {
  if (!canNotify()) return false;
  const message = body ?? REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)] ?? '';
  try {
    new Notification(title, { body: message, icon: '/icons/icon-192.png', tag: 'zentiq-reminder' });
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
 * Programme le prochain rappel selon les réglages.
 * Annule toute planification précédente : un seul rappel est en attente.
 */
export function scheduleDailyReminder(settings: UserSettings): void {
  cancelScheduledReminder();

  if (!settings.dailyReminderEnabled || !canNotify()) return;

  const [rawHours, rawMinutes] = settings.dailyReminderTime.split(':');
  const hours = Number(rawHours ?? 8);
  const minutes = Number(rawMinutes ?? 0);

  const now = new Date();
  const target = resolveNextOccurrence(now, hours, minutes, settings.dailyReminderDays);
  const delay = target.getTime() - now.getTime();

  // Au-delà de 24 h, on ne garde pas de minuteur en mémoire : il sera
  // reprogrammé à la prochaine ouverture.
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

/** Prochaine occurrence du rappel, en respectant les jours autorisés. */
function resolveNextOccurrence(
  now: Date,
  hours: number,
  minutes: number,
  allowedDays: number[],
): Date {
  const dayKey = nextAllowedDay(todayKey(), allowedDays);
  const candidate = fromDateKey(dayKey);
  candidate.setHours(hours, minutes, 0, 0);

  // Si l'heure est déjà passée aujourd'hui, on vise la prochaine occurrence.
  if (candidate.getTime() <= now.getTime()) {
    const tomorrow = nextAllowedDay(dayKey, allowedDays);
    const shifted = fromDateKey(tomorrow === dayKey ? dayKey : tomorrow);
    shifted.setHours(hours, minutes, 0, 0);
    if (tomorrow === dayKey) shifted.setDate(shifted.getDate() + 1);
    return shifted;
  }

  return candidate;
}

/**
 * Message d'état affiché dans les préférences : explique ce qui se passera
 * réellement, sans promettre plus que ce qui est implémenté.
 */
export function describeReminderStatus(settings: UserSettings): string {
  const permission = getPermissionState();

  if (permission === 'unsupported') {
    return "Ce navigateur ne prend pas en charge les notifications. Le reste de l'application fonctionne normalement.";
  }
  if (!settings.dailyReminderEnabled) {
    return 'Rappel quotidien désactivé. Active-le pour recevoir un message aux jours choisis.';
  }
  if (permission === 'denied') {
    return "Les notifications sont bloquées dans ton navigateur. Autorise-les dans les réglages du site pour recevoir le rappel.";
  }
  if (permission === 'default') {
    return "Autorise les notifications pour activer le rappel quotidien à l'heure choisie.";
  }
  return `Rappel actif à ${settings.dailyReminderTime}. Il s'affiche lorsque ZENTIQ est ouvert.`;
}

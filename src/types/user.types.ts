import type { BaseEntity } from './index';

/**
 * Profil local de l'utilisateur.
 *
 * ZENTIQ n'a pas de compte : le profil décrit une personne, il ne l'authentifie
 * pas. Un seul profil existe à la fois (singleton), identifié par
 * `appConfig.singletonIds.profile`.
 */
export interface UserProfile extends BaseEntity {
  /** Prénom affiché. Vide tant que l'onboarding n'a pas eu lieu. */
  firstName: string;
  /** Intention personnelle — « pourquoi je suis ici ». Facultative. */
  intention: string;
  /** Date d'arrivée dans l'application (ISO), sert à mesurer l'accompagnement. */
  startedAt: string;
  /** Date de naissance, facultative, jamais requise. */
  birthDate?: string;
}

/**
 * Préférences d'expérience et d'accessibilité.
 * Singleton, identifié par `appConfig.singletonIds.settings`.
 */
export interface UserSettings extends BaseEntity {
  /** Thème d'accent visuel (les deux directions de la DA). */
  accentTheme: 'teal' | 'lavender';
  /** Densité de l'interface. */
  density: 'comfortable' | 'compact';
  /** Réduire les animations, indépendamment du réglage système. */
  reduceMotion: boolean;
  /** Afficher les citations de manière plus large (confort de lecture). */
  largeReadableText: boolean;
  /** Rappels quotidiens souhaités. */
  dailyReminderEnabled: boolean;
  /** Heure du rappel, format HH:mm. */
  dailyReminderTime: string;
  /** Jours de rappel (0 = dimanche, 6 = samedi). */
  dailyReminderDays: number[];
  /** Semaine commençant le lundi (convention locale CH/FR). */
  weekStartsOnMonday: boolean;
  /** Format d'heure 24 h affiché par défaut. */
  use24HourClock: boolean;
  /** Export automatique de sauvegarde périodique (local uniquement). */
  autoBackupReminder: boolean;
}

export const DEFAULT_SETTINGS_VALUES = {
  accentTheme: 'teal',
  density: 'comfortable',
  reduceMotion: false,
  largeReadableText: false,
  dailyReminderEnabled: false,
  dailyReminderTime: '08:00',
  dailyReminderDays: [1, 2, 3, 4, 5] as number[],
  weekStartsOnMonday: true,
  use24HourClock: true,
  autoBackupReminder: true,
} as const;

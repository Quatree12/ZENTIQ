/**
 * Configuration globale de ZENTIQ.
 *
 * Centralisée ici pour que les phases suivantes n'aient jamais à chasser des
 * littéraux éparpillés dans les composants.
 */

export const APP_NAME = 'ZENTIQ' as const;
export const APP_TAGLINE = 'Your mind. Your momentum.' as const;
export const APP_VERSION = '0.1.0' as const;

export const appConfig = {
  name: APP_NAME,
  tagline: APP_TAGLINE,
  version: APP_VERSION,

  /** Clés de stockage local hors IndexedDB (préférences de rendu léger) */
  storageKeys: {
    settings: 'zentiq:settings',
    lastRoute: 'zentiq:last-route',
  },

  /** Identifiants des singletons stockés en base */
  singletonIds: {
    profile: 'local-profile',
    settings: 'local-settings',
  },

  /** Limites de saisie — évitent les données absurdes, sans être punitives */
  limits: {
    journalMaxLength: 8000,
    goalTitleMaxLength: 140,
    habitNameMaxLength: 80,
    moodNoteMaxLength: 400,
  },

  /** Durée d'affichage des notifications transitoires */
  toastDurationMs: 4200,
} as const;

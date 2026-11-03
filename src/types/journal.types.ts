import type { BaseEntity, MoodLevel } from './index';

/**
 * Entrée de journal.
 *
 * Le journal est privé par essence : aucune entrée n'est jamais partagée ni
 * envoyée. Le `mood` associé est facultatif pour ne pas forcer l'analyse de
 * soi à chaque écriture.
 */
export interface JournalEntry extends BaseEntity {
  /** Jour de rédaction, `YYYY-MM-DD` (index). */
  date: string;
  /** Titre court, facultatif. */
  title: string;
  /** Contenu libre. */
  content: string;
  /** Humeur au moment de l'écriture, si renseignée. */
  mood?: MoodLevel;
  /** Étiquettes personnelles (thèmes, personnes, projets). */
  tags: string[];
  /** Épinglé pour le retrouver facilement. */
  pinned: boolean;
}

/** Point d'une timeline d'évolution personnelle. */
export interface TimelinePoint {
  id: string;
  /** Date `YYYY-MM-DD`. */
  date: string;
  /** Nature de l'événement — pilote l'icône et la couleur. */
  kind: 'mood' | 'goal' | 'habit' | 'challenge' | 'journal';
  /** Texte affiché. */
  label: string;
  /** Complément facultatif. */
  detail?: string;
}

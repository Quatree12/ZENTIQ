import type { BaseEntity } from './index';

/** Fréquence attendue d'une habitude. */
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

/**
 * Habitude à ancrer.
 *
 * L'idée produit : valoriser la régularité sans punir les interruptions.
 * `archived` permet de mettre une habitude de côté sans perdre l'historique.
 */
export interface Habit extends BaseEntity {
  name: string;
  /** Intention courte : « pour quoi » je fais cette habitude. */
  intention: string;
  frequency: HabitFrequency;
  /** Jours visés (0 = dimanche … 6 = samedi) quand `frequency === 'custom'`. */
  targetDays: number[];
  /** Objectif auquel cette habitude contribue, si applicable. */
  goalId?: string;
  /** Nombre de réalisations visé par semaine. `null` = libre. */
  weeklyTarget: number | null;
  /** Icône Lucide choisie pour la reconnaître d'un coup d'œil. */
  icon: string;
  /** Couleur d'accent, token du design system. */
  accent: 'teal' | 'lavender';
  archived: boolean;
}

/**
 * Une coche d'habitude pour un jour donné.
 *
 * L'index composé `[habitId+date]` garantit l'unicité logique
 * (une réalisation par habitude et par jour).
 */
export interface HabitCompletion extends BaseEntity {
  habitId: string;
  /** Jour de la réalisation, `YYYY-MM-DD`. */
  date: string;
  /** Note facultative (« difficile aujourd'hui », « facile »). */
  note?: string;
}

/** Cycle de vie d'un challenge. */
export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'abandoned';

/**
 * Challenge multi-jours (7 jours, 21 jours…).
 *
 * Un challenge n'échoue jamais : il peut être terminé ou mis de côté, jamais
 * « raté ». C'est une règle d'expérience, reflétée dans les libellés.
 */
export interface Challenge extends BaseEntity {
  title: string;
  description: string;
  /** Durée en jours. */
  durationDays: number;
  /** Date de début `YYYY-MM-DD`, facultative tant qu'il n'est pas lancé. */
  startDate?: string;
  status: ChallengeStatus;
  /** Nombre de jours validés. */
  daysCompleted: number;
  /** Habitude liée, si le challenge s'appuie sur une routine existante. */
  habitId?: string;
}

export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: 'Tous les jours',
  weekly: 'Chaque semaine',
  custom: 'Jours choisis',
};

export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, string> = {
  upcoming: 'À venir',
  active: 'En cours',
  completed: 'Terminé',
  abandoned: 'Mis de côté',
};

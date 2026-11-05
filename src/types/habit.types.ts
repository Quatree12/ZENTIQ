import type { BaseEntity } from './index';

/** Frequence attendue d'une habitude. */
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

/**
 * Habitude a ancrer.
 *
 * L'idee produit : valoriser la regularite sans punir les interruptions.
 * `archived` permet de mettre une habitude de cote sans perdre l'historique.
 */
export interface Habit extends BaseEntity {
  name: string;
  /** Intention courte : « pour quoi » je fais cette habitude. */
  intention: string;
  frequency: HabitFrequency;
  /** Jours vises (0 = dimanche … 6 = samedi) quand `frequency === 'custom'`. */
  targetDays: number[];
  /** Objectif auquel cette habitude contribue, si applicable. */
  goalId?: string;
  /** Nombre de realisations vise par semaine. `null` = libre. */
  weeklyTarget: number | null;
  /** Icone Lucide choisie pour la reconnaitre d'un coup d'oeil. */
  icon: string;
  /** Couleur d'accent, token du design system. */
  accent: 'teal' | 'lavender';
  archived: boolean;
}

/**
 * Une coche d'habitude pour un jour donne.
 *
 * L'index compose `[habitId+date]` garantit l'unicite logique
 * (une realisation par habitude et par jour).
 */
export interface HabitCompletion extends BaseEntity {
  habitId: string;
  /** Jour de la realisation, `YYYY-MM-DD`. */
  date: string;
  /** Note facultative (« difficile aujourd'hui », « facile »). */
  note?: string;
}

/* ==========================================================================
   CHALLENGES
   ========================================================================== */

/**
 * Cycle de vie d'un challenge.
 *
 * QUATRE ETATS, et non cinq : `paused` n'existe pas, car il ferait double
 * emploi avec `abandoned` (« mis de cote »). Un challenge peut aussi etre
 * `upcoming` — cree avec une date de debut future.
 *
 * Regle produit : un challenge n'echoue jamais. Il peut etre termine ou mis de
 * cote, jamais « rate ».
 */
export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'abandoned';

/**
 * Une action quotidienne d'un challenge.
 *
 * Un challenge porte N etapes, une par jour. Elles sont ecrites a la creation
 * (a partir de la liste fournie), puis completees une par une au fil des jours.
 */
export interface ChallengeDay {
  /** Numero du jour dans le challenge, a partir de 1. */
  dayNumber: number;
  /** Libelle de l'action du jour. */
  label: string;
  /** Jour ou l'etape a ete cochee, `YYYY-MM-DD`. Absent si non faite. */
  completedAt?: string;
}

/**
 * Challenge multi-jours (3, 7, 14, 21 ou 30 jours).
 *
 * LA PROGRESSION N'EST PAS STOCKEE : elle se deduit des etapes completees.
 * `daysCompleted` existe pour eviter de recalculer un compteur a chaque rendu,
 * mais il est toujours derive de `days` par le repository — jamais saisi a la
 * main. C'est ce qui garantit qu'aucune progression fictive ne peut apparaitre.
 */
export interface Challenge extends BaseEntity {
  title: string;
  description: string;
  /** Duree en jours (3, 7, 14, 21 ou 30). */
  durationDays: number;
  /** Objectif personnel du challenge — « pourquoi je le fais ». */
  goal: string;
  /** Jour de depart `YYYY-MM-DD`. */
  startDate: string;
  /**
   * Dernier jour du challenge, `YYYY-MM-DD`.
   * Deduit de `startDate` + `durationDays - 1` : le challenge dure N jours,
   * jour de depart inclus.
   */
  endDate: string;
  status: ChallengeStatus;
  /** Nombre de jours valides — derive de `days`, jamais saisi. */
  daysCompleted: number;
  /** Les etapes quotidiennes. Longueur = `durationDays`. */
  days: ChallengeDay[];
  /** Jour de completion, renseigne quand le statut passe a `completed`. */
  completedAt?: string;
  /** Habitude liee, si le challenge s'appuie sur une routine existante. */
  habitId?: string;
}

/**
 * Calcul de la progression d'un challenge, 0..100.
 * Renvoie `null` si la duree est invalide, pour ne jamais afficher un faux 0 %.
 */
export function challengeProgress(
  challenge: Pick<Challenge, 'days' | 'durationDays'>,
): number | null {
  if (challenge.durationDays <= 0) return null;
  const done = challenge.days.filter((day) => day.completedAt !== undefined).length;
  return Math.min(100, Math.round((done / challenge.durationDays) * 100));
}

export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: 'Tous les jours',
  weekly: 'Chaque semaine',
  custom: 'Jours choisis',
};

export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, string> = {
  upcoming: 'A venir',
  active: 'En cours',
  completed: 'Termine',
  abandoned: 'Mis de cote',
};

/** Durees proposees a la creation, du plus court au plus long. */
export const CHALLENGE_DURATIONS = [3, 7, 14, 21, 30] as const;

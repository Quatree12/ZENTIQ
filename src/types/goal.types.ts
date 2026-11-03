import type { BaseEntity } from './index';

/** Cycle de vie d'un objectif. Volontairement simple. */
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';

/** Horizon temporel — aide à calibrer sans mettre de pression. */
export type GoalHorizon = 'short' | 'medium' | 'long';

/**
 * Objectif personnel.
 *
 * ZENTIQ n'affiche jamais de comparaison entre utilisateurs : la progression
 * est celle de la personne, pas un classement.
 */
export interface Goal extends BaseEntity {
  /** Formulation personnelle de l'objectif. */
  title: string;
  /** Pourquoi cet objectif compte. Soutient la motivation les jours creux. */
  motivation: string;
  status: GoalStatus;
  horizon: GoalHorizon;
  /** Date cible `YYYY-MM-DD`. Facultative : un objectif peut rester ouvert. */
  targetDate?: string;
  /** Avancement déclaré, 0 à 100. */
  progress: number;
  /** Marqué explicitement comme priorité du moment. */
  isPriority: boolean;
  /** Étape concrète suivante — rend l'objectif actionnable. */
  nextStep: string;
  /** Date de complétion, renseignée quand le statut passe à `completed`. */
  completedAt?: string;
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'En cours',
  paused: 'En pause',
  completed: 'Atteint',
  archived: 'Archivé',
};

export const GOAL_HORIZON_LABELS: Record<GoalHorizon, string> = {
  short: 'Court terme',
  medium: 'Moyen terme',
  long: 'Long terme',
};

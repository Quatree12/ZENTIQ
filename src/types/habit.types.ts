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
  /**
   * Derniere relecture de l'habitude, ISO 8601 ou `null`.
   *
   * Ajoute par la migration v2. L'interface ne s'en sert pas encore : le champ
   * est prepare pour un bilan periodique propose, jamais impose.
   */
  lastReviewedAt: string | null;
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

/* --------------------------------------------------------------------------
   RYTHMES DE CHALLENGE
   --------------------------------------------------------------------------
   Un challenge « classique » se suit jour apres jour. Mais tout ne se compte
   pas en jours consecutifs : certaines pratiques se vivent par semaine.

   `once`      — parcours lineaire, la forme historique
   `recurring` — N fois par periode (ex. 3 seances par semaine)
   `milestones`— avancement par etapes franchies, sans contrainte de calendrier

   LE RYTHME NE CHANGE RIEN A LA FACON DONT LA PROGRESSION EST CALCULEE :
   elle reste derivee des etapes reellement cochees. Le rythme dit seulement ce
   qu'on attend de l'utilisateur, et comment l'interface le decrit.
   -------------------------------------------------------------------------- */
export type ChallengeRhythm = 'once' | 'recurring' | 'milestones';

/**
 * Regle de rythme d'un challenge.
 *
 * `periodDays` reste facultatif et n'a de sens qu'avec `recurring` : c'est la
 * longueur de la periode sur laquelle `targetPerPeriod` est attendu.
 * Par defaut 7 — la semaine.
 */
export interface ChallengeRhythmConfig {
  rhythm: ChallengeRhythm;
  /** Nombre de realisations visees par periode (rythme `recurring`). */
  targetPerPeriod?: number;
  /** Longueur de la periode en jours (rythme `recurring`). Defaut : 7. */
  periodDays?: number;
}

/**
 * Un jalon : une etape intermediaire visible dans le parcours.
 *
 * Les jalons ne sont PAS des recompenses inventees. Chaque jalon porte un
 * `dayNumber` (ou un `milestoneIndex` pour un rythme sans calendrier) qui
 * correspond a une etape REELLE du challenge : un jalon se franchit quand ses
 * etapes sont faites, jamais autrement.
 */
export interface ChallengeMilestone {
  /** Position du jalon, 1 = premier du parcours. */
  index: number;
  /** Titre court, ecrit par l'utilisateur. */
  title: string;
  /**
   * Numero du DERNIER jour couvert par ce jalon.
   * Ex. un jalon « 1 semaine » sur un 21 jours couvre jusqu'au jour 7.
   */
  throughDay: number;
  /** Date de franchissement, `YYYY-MM-DD`. Absente tant qu'il n'est pas atteint. */
  reachedAt?: string;
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

  /* --- Champs ajoutes en v3 (migration : valeurs posees par defaut) ------- */

  /**
   * Rythme du challenge.
   * Absent sur les challenges crees avant la v3 : ils sont lus comme `once`,
   * ce qui est exactement ce qu'ils etaient.
   */
  rhythm?: ChallengeRhythm;
  /** Regle de rythme detaillee (uniquement si `rhythm === 'recurring'`). */
  rhythmConfig?: ChallengeRhythmConfig;
  /** Jalons du parcours. Absent = aucun jalon, le parcours reste lineaire. */
  milestones?: ChallengeMilestone[];
  /**
   * Jours de report accordes, `YYYY-MM-DD`.
   *
   * Un jour manque n'est JAMAIS une remise a zero : l'utilisateur peut decaler
   * son challenge. `endDate` est alors recalcule, et les jours reportes sont
   * conserves ici pour que l'historique reste lisible.
   */
  postponedDays?: number;
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

/* --------------------------------------------------------------------------
   LECTURE DU RYTHME
   -------------------------------------------------------------------------- */

/**
 * Rythme effectif d'un challenge.
 *
 * Un challenge sans `rhythm` est un challenge `once` : c'est la forme sous
 * laquelle tous les challenges existants ont ete crees. On ne leur invente pas
 * un rythme qu'ils n'avaient pas.
 */
export function challengeRhythm(challenge: Pick<Challenge, 'rhythm'>): ChallengeRhythm {
  return challenge.rhythm ?? 'once';
}

/** Duree de periode effective pour un rythme recurrent. */
export function rhythmPeriodDays(config?: ChallengeRhythmConfig): number {
  const value = config?.periodDays;
  if (value === undefined || value <= 0) return 7;
  return Math.round(value);
}

/**
 * Etapes attendues par periode.
 * `null` quand le rythme n'est pas recurrent, ou que la cible n'est pas fixee.
 */
export function rhythmTargetPerPeriod(config?: ChallengeRhythmConfig): number | null {
  const value = config?.targetPerPeriod;
  if (value === undefined || value <= 0) return null;
  return Math.round(value);
}

/**
 * Rythme tenu, ou non, pour la periode en cours.
 *
 * Renvoie `null` pour un rythme non recurrent : il n'y a rien a tenir.
 * `completed` compte les etapes faites dans la periode courante ; `target` est
 * l'objectif. L'interface en deduit « 2 sur 3 cette semaine » sans jamais
 * presenter un echec.
 */
export function rhythmStatus(
  challenge: Pick<Challenge, 'rhythm' | 'rhythmConfig' | 'days'>,
  reference: string,
): { completed: number; target: number } | null {
  if (challengeRhythm(challenge) !== 'recurring') return null;
  const target = rhythmTargetPerPeriod(challenge.rhythmConfig);
  if (target === null) return null;

  const period = rhythmPeriodDays(challenge.rhythmConfig);
  const start = shiftDaysLocal(reference, -(period - 1));

  const completed = challenge.days.filter(
    (day) => day.completedAt !== undefined && day.completedAt >= start && day.completedAt <= reference,
  ).length;

  return { completed, target };
}

/**
 * Decalage de date local, `YYYY-MM-DD`.
 *
 * Ecrit ici plutot qu'importe de `@/utils/dates` : un module de TYPES ne doit
 * dependre d'aucun autre module applicatif, sous peine de cycle d'import.
 */
function shiftDaysLocal(dateKey: string, delta: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
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

/** Libelles des rythmes, pour les filtres et les formulaires. */
export const CHALLENGE_RHYTHM_LABELS: Record<ChallengeRhythm, string> = {
  once: 'Parcours suivi',
  recurring: 'Rythme hebdomadaire',
  milestones: 'Par etapes',
};

/** Durees proposees a la creation, du plus court au plus long. */
export const CHALLENGE_DURATIONS = [3, 7, 14, 21, 30] as const;

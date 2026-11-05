/**
 * Calculs de progression des challenges.
 *
 * Module PUR : il ne lit rien, n'ecrit rien, ne connait ni Dexie ni React.
 * C'est ce qui le rend testable, et c'est la garantie qu'aucune progression
 * n'est inventee — tout se deduit des etapes reellement cochees.
 *
 * REGLE DE TON
 * -------------
 * Aucun de ces calculs ne produit de notion d'echec. Un challenge en retard
 * n'est pas « rate » : il a simplement des jours non coches, et le libelle le
 * dit sans le reprocher.
 */

import type { Challenge, ChallengeDay } from '@/types';
import { daysBetween, todayKey } from '@/utils/dates';

/* ==========================================================================
   1. PROGRESSION
   ========================================================================== */

export interface ChallengeProgress {
  /** Jours coches. */
  completedDays: number;
  /** Duree totale en jours. */
  totalDays: number;
  /** Jours restants avant la fin (0 si termine ou depasse). */
  remainingDays: number;
  /** Jours ecoules depuis le debut, jour de depart inclus. */
  elapsedDays: number;
  /** Progression 0..100. `null` si la duree est invalide. */
  percent: number | null;
  /** Numero de l'etape a faire aujourd'hui, si le challenge est en cours. */
  todayStepNumber: number | null;
  /** Vrai si l'etape du jour est deja cochee. */
  todayDone: boolean;
  /** Vrai si toutes les etapes sont cochees. */
  isComplete: boolean;
}

/**
 * Progression d'un challenge, calculee depuis ses etapes.
 *
 * `todayStepNumber` vaut le jour indexe depuis `startDate`, borne a la duree :
 * c'est ce qui permet de proposer « l'action du jour » sans stocker d'etat
 * supplementaire. Un challenge commence aujourd'hui propose donc le jour 1.
 */
export function computeChallengeProgress(
  challenge: Challenge,
  reference: string = todayKey(),
): ChallengeProgress {
  const totalDays = challenge.durationDays;
  const completedDays = challenge.days.filter((day) => day.completedAt !== undefined).length;
  const isComplete = totalDays > 0 && completedDays === totalDays;

  const offset = daysBetween(challenge.startDate, reference);
  const elapsedDays = Math.min(Math.max(offset + 1, 0), totalDays);
  const remainingDays = Math.max(0, totalDays - completedDays);

  // L'etape du jour n'a de sens que dans la fenetre du challenge.
  const inWindow = offset >= 0 && offset < totalDays;
  const todayStepNumber = inWindow ? offset + 1 : null;
  const todayStep =
    todayStepNumber === null
      ? undefined
      : challenge.days.find((day) => day.dayNumber === todayStepNumber);

  return {
    completedDays,
    totalDays,
    remainingDays,
    elapsedDays,
    percent:
      totalDays > 0 ? Math.min(100, Math.round((completedDays / totalDays) * 100)) : null,
    todayStepNumber,
    todayDone: todayStep?.completedAt !== undefined,
    isComplete,
  };
}

/* ==========================================================================
   2. ETAPES
   ========================================================================== */

export interface ChallengeDayView extends ChallengeDay {
  /** Jour calendaire correspondant, `YYYY-MM-DD`. */
  date: string;
  /** Vrai si c'est aujourd'hui. */
  isToday: boolean;
  /** Vrai si le jour est deja passe. */
  isPast: boolean;
  /** Vrai si la coche est encore possible. */
  isActionable: boolean;
}

/** Associe chaque etape a son jour calendaire. */
export function viewChallengeDays(
  challenge: Challenge,
  reference: string = todayKey(),
): ChallengeDayView[] {
  return challenge.days.map((day) => {
    const date = addDays(challenge.startDate, day.dayNumber - 1);
    const isToday = date === reference;
    const isPast = date < reference;
    return {
      ...day,
      date,
      isToday,
      isPast,
      // Une coche reste possible sur un jour passe non coche : on ne ferme
      // jamais la porte a quelqu'un qui rattrape son retard.
      isActionable: !isPast || day.completedAt === undefined,
    };
  });
}

/** Ajoute `count` jours a une cle `YYYY-MM-DD`, en heure locale. */
function addDays(dateKey: string, count: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + count);
  const paddedMonth = String(date.getMonth() + 1).padStart(2, '0');
  const paddedDay = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + paddedMonth + '-' + paddedDay;
}

/* ==========================================================================
   3. RESUME
   ========================================================================== */

export interface ChallengeSummary {
  total: number;
  active: number;
  upcoming: number;
  completed: number;
  setAside: number;
  /** Progression moyenne des challenges en cours. `null` si aucun. */
  averageProgress: number | null;
}

/** Resume de tous les challenges, pour l'en-tete de la section. */
export function summarizeChallenges(
  challenges: Challenge[],
  reference: string = todayKey(),
): ChallengeSummary {
  const progresses = challenges
    .filter((challenge) => challenge.status === 'active')
    .map((challenge) => computeChallengeProgress(challenge, reference).percent)
    .filter((value): value is number => value !== null);

  return {
    total: challenges.length,
    active: challenges.filter((c) => c.status === 'active').length,
    upcoming: challenges.filter((c) => c.status === 'upcoming').length,
    completed: challenges.filter((c) => c.status === 'completed').length,
    setAside: challenges.filter((c) => c.status === 'abandoned').length,
    averageProgress:
      progresses.length > 0
        ? Math.round(progresses.reduce((sum, value) => sum + value, 0) / progresses.length)
        : null,
  };
}

/* ==========================================================================
   4. LIBELLES
   ========================================================================== */

/**
 * Formule de reussite affichee a la fin d'un challenge.
 * Positive, sobre, sans emphase.
 */
export function completionMessage(challenge: Challenge): string {
  return challenge.title + ' est termine. Tu as tenu ' + challenge.durationDays + ' jours.';
}

/**
 * Description du retard eventuel, sans reproche.
 * Renvoie `null` quand il n'y a rien a dire.
 */
export function describePace(progress: ChallengeProgress): string | null {
  if (progress.isComplete) return null;
  if (progress.todayStepNumber === null) return null;

  const gap = progress.todayStepNumber - 1 - progress.completedDays;
  if (gap <= 0) return null;
  if (gap === 1) return 'Une journee est en attente. Tu peux la rattraper quand tu veux.';
  return gap + ' journees sont en attente. Tu peux les rattraper quand tu veux.';
}

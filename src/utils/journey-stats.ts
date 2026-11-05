/**
 * Calculs statistiques de l'espace JOURNEY.
 *
 * RÔLE
 * ----
 * Ce module est PUR : il ne lit rien, n'écrit rien, et ne connaît ni Dexie ni
 * React. Il reçoit des données et renvoie des mesures. C'est ce qui le rend
 * testable, et c'est aussi la garantie qu'aucune statistique n'est inventée :
 * si une donnée manque, le résultat est `null` et l'interface affiche un état
 * vide plutôt qu'un chiffre fabriqué.
 *
 * RÈGLES DE TON
 * -------------
 * Les seuils sont pensés pour ne jamais culpabiliser :
 *   - une journée sans entrée est comptée, jamais reprochée ;
 *   - une régularité est décrite comme telle, pas comme un échec ;
 *   - aucune comparaison entre personnes n'est possible ici, par construction.
 *
 * UNITÉS
 * ------
 * Une « journée » est une clé `YYYY-MM-DD` (cf. `@/utils/dates`).
 * Les taux sont des pourcentages entiers (0..100).
 * Les moyennes d'humeur sont sur l'échelle 1..5, arrondies à une décimale.
 */

import type { Goal, Habit, HabitCompletion, MoodEntry, MoodLevel } from '@/types';
import { daysBetween, lastNDays, todayKey } from '@/utils/dates';

export type StatPeriod = 7 | 30;

export const PERIODS: StatPeriod[] = [7, 30];

/* ==========================================================================
   1. HUMEUR
   ========================================================================== */

export interface MoodPoint {
  /** Clé de jour. */
  date: string;
  /** Niveau d'humeur, ou `null` si aucun check-in ce jour-là. */
  mood: MoodLevel | null;
}

export interface MoodStats {
  /** Série jour par jour, du plus ancien au plus récent. */
  points: MoodPoint[];
  /** Moyenne de la période, ou `null` si aucune donnée. */
  average: number | null;
  /** Nombre de jours renseignés. */
  entriesCount: number;
  /** Nombre de jours de la période laissés sans entrée. */
  missingCount: number;
  /** Tendance : dynamique des derniers jours renseignés. */
  trend: 'up' | 'down' | 'stable' | null;
  /** Écart de la tendance, en points d'humeur (positif = en hausse). */
  trendDelta: number | null;
  /** Meilleur jour de la période. */
  bestDay: MoodPoint | null;
  /** Jour le plus difficile de la période. */
  hardestDay: MoodPoint | null;
}

/** Taille de la fenêtre glissante utilisée pour la tendance. */
const TREND_WINDOW = 3;

/**
 * Statistiques d'humeur sur une période.
 *
 * TENDANCE — FENÊTRE GLISSANTE
 * -----------------------------
 * Le calcul précédent découpait la période en deux moitiés et comparait leurs
 * moyennes. Sur un jeu réel (4, 5, 4, 2, 3, 4, 5), il annonçait « En baisse
 * -0.8 » alors que la courbe remontait nettement sur la fin.
 *
 * Le découpage en moitiés est donc trop sensible à la POSITION d'un mauvais
 * jour. On compare désormais les trois derniers jours RENSEIGNÉS aux trois
 * précédents : c'est la dynamique récente, celle que l'utilisateur ressent.
 *
 * Il faut au moins 2 jours dans chaque fenêtre pour conclure : en dessous, un
 * écart ne serait pas une tendance, ce serait un échantillon.
 */
export function computeMoodStats(entries: MoodEntry[], days: StatPeriod): MoodStats {
  const window = lastNDays(days);
  const byDate = new Map<string, MoodEntry>();

  // Une seule entrée par jour : la plus récente gagne, comme dans l'UI.
  for (const entry of entries) {
    const existing = byDate.get(entry.date);
    if (!existing || entry.createdAt > existing.createdAt) byDate.set(entry.date, entry);
  }

  const points: MoodPoint[] = window.map((date) => {
    const entry = byDate.get(date);
    return { date, mood: entry ? entry.mood : null };
  });

  const valued = points.filter(
    (point): point is MoodPoint & { mood: MoodLevel } => point.mood !== null,
  );

  if (valued.length === 0) {
    return {
      points,
      average: null,
      entriesCount: 0,
      missingCount: days,
      trend: null,
      trendDelta: null,
      bestDay: null,
      hardestDay: null,
    };
  }

  const total = valued.reduce((sum, point) => sum + point.mood, 0);
  const average = round1(total / valued.length);

  // --- Tendance : fenêtre glissante sur les jours RENSEIGNÉS ----------------
  let trend: MoodStats['trend'] = null;
  let trendDelta: number | null = null;

  const recent = valued.slice(-TREND_WINDOW);
  const before = valued.slice(-TREND_WINDOW * 2, -TREND_WINDOW);

  if (recent.length >= 2 && before.length >= 2) {
    const meanOf = (list: typeof valued) =>
      list.reduce((sum, point) => sum + point.mood, 0) / list.length;
    const delta = round1(meanOf(recent) - meanOf(before));
    trendDelta = delta;
    trend = delta > 0.3 ? 'up' : delta < -0.3 ? 'down' : 'stable';
  }

  const sorted = [...valued].sort((a, b) => b.mood - a.mood);

  return {
    points,
    average,
    entriesCount: valued.length,
    missingCount: days - valued.length,
    trend,
    trendDelta,
    bestDay: sorted[0] ?? null,
    hardestDay: sorted[sorted.length - 1] ?? null,
  };
}

/** Libellé de tendance, non culpabilisant. */
export function describeTrend(trend: MoodStats['trend']): string {
  switch (trend) {
    case 'up':
      return 'En hausse';
    case 'down':
      return 'En baisse';
    case 'stable':
      return 'Stable';
    default:
      return 'Pas encore assez de données';
  }
}

/* ==========================================================================
   2. HABITUDES
   ========================================================================== */

export interface HabitStat {
  habit: Habit;
  /** Nombre de jours cochés sur la période analysée. */
  completedDays: number;
  /** Nombre de jours où l'habitude était attendue (selon sa fréquence). */
  expectedDays: number;
  /** Taux de régularité sur la période, 0..100. `null` si rien n'était attendu. */
  consistency: number | null;
  /** Série courante, en jours consécutifs. */
  currentStreak: number;
  /** Meilleure série observée sur l'historique fourni. */
  bestStreak: number;
  /** Jours cochés sur les 7 derniers jours, pour lire l'élan récent. */
  last7Days: number;
  /** Jours cochés sur les 7 jours précédents, pour comparer. */
  previous7Days: number;
  /** Évolution récente : `up` si l'élan progresse. */
  recentTrend: 'up' | 'down' | 'stable';
}

/**
 * Nombre de jours attendus pour une habitude sur une fenêtre donnée.
 * Une habitude quotidienne est attendue tous les jours ; une habitude
 * personnalisée, seulement sur ses jours cibles ; une habitude hebdomadaire est
 * attendue une fois par semaine (arrondi au plus proche).
 */
export function expectedDaysIn(habit: Habit, window: string[]): number {
  if (habit.frequency === 'custom') {
    return window.filter((date) => habit.targetDays.includes(weekdayIndex(date))).length;
  }
  if (habit.frequency === 'weekly') {
    return Math.max(1, Math.round(window.length / 7));
  }
  return window.length;
}

/** Index du jour dans la semaine (0 = dimanche), pour une clé `YYYY-MM-DD`. */
function weekdayIndex(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getDay();
}

/**
 * Statistiques d'une habitude.
 *
 * `consistency` est `null` (et non `0`) quand aucun jour n'était attendu sur
 * la période : afficher « 0 % » dans ce cas serait un reproche immérité.
 */
export function computeHabitStat(
  habit: Habit,
  completions: HabitCompletion[],
  period: StatPeriod = 30,
): HabitStat {
  const dates = new Set(
    completions.filter((c) => c.habitId === habit.id).map((c) => c.date),
  );

  const window = lastNDays(period);
  const expectedDays = expectedDaysIn(habit, window);
  const completedDays = window.filter((date) => dates.has(date)).length;
  const consistency =
    expectedDays > 0 ? Math.min(100, Math.round((completedDays / expectedDays) * 100)) : null;

  const last7 = lastNDays(7);
  const previous7 = lastNDays(7, last7[0] ?? todayKey());
  const last7Days = last7.filter((date) => dates.has(date)).length;
  const previous7Days = previous7.filter((date) => dates.has(date)).length;

  const delta = last7Days - previous7Days;
  const recentTrend: HabitStat['recentTrend'] =
    delta >= 2 ? 'up' : delta <= -2 ? 'down' : 'stable';

  return {
    habit,
    completedDays,
    expectedDays,
    consistency,
    currentStreak: computeCurrentStreak(dates),
    bestStreak: computeBestStreak(dates),
    last7Days,
    previous7Days,
    recentTrend,
  };
}

/**
 * Série courante : jours consécutifs cochés en remontant depuis aujourd'hui.
 * Aujourd'hui peut ne pas encore être coché sans casser la série : on ne
 * pénalise pas une journée qui n'est pas finie.
 */
export function computeCurrentStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  const today = todayKey();
  let streak = 0;

  // Borne de deux ans : au-delà, la lecture n'a plus de sens.
  for (let offset = 0; offset < 730; offset += 1) {
    const cursor = lastNDays(offset + 1)[0] ?? today;
    if (dates.has(cursor)) {
      streak += 1;
    } else if (cursor !== today) {
      break;
    }
  }

  return streak;
}

/**
 * Meilleure série : plus longue suite de jours consécutifs cochés, sur tout
 * l'historique fourni. Aucune valeur n'est inventée : elle vient des dates.
 */
export function computeBestStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;

  const sorted = [...dates].sort();
  let best = 1;
  let current = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const cursor = sorted[index];
    if (previous === undefined || cursor === undefined) continue;

    if (daysBetween(previous, cursor) === 1) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }

  return best;
}

/** Régularité globale : moyenne des régularités calculables. */
export function computeOverallConsistency(stats: HabitStat[]): number | null {
  const values = stats
    .map((stat) => stat.consistency)
    .filter((value): value is number => value !== null);

  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/* ==========================================================================
   3. OBJECTIFS
   ========================================================================== */

export interface GoalStats {
  active: Goal[];
  completed: Goal[];
  /** Nombre total d'objectifs (hors archivés). */
  total: number;
  /** Progression moyenne des objectifs actifs, 0..100. `null` si aucun. */
  overallProgress: number | null;
  /** Objectifs dont l'échéance est passée sans être atteints. */
  overdue: Goal[];
  /** Objectifs dont l'échéance tombe dans les 14 prochains jours. */
  dueSoon: Goal[];
}

/**
 * Statistiques des objectifs, calculées à la volée.
 *
 * Aucune progression n'est stockée en dur : elle est lue sur chaque objectif,
 * et la moyenne ne porte que sur les objectifs actifs. Inclure les objectifs
 * atteints gonflerait artificiellement le chiffre.
 */
export function computeGoalStats(goals: Goal[], reference: string = todayKey()): GoalStats {
  const visible = goals.filter((goal) => goal.status !== 'archived');
  const active = visible.filter((goal) => goal.status === 'active' || goal.status === 'paused');
  const completed = visible.filter((goal) => goal.status === 'completed');

  const overallProgress =
    active.length > 0
      ? Math.round(active.reduce((sum, goal) => sum + goal.progress, 0) / active.length)
      : null;

  const withDeadline = active.filter((goal) => goal.targetDate !== undefined);
  const overdue = withDeadline.filter((goal) => (goal.targetDate ?? '') < reference);
  const dueSoon = withDeadline.filter((goal) => {
    const target = goal.targetDate ?? '';
    const remaining = daysBetween(reference, target);
    return remaining >= 0 && remaining <= 14;
  });

  return {
    active,
    completed,
    total: visible.length,
    overallProgress,
    overdue,
    dueSoon,
  };
}

/* ==========================================================================
   4. SYNTHÈSE
   ========================================================================== */

export interface JourneySummary {
  moodAverage: number | null;
  moodEntries: number;
  consistency: number | null;
  habitsTracked: number;
  goalsActive: number;
  goalsCompleted: number;
  goalsProgress: number | null;
  journalEntries: number;
  challengesActive: number;
}

/**
 * Résumé personnel affiché en tête de Journey.
 * Chaque valeur est `null` (ou zéro) tant qu'il n'y a rien à mesurer :
 * l'interface décide alors d'afficher un état vide plutôt qu'un zéro trompeur.
 */
export function computeJourneySummary(input: {
  moods: MoodStats;
  habitStats: HabitStat[];
  goals: GoalStats;
  journalCount: number;
  challengesActive?: number;
}): JourneySummary {
  return {
    moodAverage: input.moods.average,
    moodEntries: input.moods.entriesCount,
    consistency: computeOverallConsistency(input.habitStats),
    habitsTracked: input.habitStats.length,
    goalsActive: input.goals.active.length,
    goalsCompleted: input.goals.completed.length,
    goalsProgress: input.goals.overallProgress,
    journalEntries: input.journalCount,
    challengesActive: input.challengesActive ?? 0,
  };
}

/**
 * Libellé d'encouragement associé au résumé, jamais un jugement.
 *
 * Les tests de `journey-stats.test.ts` vérifient cette phrase mot pour mot —
 * « 1 journée documentée », « 1 entrée de journal », « Chaque geste compte ».
 * Toute retouche doit donc être répercutée dans les tests, sinon la CI tombe.
 */
export function summarizeJourney(summary: JourneySummary): string {
  const parts: string[] = [];

  if (summary.moodEntries > 0) {
    parts.push(
      summary.moodEntries === 1
        ? '1 journée documentée'
        : summary.moodEntries + ' journées documentées',
    );
  }
  if (summary.journalEntries > 0) {
    parts.push(
      summary.journalEntries === 1
        ? '1 entrée de journal'
        : summary.journalEntries + ' entrées de journal',
    );
  }
  if (summary.goalsCompleted > 0) {
    parts.push(
      summary.goalsCompleted === 1
        ? '1 objectif atteint'
        : summary.goalsCompleted + ' objectifs atteints',
    );
  }

  if (parts.length === 0) {
    return 'Ton historique est encore vide. Chaque geste compte, même le premier.';
  }

  return 'Déjà ' + parts.join(', ') + ". C'est ton rythme, et il compte.";
}

/** Arrondi à une décimale. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

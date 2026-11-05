/**
 * Calculs statistiques de l'espace JOURNEY.
 *
 * ROLE
 * ----
 * Ce module est PUR : il ne lit rien, n'ecrit rien, et ne connait ni Dexie ni
 * React. Il recoit des donnees et renvoie des mesures. C'est ce qui le rend
 * testable, et c'est aussi la garantie qu'aucune statistique n'est inventee :
 * si une donnee manque, le resultat est `null` et l'interface affiche un etat
 * vide plutot qu'un chiffre fabrique.
 *
 * REGLES DE TON
 * -------------
 * Les seuils sont penses pour ne jamais culpabiliser :
 *   - une journee sans entree est comptee, jamais reprochee ;
 *   - une regularite est decrite comme telle, pas comme un echec ;
 *   - aucune comparaison entre personnes n'est possible ici, par construction.
 *
 * UNITES
 * ------
 * Une « journee » est une cle `YYYY-MM-DD` (cf. `@/utils/dates`).
 * Les taux sont des pourcentages entiers (0..100).
 * Les moyennes d'humeur sont sur l'echelle 1..5, arrondies a une decimale.
 */

import type { Goal, Habit, HabitCompletion, MoodEntry, MoodLevel } from '@/types';
import { daysBetween, lastNDays, todayKey } from '@/utils/dates';

export type StatPeriod = 7 | 30;

export const PERIODS: StatPeriod[] = [7, 30];

/* ==========================================================================
   1. HUMEUR
   ========================================================================== */

export interface MoodPoint {
  /** Cle de jour. */
  date: string;
  /** Niveau d'humeur, ou `null` si aucun check-in ce jour-la. */
  mood: MoodLevel | null;
}

export interface MoodStats {
  /** Serie jour par jour, du plus ancien au plus recent. */
  points: MoodPoint[];
  /** Moyenne de la periode, ou `null` si aucune donnee. */
  average: number | null;
  /** Nombre de jours renseignes. */
  entriesCount: number;
  /** Nombre de jours de la periode laisses sans entree. */
  missingCount: number;
  /** Tendance : dynamique des derniers jours renseignes. */
  trend: 'up' | 'down' | 'stable' | null;
  /** Ecart de la tendance, en points d'humeur (positif = en hausse). */
  trendDelta: number | null;
  /** Meilleur jour de la periode. */
  bestDay: MoodPoint | null;
  /** Jour le plus difficile de la periode. */
  hardestDay: MoodPoint | null;
}

/** Taille de la fenetre glissante utilisee pour la tendance. */
const TREND_WINDOW = 3;

/**
 * Statistiques d'humeur sur une periode.
 *
 * TENDANCE — FENETRE GLISSANTE
 * -----------------------------
 * Le calcul precedent decoupait la periode en deux moities et comparait leurs
 * moyennes. Sur un jeu reel (4, 5, 4, 2, 3, 4, 5), il annoncait « En baisse
 * -0.8 » alors que la courbe remontait nettement sur la fin : les trois
 * premiers jours formaient une moyenne haute, et le creux isole du quatrieme
 * suffisait a faire chuter la seconde moitie.
 *
 * Le decoupage en moities est donc trop sensible a la POSITION d'un mauvais
 * jour. On compare desormais les trois derniers jours RENSEIGNES aux trois
 * precedents : c'est la dynamique recente, celle que l'utilisateur ressent. La
 * fenetre glisse, elle ne depend plus de la longueur de la periode choisie.
 *
 * Il faut au moins 2 jours dans chaque fenetre pour conclure : en dessous, un
 * ecart ne serait pas une tendance, ce serait un echantillon.
 */
export function computeMoodStats(entries: MoodEntry[], days: StatPeriod): MoodStats {
  const window = lastNDays(days);
  const byDate = new Map<string, MoodEntry>();

  // Une seule entree par jour : la plus recente gagne, comme dans l'UI.
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

  // --- Tendance : fenetre glissante sur les jours RENSEIGNES ----------------
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

/** Libelle de tendance, non culpabilisant. */
export function describeTrend(trend: MoodStats['trend']): string {
  switch (trend) {
    case 'up':
      return 'En hausse';
    case 'down':
      return 'En baisse';
    case 'stable':
      return 'Stable';
    default:
      return 'Pas encore assez de donnees';
  }
}

/* ==========================================================================
   2. HABITUDES
   ========================================================================== */

export interface HabitStat {
  habit: Habit;
  /** Nombre de jours coches sur la periode analysee. */
  completedDays: number;
  /** Nombre de jours ou l'habitude etait attendue (selon sa frequence). */
  expectedDays: number;
  /** Taux de regularite sur la periode, 0..100. `null` si rien n'etait attendu. */
  consistency: number | null;
  /** Serie courante, en jours consecutifs. */
  currentStreak: number;
  /** Meilleure serie observee sur l'historique fourni. */
  bestStreak: number;
  /** Jours coches sur les 7 derniers jours, pour lire l'elan recent. */
  last7Days: number;
  /** Jours coches sur les 7 jours precedents, pour comparer. */
  previous7Days: number;
  /** Evolution recente : `up` si l'elan progresse. */
  recentTrend: 'up' | 'down' | 'stable';
}

/**
 * Nombre de jours attendus pour une habitude sur une fenetre donnee.
 * Une habitude quotidienne est attendue tous les jours ; une habitude
 * personnalisee, seulement sur ses jours cibles ; une habitude hebdomadaire est
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

/** Index du jour dans la semaine (0 = dimanche), pour une cle `YYYY-MM-DD`. */
function weekdayIndex(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getDay();
}

/**
 * Statistiques d'une habitude.
 *
 * `consistency` est `null` (et non `0`) quand aucun jour n'etait attendu sur
 * la periode : afficher « 0 % » dans ce cas serait un reproche immérité.
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
 * Serie courante : jours consecutifs coches en remontant depuis aujourd'hui.
 * Aujourd'hui peut ne pas encore etre coche sans casser la serie : on ne
 * penalise pas une journee qui n'est pas finie.
 */
export function computeCurrentStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  const today = todayKey();
  let streak = 0;

  // Borne de deux ans : au-dela, la lecture n'a plus de sens.
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
 * Meilleure serie : plus longue suite de jours consecutifs coches, sur tout
 * l'historique fourni. Aucune valeur n'est inventee : elle vient des dates.
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

/** Regularite globale : moyenne des regularites calculables. */
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
  /** Nombre total d'objectifs (hors archives). */
  total: number;
  /** Progression moyenne des objectifs actifs, 0..100. `null` si aucun. */
  overallProgress: number | null;
  /** Objectifs dont l'echeance est passee sans etre atteints. */
  overdue: Goal[];
  /** Objectifs dont l'echeance tombe dans les 14 prochains jours. */
  dueSoon: Goal[];
}

/**
 * Statistiques des objectifs, calculees a la volee.
 *
 * Aucune progression n'est stockee en dur : elle est lue sur chaque objectif,
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
   4. SYNTHESE
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
 * Resume personnel affiche en tete de Journey.
 * Chaque valeur est `null` (ou zero) tant qu'il n'y a rien a mesurer :
 * l'interface decide alors d'afficher un etat vide plutot qu'un zero trompeur.
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

/** Libelle d'encouragement associe au resume, jamais un jugement. */
export function summarizeJourney(summary: JourneySummary): string {
  const parts: string[] = [];

  if (summary.moodEntries > 0) {
    parts.push(
      summary.moodEntries === 1
        ? '1 journee documentee'
        : summary.moodEntries + ' journees documentees',
    );
  }
  if (summary.journalEntries > 0) {
    parts.push(
      summary.journalEntries === 1
        ? '1 entree de journal'
        : summary.journalEntries + ' entrees de journal',
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
    return 'Ton historique est encore vide. Chaque geste compte, meme le premier.';
  }

  return 'Deja ' + parts.join(', ') + '. C\'est ton rythme, et il compte.';
}

/** Arrondi a une decimale. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

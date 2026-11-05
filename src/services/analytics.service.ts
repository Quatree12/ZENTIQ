import { db } from '@/database/db';
import type { Challenge, Habit, HabitCompletion, MoodEntry } from '@/types';
import { lastNDays, todayKey } from '@/utils/dates';
import {
  alignByDate,
  comparePeriods,
  computeCorrelation,
  computeRegularity,
  computeTrend,
  longestPresenceStreak,
  windowEndingAt,
  type TrendResult,
} from '@/utils/trends';

/**
 * Analytique de tendances.
 *
 * Ce service LIT la base et calcule. Il n'ecrit rien, ne met rien en cache, et
 * ne fabrique aucune valeur : chaque chiffre expose ici vient d'un
 * enregistrement reel, et chaque champ qui ne peut pas etre calcule est `null`
 * avec une raison lisible par l'interface.
 */

export interface MoodAnalytics {
  average: number | null;
  entries: number;
  trend: TrendResult | null;
  /** Methode de la tendance, pour l'assumer a l'ecran. */
  trendMethod: string;
  /** Moyenne des 7 derniers jours, `null` si aucune donnee. */
  last7Average: number | null;
  /** Comparaison avec les 7 jours precedents, `null` si rien a comparer. */
  weekOverWeek: { delta: number; percent: number | null } | null;
  /** Serie de jours consecutifs documentes. */
  presenceStreak: number;
}

export interface HabitAnalytics {
  habitId: string;
  name: string;
  accent: Habit['accent'];
  /** Jours coches dans la fenetre. */
  completed: number;
  /** Jours ou l'habitude etait attendue. */
  expected: number;
  /** Regularite, `null` si aucun jour attendu dans la fenetre. */
  regularity: number | null;
  trend: TrendResult | null;
}

export interface CorrelationInsight {
  habitId: string;
  habitName: string;
  coefficient: number;
  sampleSize: number;
  /** Sens de la relation, formule sans causalite. */
  reading: string;
}

export interface ChallengeAnalytics {
  active: number;
  completed: number;
  setAside: number;
  /** Moyenne d'avancement des challenges en cours, `null` si aucun. */
  averageProgress: number | null;
  /** Nombre de jalons franchis, sur tous les challenges. */
  milestonesReached: number;
  /** Nombre total de reports accordes — affiche comme une souplesse. */
  postponedDays: number;
}

export interface TrendsReport {
  windowDays: number;
  mood: MoodAnalytics;
  habits: HabitAnalytics[];
  correlations: CorrelationInsight[];
  challenges: ChallengeAnalytics;
  /** Renseigne quand il n'y a pas assez de donnees pour une analyse honnete. */
  insufficientData: string | null;
}

/**
 * Analyse complete sur une fenetre de jours.
 *
 * Le seuil de fiabilite est porte par les fonctions de calcul : quand une
 * tendance n'a pas assez de points, elle revient avec `reliable: false` et
 * l'interface sait qu'elle ne doit pas la presenter comme une mesure.
 */
export async function buildTrendsReport(windowDays = 30): Promise<TrendsReport> {
  const today = todayKey();
  const window = lastNDays(windowDays, today);
  const windowSet = new Set(window);
  const start = window[0] ?? today;

  const [moodRows, habitRows, completionRows, challengeRows] = await Promise.all([
    db.moods.toArray(),
    db.habits.toArray(),
    db.habitCompletions.toArray(),
    db.challenges.toArray(),
  ]);

  const mood = buildMoodAnalytics(moodRows, window, windowSet, today);
  const habits = buildHabitAnalytics(habitRows, completionRows, window);
  const correlations = buildCorrelations(habitRows, completionRows, moodRows, window);
  const challenges = buildChallengeAnalytics(challengeRows, today);

  return {
    windowDays,
    mood,
    habits,
    correlations,
    challenges,
    insufficientData: describeShortfall(mood, habits, start),
  };
}

/* --------------------------------------------------------------------------
   Humeur
   -------------------------------------------------------------------------- */

function buildMoodAnalytics(
  rows: MoodEntry[],
  window: string[],
  windowSet: Set<string>,
  today: string,
): MoodAnalytics {
  // Une seule entree par jour : si plusieurs existent, on garde la plus
  // recente, conformement a l'index logique `date`.
  const byDate = new Map<string, MoodEntry>();
  for (const row of rows) {
    if (!windowSet.has(row.date)) continue;
    const existing = byDate.get(row.date);
    if (!existing || row.updatedAt > existing.updatedAt) byDate.set(row.date, row);
  }

  const ordered = window
    .map((date) => byDate.get(date))
    .filter((entry): entry is MoodEntry => entry !== undefined);

  const values = ordered.map((entry) => entry.mood);
  const average =
    values.length > 0
      ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
      : null;

  const last7 = lastNDays(7, today);
  const previous7 = windowEndingAt(today, 7, 7);

  const averageOf = (dates: string[]): number | null => {
    const picked = dates
      .map((date) => byDate.get(date))
      .filter((entry): entry is MoodEntry => entry !== undefined);
    if (picked.length === 0) return null;
    const total = picked.reduce((sum, entry) => sum + entry.mood, 0);
    return Math.round((total / picked.length) * 10) / 10;
  };

  const last7Average = averageOf(last7);
  const previous7Average = averageOf(previous7);

  const weekOverWeek =
    last7Average !== null && previous7Average !== null
      ? comparePeriods(last7Average, previous7Average)
      : null;

  const presenceStreak = longestPresenceStreak(rows.map((row) => row.date));

  return {
    average,
    entries: values.length,
    trend: computeTrend(values, 0.3),
    trendMethod:
      'Comparaison de la premiere et de la seconde moitie de la periode. Un ecart inferieur a 0,3 point est declare stable.',
    last7Average,
    weekOverWeek,
    presenceStreak,
  };
}

/* --------------------------------------------------------------------------
   Habitudes
   -------------------------------------------------------------------------- */

function buildHabitAnalytics(
  habits: Habit[],
  completions: HabitCompletion[],
  window: string[],
): HabitAnalytics[] {
  const windowSet = new Set(window);
  const byHabit = new Map<string, Set<string>>();

  for (const completion of completions) {
    if (!windowSet.has(completion.date)) continue;
    const set = byHabit.get(completion.habitId) ?? new Set<string>();
    set.add(completion.date);
    byHabit.set(completion.habitId, set);
  }

  return habits
    .filter((habit) => !habit.archived)
    .map((habit) => {
      const dates = byHabit.get(habit.id) ?? new Set<string>();
      const expectedWeekdays =
        habit.frequency === 'daily' || habit.frequency === 'weekly'
          ? [0, 1, 2, 3, 4, 5, 6]
          : habit.targetDays;

      return {
        habitId: habit.id,
        name: habit.name,
        accent: habit.accent,
        completed: dates.size,
        expected: window.filter((date) => expectedWeekdays.includes(weekdayOfDate(date))).length,
        regularity: computeRegularity([...dates], window, expectedWeekdays),
        trend: computeTrend(
          window.map((date) => (dates.has(date) ? 1 : 0)),
          0.15,
        ),
      };
    });
}

/* --------------------------------------------------------------------------
   Correlations
   -------------------------------------------------------------------------- */

/**
 * Cherche un lien entre l'humeur et chaque habitude.
 *
 * Garde-fou de lecture : on ne parle JAMAIS de cause. Le coefficient dit que
 * deux mesures bougent ensemble dans cet echantillon, rien de plus. La
 * formulation le dit explicitement, pour qu'aucune capture d'ecran ne laisse
 * croire a une causalite.
 */
function buildCorrelations(
  habits: Habit[],
  completions: HabitCompletion[],
  moods: MoodEntry[],
  window: string[],
): CorrelationInsight[] {
  const moodPoints = moods.map((row) => ({ date: row.date, value: row.mood }));
  const allDates = new Set(completions.map((row) => row.date));
  const windowSet = new Set(window);

  const insights: CorrelationInsight[] = [];

  for (const habit of habits.filter((item) => !item.archived)) {
    const doneDates = new Set(
      completions.filter((row) => row.habitId === habit.id).map((row) => row.date),
    );

    const habitPoints = [...allDates]
      .filter((date) => windowSet.has(date))
      .map((date) => ({ date, value: doneDates.has(date) ? 1 : 0 }));

    const result = computeCorrelation(alignByDate(habitPoints, moodPoints));
    if (!result) continue;
    if (Math.abs(result.coefficient) < 0.3) continue;

    const positive = result.coefficient > 0;
    insights.push({
      habitId: habit.id,
      habitName: habit.name,
      coefficient: result.coefficient,
      sampleSize: result.sampleSize,
      reading: positive
        ? `Les jours ou tu coches « ${habit.name} », ton humeur est plutot plus haute. ${result.sampleSize} jours observes.`
        : `Les jours ou tu coches « ${habit.name} », ton humeur est plutot plus basse. ${result.sampleSize} jours observes.`,
    });
  }

  return insights.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
}

/* --------------------------------------------------------------------------
   Challenges
   -------------------------------------------------------------------------- */

function buildChallengeAnalytics(rows: Challenge[], today: string): ChallengeAnalytics {
  const activeRows = rows.filter((row) => row.startDate <= today && !isDone(row));

  const averageProgress =
    activeRows.length > 0
      ? Math.round(
          (activeRows.reduce((sum, row) => sum + progressOf(row), 0) / activeRows.length) * 10,
        ) / 10
      : null;

  const milestonesReached = rows.reduce(
    (sum, row) => sum + (row.milestones ?? []).filter((item) => item.reachedAt !== undefined).length,
    0,
  );

  const postponedDays = rows.reduce((sum, row) => sum + (row.postponedDays ?? 0), 0);

  return {
    active: activeRows.length,
    completed: rows.filter(isDone).length,
    setAside: rows.filter((row) => row.status === 'abandoned').length,
    averageProgress,
    milestonesReached,
    postponedDays,
  };
}

/** Avancement d'un challenge, 0..100. Zero si la duree est invalide. */
function progressOf(challenge: Challenge): number {
  if (challenge.durationDays <= 0) return 0;
  const done = challenge.days.filter((day) => day.completedAt !== undefined).length;
  return (done / challenge.durationDays) * 100;
}

/** Un challenge est termine quand toutes ses etapes sont faites. */
function isDone(challenge: Challenge): boolean {
  return (
    challenge.status === 'completed' ||
    (challenge.days.length > 0 &&
      challenge.days.every((day) => day.completedAt !== undefined))
  );
}

/* --------------------------------------------------------------------------
   Donnees insuffisantes
   -------------------------------------------------------------------------- */

/**
 * Message affiche quand l'analyse ne peut pas conclure.
 *
 * On prefere dire pourquoi plutot que d'afficher une courbe plate : une courbe
 * sur deux points ne decrit rien, et laisser croire le contraire serait le seul
 * vrai mensonge de cet ecran.
 */
function describeShortfall(
  mood: MoodAnalytics,
  habits: HabitAnalytics[],
  start: string,
): string | null {
  if (mood.entries === 0 && habits.length === 0) {
    return `Rien a analyser pour l'instant : la periode commence le ${start}. Note ton humeur ou coche une habitude, et la tendance apparaitra ici.`;
  }
  if (mood.entries > 0 && mood.entries < 4) {
    return `Avec ${mood.entries} jour${mood.entries > 1 ? 's' : ''} note${mood.entries > 1 ? 's' : ''}, il est trop tot pour parler d'une tendance d'humeur. A partir de 4 jours, la comparaison devient lisible.`;
  }
  return null;
}

/** Numero du jour de semaine pour une cle `YYYY-MM-DD` (0 = dimanche). */
function weekdayOfDate(key: string): number {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getDay();
}

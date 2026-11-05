import { db } from '@/database/db';
import type { Challenge, Goal, Habit, HabitCompletion, MoodEntry } from '@/types';
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
 * Ce service LIT la base et calcule. Il n'écrit rien, ne met rien en cache, et
 * ne fabrique aucune valeur : chaque chiffre exposé ici vient d'un
 * enregistrement réel, et chaque champ qui ne peut pas être calculé est `null`
 * avec une raison lisible par l'interface.
 */

export interface MoodAnalytics {
  average: number | null;
  entries: number;
  trend: TrendResult | null;
  /** Méthode de la tendance, pour l'assumer à l'écran. */
  trendMethod: string;
  /** Moyenne des 7 derniers jours, `null` si aucune donnée. */
  last7Average: number | null;
  /** Comparaison avec les 7 jours précédents, `null` si rien à comparer. */
  weekOverWeek: { delta: number; percent: number | null } | null;
  /** Série de jours consécutifs documentés. */
  presenceStreak: number;
}

export interface HabitAnalytics {
  habitId: string;
  name: string;
  accent: Habit['accent'];
  /** Jours cochés dans la fenêtre. */
  completed: number;
  /** Jours où l'habitude était attendue. */
  expected: number;
  /** Régularité, `null` si aucun jour attendu dans la fenêtre. */
  regularity: number | null;
  trend: TrendResult | null;
}

export interface CorrelationInsight {
  habitId: string;
  habitName: string;
  coefficient: number;
  sampleSize: number;
  /** Sens de la relation, formulé sans causalité. */
  reading: string;
}

/**
 * Objectif suivi dans l'analyse de corrélation.
 *
 * On ne croise PAS tous les objectifs : un objectif au repos, archivé ou déjà
 * atteint n'a pas de progression vivante à mettre en regard de l'humeur. Seuls
 * les objectifs actifs ou en pause sont retenus, parce que ce sont les seuls
 * dont la progression bouge encore.
 */
export interface GoalPaceInsight {
  goalId: string;
  title: string;
  /** Progression actuelle, 0..100. */
  progress: number;
  /** Jours écoulés depuis la création, dans la fenêtre analysée. */
  daysTracked: number;
  /**
   * Humeur moyenne des jours où la progression a été mise à jour.
   *
   * C'est le cœur de la corrélation : on compare l'humeur des jours
   * d'AVANCEMENT à l'humeur générale de la même période. `null` si aucun
   * mouvement n'a été enregistré.
   */
  moodOnUpdateDays: number | null;
  /** Humeur moyenne de toute la période. `null` si aucune humeur notée. */
  moodOverall: number | null;
  /** Écart entre les deux, `null` si l'un des deux manque. */
  delta: number | null;
  /** Nombre de jours communs exploités. */
  sampleSize: number;
  /** Phrase affichée, quand l'écart est assez net pour être dit. */
  reading: string | null;
}

export interface ChallengeAnalytics {
  active: number;
  completed: number;
  setAside: number;
  /** Moyenne d'avancement des challenges en cours, `null` si aucun. */
  averageProgress: number | null;
  /** Nombre de jalons franchis, sur tous les challenges. */
  milestonesReached: number;
  /** Nombre total de reports accordés — affiché comme une souplesse. */
  postponedDays: number;
}

export interface TrendsReport {
  windowDays: number;
  mood: MoodAnalytics;
  habits: HabitAnalytics[];
  correlations: CorrelationInsight[];
  /** Le croisement objectifs ↔ humeur. */
  goalPace: GoalPaceInsight[];
  challenges: ChallengeAnalytics;
  /** Renseigné quand il n'y a pas assez de données pour une analyse honnête. */
  insufficientData: string | null;
}

/**
 * Écart minimal d'humeur pour parler d'un lien avec un objectif.
 *
 * En dessous d'un demi-point sur une échelle de 1 à 5, la différence n'est pas
 * distinguable d'un tressaillement ordinaire : l'écran ne doit pas la présenter
 * comme un résultat.
 */
const GOAL_MOOD_DELTA_THRESHOLD = 0.5;

/**
 * Analyse complète sur une fenêtre de jours.
 *
 * Le seuil de fiabilité est porté par les fonctions de calcul : quand une
 * tendance n'a pas assez de points, elle revient avec `reliable: false` et
 * l'interface sait qu'elle ne doit pas la présenter comme une mesure.
 */
export async function buildTrendsReport(windowDays = 30): Promise<TrendsReport> {
  const today = todayKey();
  const window = lastNDays(windowDays, today);
  const windowSet = new Set(window);
  const start = window[0] ?? today;

  const [moodRows, habitRows, completionRows, challengeRows, goalRows] = await Promise.all([
    db.moods.toArray(),
    db.habits.toArray(),
    db.habitCompletions.toArray(),
    db.challenges.toArray(),
    db.goals.toArray(),
  ]);

  const mood = buildMoodAnalytics(moodRows, window, windowSet, today);
  const habits = buildHabitAnalytics(habitRows, completionRows, window);
  const correlations = buildCorrelations(habitRows, completionRows, moodRows, window);
  const goalPace = buildGoalPace(goalRows, moodRows, window);
  const challenges = buildChallengeAnalytics(challengeRows, today);

  return {
    windowDays,
    mood,
    habits,
    correlations,
    goalPace,
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
  // Une seule entrée par jour : si plusieurs existent, on garde la plus
  // récente, conformément à l'index logique `date`.
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
      'Comparaison de la première et de la seconde moitié de la période. Un écart inférieur à 0,3 point est déclaré stable.',
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
   Corrélations habitudes ↔ humeur
   -------------------------------------------------------------------------- */

/**
 * Cherche un lien entre l'humeur et chaque habitude.
 *
 * Garde-fou de lecture : on ne parle JAMAIS de cause. Le coefficient dit que
 * deux mesures bougent ensemble dans cet échantillon, rien de plus. La
 * formulation le dit explicitement, pour qu'aucune capture d'écran ne laisse
 * croire à une causalité.
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
        ? `Les jours où tu coches « ${habit.name} », ton humeur est plutôt plus haute. ${result.sampleSize} jours observés.`
        : `Les jours où tu coches « ${habit.name} », ton humeur est plutôt plus basse. ${result.sampleSize} jours observés.`,
    });
  }

  return insights.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
}

/* --------------------------------------------------------------------------
   Objectifs ↔ humeur
   -------------------------------------------------------------------------- */

/**
 * Croise la mise à jour d'un objectif avec l'humeur du même jour.
 *
 * COMMENT ON MESURE, ET POURQUOI AINSI
 * ------------------------------------
 * On ne peut pas corréler « la progression » à l'humeur : la progression est un
 * cumul qui ne redescend pas, l'humeur un état journalier. Les mettre en regard
 * produirait un coefficient qui monte mécaniquement avec le temps.
 *
 * On compare donc l'HUMEUR DES JOURS DE MOUVEMENT — les jours où `updatedAt` de
 * l'objectif tombe dans la fenêtre, c'est-à-dire les jours où quelque chose a
 * bougé — à l'HUMEUR GÉNÉRALE de la même période.
 *
 * Ce que ça dit : « les jours où tu as fait avancer cet objectif, ton humeur
 * était plutôt plus haute ». Ce que ça ne dit pas : que l'objectif en est la
 * cause. La formulation à l'écran l'assume explicitement.
 */
function buildGoalPace(goals: Goal[], moods: MoodEntry[], window: string[]): GoalPaceInsight[] {
  const windowSet = new Set(window);

  // Humeur par jour, la plus récente gagnant.
  const moodByDate = new Map<string, number>();
  for (const row of moods) {
    if (!windowSet.has(row.date)) continue;
    moodByDate.set(row.date, row.mood);
  }

  if (moodByDate.size === 0) return [];

  const overallValues = [...moodByDate.values()];
  const moodOverall =
    Math.round((overallValues.reduce((sum, v) => sum + v, 0) / overallValues.length) * 10) / 10;

  const insights: GoalPaceInsight[] = [];

  for (const goal of goals) {
    // Un objectif archivé ou atteint n'a plus de progression vivante : le croiser
    // avec l'humeur ne dirait rien d'utile.
    if (goal.status === 'archived' || goal.status === 'completed') continue;

    const updateDate = goal.updatedAt.slice(0, 10);

    // Le mouvement du jour ne compte que s'il tombe DANS la fenêtre analysée :
    // hors fenêtre, la journée correspondante n'a pas d'humeur à comparer.
    if (!windowSet.has(updateDate)) continue;

    const trackedDates = window.filter((date) => date >= goal.createdAt.slice(0, 10));

    const updateMoods = trackedDates
      .filter((date) => date === updateDate)
      .map((date) => moodByDate.get(date))
      .filter((value): value is number => value !== undefined);

    if (updateMoods.length === 0) continue;

    const moodOnUpdateDays =
      Math.round((updateMoods.reduce((sum, v) => sum + v, 0) / updateMoods.length) * 10) / 10;
    const delta = Math.round((moodOnUpdateDays - moodOverall) * 10) / 10;

    const readable = Math.abs(delta) >= GOAL_MOOD_DELTA_THRESHOLD;
    const positive = delta > 0;

    insights.push({
      goalId: goal.id,
      title: goal.title,
      progress: goal.progress,
      daysTracked: trackedDates.length,
      moodOnUpdateDays,
      moodOverall,
      delta,
      sampleSize: updateMoods.length,
      reading: readable
        ? positive
          ? `Les jours où « ${goal.title} » a avancé, ton humeur était plutôt plus haute (${moodOnUpdateDays} contre ${moodOverall} en moyenne).`
          : `Les jours où « ${goal.title} » a avancé, ton humeur était plutôt plus basse (${moodOnUpdateDays} contre ${moodOverall} en moyenne).`
        : null,
    });
  }

  return insights.sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
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

/** Avancement d'un challenge, 0..100. Zéro si la durée est invalide. */
function progressOf(challenge: Challenge): number {
  if (challenge.durationDays <= 0) return 0;
  const done = challenge.days.filter((day) => day.completedAt !== undefined).length;
  return (done / challenge.durationDays) * 100;
}

/** Un challenge est terminé quand toutes ses étapes sont faites. */
function isDone(challenge: Challenge): boolean {
  return (
    challenge.status === 'completed' ||
    (challenge.days.length > 0 &&
      challenge.days.every((day) => day.completedAt !== undefined))
  );
}

/* --------------------------------------------------------------------------
   Données insuffisantes
   -------------------------------------------------------------------------- */

/**
 * Message affiché quand l'analyse ne peut pas conclure.
 *
 * On préfère dire pourquoi plutôt que d'afficher une courbe plate : une courbe
 * sur deux points ne décrit rien, et laisser croire le contraire serait le seul
 * vrai mensonge de cet écran.
 */
function describeShortfall(
  mood: MoodAnalytics,
  habits: HabitAnalytics[],
  start: string,
): string | null {
  if (mood.entries === 0 && habits.length === 0) {
    return `Rien à analyser pour l'instant : la période commence le ${start}. Note ton humeur ou coche une habitude, et la tendance apparaîtra ici.`;
  }
  if (mood.entries > 0 && mood.entries < 4) {
    return `Avec ${mood.entries} jour${mood.entries > 1 ? 's' : ''} noté${mood.entries > 1 ? 's' : ''}, il est trop tôt pour parler d'une tendance d'humeur. À partir de 4 jours, la comparaison devient lisible.`;
  }
  return null;
}

/** Numéro du jour de semaine pour une clé `YYYY-MM-DD` (0 = dimanche). */
function weekdayOfDate(key: string): number {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getDay();
}

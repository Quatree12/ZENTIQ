import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '@/database/db';
import { goalsRepository, habitsRepository, journalRepository, moodsRepository } from '@/database/repositories';
import {
  computeGoalStats,
  computeHabitStat,
  computeJourneySummary,
  computeMoodStats,
  type GoalStats,
  type HabitStat,
  type JourneySummary,
  type MoodStats,
  type StatPeriod,
} from '@/utils/journey-stats';

/**
 * Chargement des statistiques de Journey.
 *
 * Le hook lit les donnees REELLES de la base locale, puis delegue tout le
 * calcul au module pur `@/utils/journey-stats`. Il ne calcule rien lui-meme :
 * ce qui est teste, c'est le module ; ce qui est branche ici, c'est la lecture.
 *
 * Aucune valeur n'est inventee : si la base est vide, `hasAnyData` est faux et
 * l'interface affiche un etat vide explicite.
 */

export interface UseJourneyStatsResult {
  loading: boolean;
  error: string | null;
  /** Vrai des qu'au moins une donnee existe (humeur, habitude, objectif, journal). */
  hasAnyData: boolean;
  period: StatPeriod;
  setPeriod: (period: StatPeriod) => void;
  moods: MoodStats;
  habitStats: HabitStat[];
  goals: GoalStats;
  summary: JourneySummary;
  refresh: () => Promise<void>;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const EMPTY_MOODS: MoodStats = {
  points: [],
  average: null,
  entriesCount: 0,
  missingCount: 0,
  trend: null,
  trendDelta: null,
  bestDay: null,
  hardestDay: null,
};

const EMPTY_GOALS: GoalStats = {
  active: [],
  completed: [],
  total: 0,
  overallProgress: null,
  overdue: [],
  dueSoon: [],
};

export function useJourneyStats(): UseJourneyStatsResult {
  const [period, setPeriod] = useState<StatPeriod>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [moodEntries, setMoodEntries] = useState<Awaited<ReturnType<typeof moodsRepository.listAll>>>([]);
  const [habits, setHabits] = useState<Awaited<ReturnType<typeof habitsRepository.listAll>>>([]);
  const [completions, setCompletions] = useState<Awaited<ReturnType<typeof habitsRepository.completionsForDate>>>([]);
  const [goalList, setGoalList] = useState<Awaited<ReturnType<typeof goalsRepository.listAll>>>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [challengesActive, setChallengesActive] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Lecture groupee : une seule passe, pas d'allers-retours successifs.
      const [moods, habitList, goalData, completionsAll, journalTotal, challenges] =
        await Promise.all([
          moodsRepository.listAll(),
          habitsRepository.listAll(),
          goalsRepository.listAll(),
          db.habitCompletions.toArray(),
          journalRepository.count(),
          db.challenges.toArray(),
        ]);

      setMoodEntries(moods);
      setHabits(habitList.filter((habit) => !habit.archived));
      setCompletions(completionsAll);
      setGoalList(goalData);
      setJournalCount(journalTotal);
      setChallengesActive(challenges.filter((c) => c.status === 'active').length);
    } catch (caught) {
      setError(messageOf(caught, 'Tes statistiques n\'ont pas pu etre calculees.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const moods = useMemo(
    () => (moodEntries.length === 0 ? EMPTY_MOODS : computeMoodStats(moodEntries, period)),
    [moodEntries, period],
  );

  const habitStats = useMemo(
    () => habits.map((habit) => computeHabitStat(habit, completions, period)),
    [habits, completions, period],
  );

  const goals = useMemo(
    () => (goalList.length === 0 ? EMPTY_GOALS : computeGoalStats(goalList)),
    [goalList],
  );

  const summary = useMemo(
    () =>
      computeJourneySummary({
        moods,
        habitStats,
        goals,
        journalCount,
        challengesActive,
      }),
    [moods, habitStats, goals, journalCount, challengesActive],
  );

  const hasAnyData =
    moodEntries.length > 0 ||
    habits.length > 0 ||
    goalList.length > 0 ||
    journalCount > 0;

  return {
    loading,
    error,
    hasAnyData,
    period,
    setPeriod,
    moods,
    habitStats,
    goals,
    summary,
    refresh,
  };
}

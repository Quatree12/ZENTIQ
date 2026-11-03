import { useEffect, useState } from 'react';
import { goalsRepository, habitsRepository } from '@/database/repositories';
import { useMoodStore } from '@/stores/mood.store';

/**
 * Résumé de la journée pour Today.
 *
 * Agrège ce qui existe déjà : habitudes actives du jour, objectifs en cours,
 * présence d'un check-in d'humeur. Rien n'est inventé — chaque valeur vient
 * d'une lecture réelle de la base.
 */
export interface TodaySummary {
  goalsCount: number;
  habitsDone: number;
  habitsTotal: number;
  hasMood: boolean;
  loading: boolean;
}

export function useTodaySummary(): TodaySummary {
  const [goalsCount, setGoalsCount] = useState(0);
  const [habits, setHabits] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const todayEntry = useMoodStore((state) => state.todayEntry);
  const loadToday = useMoodStore((state) => state.loadToday);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [activeGoals, habitsWithStatus] = await Promise.all([
          goalsRepository.listActive(),
          habitsRepository.listWithStatus(),
        ]);
        if (cancelled) return;

        setGoalsCount(activeGoals.length);
        setHabits({
          done: habitsWithStatus.filter((habit) => habit.doneToday).length,
          total: habitsWithStatus.length,
        });
      } catch {
        // Un échec de lecture n'est pas bloquant : les compteurs restent à zéro
        // et le reste de l'écran demeure utilisable.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    void loadToday();

    return () => {
      cancelled = true;
    };
  }, [loadToday]);

  return {
    goalsCount,
    habitsDone: habits.done,
    habitsTotal: habits.total,
    hasMood: todayEntry !== null,
    loading,
  };
}

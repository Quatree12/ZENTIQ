import { db } from '@/database/db';
import type { Habit, HabitCompletion } from '@/types';
import { lastNDays, todayKey } from '@/utils/dates';
import { guard, prepareInsert, prepareUpdate } from './base.repository';

/**
 * Accès aux habitudes et à leurs réalisations.
 *
 * La règle produit : on célèbre ce qui a été fait, on ne compte pas les échecs.
 * Les calculs de série s'interrompent proprement et ne renvoient jamais de
 * valeur négative.
 */

export interface CreateHabitInput {
  name: string;
  intention?: string;
  frequency?: Habit['frequency'];
  targetDays?: number[];
  goalId?: string;
  weeklyTarget?: number | null;
  icon?: string;
  accent?: Habit['accent'];
}

export interface HabitWithStatus extends Habit {
  /** Vrai si l'habitude est cochée pour le jour de référence. */
  doneToday: boolean;
  /** Nombre de réalisations sur les 7 derniers jours. */
  completedThisWeek: number;
  /** Série courante (jours consécutifs), bornée à 90 jours d'analyse. */
  streak: number;
}

export const habitsRepository = {
  /** Habitudes actives (non archivées). */
  async listActive(): Promise<Habit[]> {
    return guard('habits.listActive', async () => {
      const habits = await db.habits.toArray();
      return habits.filter((habit) => !habit.archived).sort(sortHabits);
    });
  },

  /** Toutes les habitudes, y compris archivées. */
  async listAll(): Promise<Habit[]> {
    return guard('habits.listAll', async () => {
      const habits = await db.habits.toArray();
      return habits.sort(sortHabits);
    });
  },

  async get(id: string): Promise<Habit | null> {
    return guard('habits.get', async () => (await db.habits.get(id)) ?? null);
  },

  async create(input: CreateHabitInput): Promise<Habit> {
    return guard('habits.create', async () => {
      const habit = prepareInsert<Habit>({
        name: input.name.trim(),
        intention: input.intention?.trim() ?? '',
        frequency: input.frequency ?? 'daily',
        targetDays: input.targetDays ?? [0, 1, 2, 3, 4, 5, 6],
        goalId: input.goalId,
        weeklyTarget: input.weeklyTarget ?? null,
        icon: input.icon ?? 'circle-check',
        accent: input.accent ?? 'teal',
        archived: false,
      });
      await db.habits.add(habit);
      return habit;
    });
  },

  async update(id: string, patch: Partial<Omit<Habit, 'id' | 'createdAt'>>): Promise<Habit> {
    return guard('habits.update', async () => {
      const existing = await db.habits.get(id);
      if (!existing) throw new Error(`Habitude introuvable: ${id}`);
      const updated = prepareUpdate(existing, patch);
      await db.habits.put(updated);
      return updated;
    });
  },

  /** Archive une habitude : elle disparaît du quotidien, l'historique reste. */
  async archive(id: string): Promise<Habit> {
    return habitsRepository.update(id, { archived: true });
  },

  /** Réactive une habitude archivée. */
  async restore(id: string): Promise<Habit> {
    return habitsRepository.update(id, { archived: false });
  },

  /**
   * Supprime une habitude ET ses réalisations.
   * Suppression en cascade pour ne pas laisser d'historique orphelin.
   */
  async remove(id: string): Promise<void> {
    await guard('habits.remove', async () => {
      await db.transaction('rw', db.habits, db.habitCompletions, async () => {
        await db.habitCompletions.where('habitId').equals(id).delete();
        await db.habits.delete(id);
      });
    });
  },

  /* ------------------------------------------------------------------------
     Réalisations
     ------------------------------------------------------------------------ */

  /** Réalisations pour un jour donné. */
  async completionsForDate(date: string): Promise<HabitCompletion[]> {
    return guard('habits.completionsForDate', () =>
      db.habitCompletions.where('date').equals(date).toArray(),
    );
  },

  /** Réalisations d'une habitude sur les derniers jours. */
  async completionDates(habitId: string, days = 90): Promise<string[]> {
    return guard('habits.completionDates', async () => {
      const completions = await db.habitCompletions.where('habitId').equals(habitId).toArray();
      const window = new Set(lastNDays(days));
      return completions
        .map((completion) => completion.date)
        .filter((date) => window.has(date))
        .sort();
    });
  },

  /** Vrai si l'habitude est cochée pour ce jour. */
  async isCompleted(habitId: string, date: string): Promise<boolean> {
    return guard('habits.isCompleted', async () => {
      const match = await db.habitCompletions.where('[habitId+date]').equals([habitId, date]).first();
      return Boolean(match);
    });
  },

  /**
   * Coche l'habitude pour un jour. Idempotent : si la coche existe déjà, elle
   * est renvoyée telle quelle au lieu d'être dupliquée.
   */
  async complete(habitId: string, date: string = todayKey()): Promise<HabitCompletion> {
    return guard('habits.complete', async () => {
      const existing = await db.habitCompletions
        .where('[habitId+date]')
        .equals([habitId, date])
        .first();
      if (existing) return existing;

      const completion = prepareInsert<HabitCompletion>({ habitId, date });
      await db.habitCompletions.add(completion);
      return completion;
    });
  },

  /** Retire la coche du jour. Une correction n'est jamais une punition. */
  async uncomplete(habitId: string, date: string = todayKey()): Promise<void> {
    await guard('habits.uncomplete', async () => {
      const existing = await db.habitCompletions
        .where('[habitId+date]')
        .equals([habitId, date])
        .first();
      if (existing) await db.habitCompletions.delete(existing.id);
    });
  },

  /** Bascule l'état d'une habitude pour un jour, et renvoie le nouvel état. */
  async toggle(habitId: string, date: string = todayKey()): Promise<boolean> {
    const done = await habitsRepository.isCompleted(habitId, date);
    if (done) {
      await habitsRepository.uncomplete(habitId, date);
      return false;
    }
    await habitsRepository.complete(habitId, date);
    return true;
  },

  /* ------------------------------------------------------------------------
     Vue enrichie pour l'UI
     ------------------------------------------------------------------------ */

  /**
   * Habitudes actives accompagnées de leur état du jour, de la semaine et de
   * leur série courante. Un seul passage en base évite les allers-retours.
   */
  async listWithStatus(date: string = todayKey()): Promise<HabitWithStatus[]> {
    return guard('habits.listWithStatus', async () => {
      const habits = (await db.habits.toArray()).filter((habit) => !habit.archived);
      const completions = await db.habitCompletions.toArray();

      const byHabit = new Map<string, Set<string>>();
      for (const completion of completions) {
        const set = byHabit.get(completion.habitId) ?? new Set<string>();
        set.add(completion.date);
        byHabit.set(completion.habitId, set);
      }

      const week = new Set(lastNDays(7, date));

      return habits
        .map((habit) => {
          const dates = byHabit.get(habit.id) ?? new Set<string>();
          const completedThisWeek = [...dates].filter((key) => week.has(key)).length;
          return {
            ...habit,
            doneToday: dates.has(date),
            completedThisWeek,
            streak: computeStreak(dates, date),
          };
        })
        .sort(sortHabits);
    });
  },

  /** Nombre de habitudes actives. */
  async count(): Promise<number> {
    return guard('habits.count', async () => {
      const habits = await db.habits.toArray();
      return habits.filter((habit) => !habit.archived).length;
    });
  },
};

/** Ordre stable : création la plus récente d'abord. */
function sortHabits(a: Habit, b: Habit): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/**
 * Série courante : nombre de jours consécutifs cochés, en remontant depuis
 * `upTo`. Un jour non coché arrête le comptage, sans pénalité rétroactive.
 */
function computeStreak(dates: Set<string>, upTo: string): number {
  if (dates.size === 0) return 0;
  let streak = 0;
  const window = lastNDays(90, upTo);

  for (let index = window.length - 1; index >= 0; index -= 1) {
    const key = window[index];
    if (key === undefined) continue;
    if (dates.has(key)) {
      streak += 1;
    } else if (key !== upTo) {
      // Aujourd'hui peut ne pas encore être coché sans casser la série.
      break;
    }
  }
  return streak;
}

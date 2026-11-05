import { db } from '@/database/db';
import type { Habit, HabitCompletion } from '@/types';
import { lastNDays, nowIso, todayKey } from '@/utils/dates';
import { guard, prepareInsert, prepareUpdate } from './base.repository';

/**
 * Acces aux habitudes et a leurs realisations.
 *
 * La regle produit : on celebre ce qui a ete fait, on ne compte pas les echecs.
 * Les calculs de serie s'interrompent proprement et ne renvoient jamais de
 * valeur negative.
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
  /** Vrai si l'habitude est cochee pour le jour de reference. */
  doneToday: boolean;
  /** Nombre de realisations sur les 7 derniers jours. */
  completedThisWeek: number;
  /** Serie courante (jours consecutifs), bornee a 90 jours d'analyse. */
  streak: number;
}

export const habitsRepository = {
  /** Habitudes actives (non archivees). */
  async listActive(): Promise<Habit[]> {
    return guard('habits.listActive', async () => {
      const habits = await db.habits.toArray();
      return habits.filter((habit) => !habit.archived).sort(sortHabits);
    });
  },

  /** Toutes les habitudes, y compris archivees. */
  async listAll(): Promise<Habit[]> {
    return guard('habits.listAll', async () => {
      const habits = await db.habits.toArray();
      return habits.sort(sortHabits);
    });
  },

  async get(id: string): Promise<Habit | null> {
    return guard('habits.get', async () => (await db.habits.get(id)) ?? null);
  },

  /**
   * Cree une habitude.
   *
   * `lastReviewedAt` est pose explicitement a `null` : une habitude qui vient
   * d'etre creee n'a pas encore ete relue. Le champ est requis par le type
   * depuis la migration v2 — l'omettre laisserait un `undefined` dans une base
   * dont le schema le declare present.
   */
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
        lastReviewedAt: null,
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

  /**
   * Marque une habitude comme relue.
   * Prepare un bilan periodique : l'interface ne s'en sert pas encore, mais le
   * repository expose l'operation pour que le champ ne reste pas inutilisable.
   */
  async markReviewed(id: string): Promise<Habit> {
    return habitsRepository.update(id, { lastReviewedAt: nowIso() });
  },

  /** Archive une habitude : elle disparait du quotidien, l'historique reste. */
  async archive(id: string): Promise<Habit> {
    return habitsRepository.update(id, { archived: true });
  },

  /** Reactive une habitude archivee. */
  async restore(id: string): Promise<Habit> {
    return habitsRepository.update(id, { archived: false });
  },

  /**
   * Supprime une habitude ET ses realisations.
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
     Realisations
     ------------------------------------------------------------------------ */

  /** Realisations pour un jour donne. */
  async completionsForDate(date: string): Promise<HabitCompletion[]> {
    return guard('habits.completionsForDate', () =>
      db.habitCompletions.where('date').equals(date).toArray(),
    );
  },

  /** Realisations d'une habitude sur les derniers jours. */
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

  /** Vrai si l'habitude est cochee pour ce jour. */
  async isCompleted(habitId: string, date: string): Promise<boolean> {
    return guard('habits.isCompleted', async () => {
      const match = await db.habitCompletions.where('[habitId+date]').equals([habitId, date]).first();
      return Boolean(match);
    });
  },

  /**
   * Coche l'habitude pour un jour. Idempotent : si la coche existe deja, elle
   * est renvoyee telle quelle au lieu d'etre dupliquee.
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

  /** Bascule l'etat d'une habitude pour un jour, et renvoie le nouvel etat. */
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
   * Habitudes actives accompagnees de leur etat du jour, de la semaine et de
   * leur serie courante. Un seul passage en base evite les allers-retours.
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

  /** Nombre d'habitudes actives. */
  async count(): Promise<number> {
    return guard('habits.count', async () => {
      const habits = await db.habits.toArray();
      return habits.filter((habit) => !habit.archived).length;
    });
  },
};

/** Ordre stable : creation la plus recente d'abord. */
function sortHabits(a: Habit, b: Habit): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/**
 * Serie courante : nombre de jours consecutifs coches, en remontant depuis
 * `upTo`. Un jour non coche arrete le comptage, sans penalite retroactive.
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
      // Aujourd'hui peut ne pas encore etre coche sans casser la serie.
      break;
    }
  }
  return streak;
}

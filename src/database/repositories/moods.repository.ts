import { db } from '@/database/db';
import type { MoodEntry } from '@/types';
import { todayKey } from '@/utils/dates';
import { guard, prepareInsert, prepareUpdate, sortByDateDesc } from './base.repository';

/**
 * Accès aux check-ins d'humeur.
 *
 * Une journée peut porter plusieurs entrées (l'utilisateur peut se corriger),
 * mais `getForDate` renvoie toujours la plus récente — c'est celle que l'UI
 * affiche comme « humeur du jour ».
 */

export interface CreateMoodInput {
  date?: string;
  mood: MoodEntry['mood'];
  energy?: MoodEntry['energy'];
  note?: string;
  emotions?: string[];
}

export const moodsRepository = {
  /** Toutes les entrées, de la plus récente à la plus ancienne. */
  async listAll(): Promise<MoodEntry[]> {
    return guard('moods.listAll', async () => {
      const entries = await db.moods.toArray();
      return sortByDateDesc(entries);
    });
  },

  /** Les `limit` entrées les plus récentes. */
  async listRecent(limit = 30): Promise<MoodEntry[]> {
    return guard('moods.listRecent', async () => {
      const entries = await db.moods.orderBy('date').reverse().limit(limit).toArray();
      return sortByDateDesc(entries);
    });
  },

  /** Entrées d'une plage de jours (bornes incluses, clés `YYYY-MM-DD`). */
  async listRange(fromKey: string, toKey: string): Promise<MoodEntry[]> {
    return guard('moods.listRange', async () => {
      const entries = await db.moods.where('date').between(fromKey, toKey, true, true).toArray();
      return sortByDateDesc(entries);
    });
  },

  /** L'entrée la plus récente pour un jour donné, ou `null`. */
  async getForDate(date: string): Promise<MoodEntry | null> {
    return guard('moods.getForDate', async () => {
      const entries = await db.moods.where('date').equals(date).toArray();
      if (entries.length === 0) return null;
      return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
    });
  },

  /** Humeur du jour courant, ou `null` si aucun check-in n'a été fait. */
  async getToday(): Promise<MoodEntry | null> {
    return moodsRepository.getForDate(todayKey());
  },

  /** Crée une entrée. Par défaut, elle porte sur aujourd'hui. */
  async create(input: CreateMoodInput): Promise<MoodEntry> {
    return guard('moods.create', async () => {
      const entry = prepareInsert<MoodEntry>({
        date: input.date ?? todayKey(),
        mood: input.mood,
        energy: input.energy,
        note: input.note ?? '',
        emotions: input.emotions ?? [],
      });
      await db.moods.add(entry);
      return entry;
    });
  },

  /** Met à jour une entrée existante. */
  async update(id: string, patch: Partial<Omit<MoodEntry, 'id' | 'createdAt'>>): Promise<MoodEntry> {
    return guard('moods.update', async () => {
      const existing = await db.moods.get(id);
      if (!existing) throw new Error(`Humeur introuvable: ${id}`);
      const updated = prepareUpdate(existing, patch);
      await db.moods.put(updated);
      return updated;
    });
  },

  /**
   * Enregistre le check-in d'un jour : remplace l'entrée du jour si elle existe
   * déjà, la crée sinon. C'est l'opération utilisée par l'écran Today.
   */
  async upsertForDate(input: CreateMoodInput & { date: string }): Promise<MoodEntry> {
    const existing = await moodsRepository.getForDate(input.date);
    if (existing) {
      return moodsRepository.update(existing.id, {
        mood: input.mood,
        energy: input.energy,
        note: input.note ?? existing.note,
        emotions: input.emotions ?? existing.emotions,
      });
    }
    return moodsRepository.create(input);
  },

  /** Supprime une entrée. */
  async remove(id: string): Promise<void> {
    await guard('moods.remove', async () => {
      await db.moods.delete(id);
    });
  },

  /** Nombre total d'entrées. */
  async count(): Promise<number> {
    return guard('moods.count', () => db.moods.count());
  },

  /**
   * Moyenne d'humeur sur les derniers jours.
   * Renvoie `null` s'il n'y a aucune donnée — l'UI affiche alors un état vide
   * plutôt qu'un « 0 » décourageant.
   */
  async averageMood(days = 7): Promise<number | null> {
    return guard('moods.averageMood', async () => {
      const entries = await db.moods.orderBy('date').reverse().limit(days * 3).toArray();
      if (entries.length === 0) return null;
      const total = entries.reduce((sum, entry) => sum + entry.mood, 0);
      return Math.round((total / entries.length) * 10) / 10;
    });
  },
};

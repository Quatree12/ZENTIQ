import { db } from '@/database/db';
import type { JournalEntry, TimelinePoint } from '@/types';
import { todayKey } from '@/utils/dates';
import { guard, prepareInsert, prepareUpdate } from './base.repository';

/**
 * Accès au journal personnel.
 *
 * Le journal reste strictement local. Aucune entrée n'est publiée, partagée ni
 * envoyée : le service d'export ne l'inclut que si l'utilisateur le demande
 * explicitement depuis l'espace ME.
 */

export interface CreateJournalEntryInput {
  date?: string;
  title?: string;
  content: string;
  mood?: JournalEntry['mood'];
  tags?: string[];
}

export const journalRepository = {
  async listAll(): Promise<JournalEntry[]> {
    return guard('journal.listAll', async () => {
      const entries = await db.journal.toArray();
      return sortEntries(entries);
    });
  },

  /** Entrées les plus récentes. */
  async listRecent(limit = 20): Promise<JournalEntry[]> {
    return guard('journal.listRecent', async () => {
      const entries = await db.journal.orderBy('date').reverse().limit(limit).toArray();
      return sortEntries(entries);
    });
  },

  /** Entrées épinglées, affichées en tête de liste. */
  async listPinned(): Promise<JournalEntry[]> {
    return guard('journal.listPinned', async () => {
      const entries = await db.journal.toArray();
      return sortEntries(entries.filter((entry) => entry.pinned));
    });
  },

  async get(id: string): Promise<JournalEntry | null> {
    return guard('journal.get', async () => (await db.journal.get(id)) ?? null);
  },

  /** Entrées d'un jour donné. */
  async listForDate(date: string): Promise<JournalEntry[]> {
    return guard('journal.listForDate', async () => {
      const entries = await db.journal.where('date').equals(date).toArray();
      return sortEntries(entries);
    });
  },

  async create(input: CreateJournalEntryInput): Promise<JournalEntry> {
    return guard('journal.create', async () => {
      const entry = prepareInsert<JournalEntry>({
        date: input.date ?? todayKey(),
        title: input.title?.trim() ?? '',
        content: input.content.trim(),
        mood: input.mood,
        tags: input.tags ?? [],
        pinned: false,
      });
      await db.journal.add(entry);
      return entry;
    });
  },

  async update(
    id: string,
    patch: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>,
  ): Promise<JournalEntry> {
    return guard('journal.update', async () => {
      const existing = await db.journal.get(id);
      if (!existing) throw new Error(`Entrée de journal introuvable: ${id}`);
      const updated = prepareUpdate(existing, patch);
      await db.journal.put(updated);
      return updated;
    });
  },

  /** Épingle / désépingle une entrée. */
  async togglePin(id: string): Promise<JournalEntry> {
    const existing = await db.journal.get(id);
    if (!existing) throw new Error(`Entrée de journal introuvable: ${id}`);
    return journalRepository.update(id, { pinned: !existing.pinned });
  },

  async remove(id: string): Promise<void> {
    await guard('journal.remove', async () => {
      await db.journal.delete(id);
    });
  },

  async count(): Promise<number> {
    return guard('journal.count', () => db.journal.count());
  },

  /**
   * Construit la timeline d'évolution personnelle à partir de toutes les
   * sources disponibles. C'est la matière première de l'espace JOURNEY.
   */
  async buildTimeline(limit = 60): Promise<TimelinePoint[]> {
    return guard('journal.buildTimeline', async () => {
      const [entries, moods, goals, completions, habits] = await Promise.all([
        db.journal.toArray(),
        db.moods.toArray(),
        db.goals.toArray(),
        db.habitCompletions.toArray(),
        db.habits.toArray(),
      ]);

      const habitNames = new Map(habits.map((habit) => [habit.id, habit.name]));
      const points: TimelinePoint[] = [];

      for (const entry of entries) {
        points.push({
          id: `journal:${entry.id}`,
          date: entry.date,
          kind: 'journal',
          label: entry.title.trim() || 'Entrée de journal',
          detail: truncateDetail(entry.content),
        });
      }

      for (const mood of moods) {
        points.push({
          id: `mood:${mood.id}`,
          date: mood.date,
          kind: 'mood',
          label: "Check-in d'humeur",
          detail: mood.note.trim() || undefined,
        });
      }

      for (const goal of goals) {
        if (goal.status !== 'completed' || !goal.completedAt) continue;
        points.push({
          id: `goal:${goal.id}`,
          date: goal.completedAt.slice(0, 10),
          kind: 'goal',
          label: goal.title,
          detail: 'Objectif atteint',
        });
      }

      for (const completion of completions) {
        const name = habitNames.get(completion.habitId);
        if (!name) continue;
        points.push({
          id: `habit:${completion.id}`,
          date: completion.date,
          kind: 'habit',
          label: name,
          detail: completion.note,
        });
      }

      return points
        .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)))
        .slice(0, limit);
    });
  },
};

/** Ordre d'affichage : épinglés, puis jour décroissant, puis création récente. */
function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Aperçu court du contenu, pour la timeline. */
function truncateDetail(content: string): string | undefined {
  const clean = content.replace(/\s+/g, ' ').trim();
  if (!clean) return undefined;
  return clean.length > 120 ? `${clean.slice(0, 120)}…` : clean;
}

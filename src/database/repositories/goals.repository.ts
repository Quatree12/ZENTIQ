import { db } from '@/database/db';
import type { Goal, GoalStatus } from '@/types';
import { nowIso } from '@/utils/dates';
import { guard, prepareInsert, prepareUpdate } from './base.repository';

/**
 * Accès aux objectifs personnels.
 *
 * Aucune notion de classement ni de comparaison : un objectif appartient à la
 * personne qui l'écrit. Les opérations restent donc volontairement simples.
 */

export interface CreateGoalInput {
  title: string;
  motivation?: string;
  horizon?: Goal['horizon'];
  targetDate?: string;
  nextStep?: string;
  isPriority?: boolean;
}

export const goalsRepository = {
  async listAll(): Promise<Goal[]> {
    return guard('goals.listAll', async () => {
      const goals = await db.goals.toArray();
      return sortGoals(goals);
    });
  },

  /** Objectifs par statut. */
  async listByStatus(status: GoalStatus): Promise<Goal[]> {
    return guard('goals.listByStatus', async () => {
      const goals = await db.goals.where('status').equals(status).toArray();
      return sortGoals(goals);
    });
  },

  /** Objectifs en cours, priorités d'abord. */
  async listActive(): Promise<Goal[]> {
    return goalsRepository.listByStatus('active');
  },

  async get(id: string): Promise<Goal | null> {
    return guard('goals.get', async () => (await db.goals.get(id)) ?? null);
  },

  async create(input: CreateGoalInput): Promise<Goal> {
    return guard('goals.create', async () => {
      const goal = prepareInsert<Goal>({
        title: input.title.trim(),
        motivation: input.motivation?.trim() ?? '',
        status: 'active',
        horizon: input.horizon ?? 'medium',
        targetDate: input.targetDate,
        progress: 0,
        isPriority: input.isPriority ?? false,
        nextStep: input.nextStep?.trim() ?? '',
      });
      await db.goals.add(goal);
      return goal;
    });
  },

  async update(id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>): Promise<Goal> {
    return guard('goals.update', async () => {
      const existing = await db.goals.get(id);
      if (!existing) throw new Error(`Objectif introuvable: ${id}`);

      // Passer à « atteint » horodate la réussite, une seule fois.
      const completedAt =
        patch.status === 'completed' && existing.status !== 'completed'
          ? nowIso()
          : patch.status && patch.status !== 'completed'
            ? undefined
            : existing.completedAt;

      const updated = prepareUpdate(existing, {
        ...patch,
        progress: patch.progress !== undefined ? clampProgress(patch.progress) : existing.progress,
        ...(completedAt === undefined ? {} : { completedAt }),
      });
      await db.goals.put(updated);
      return updated;
    });
  },

  /** Ajuste l'avancement d'un objectif (0..100). */
  async setProgress(id: string, progress: number): Promise<Goal> {
    return goalsRepository.update(id, { progress: clampProgress(progress) });
  },

  /** Marque un objectif comme atteint. */
  async complete(id: string): Promise<Goal> {
    return goalsRepository.update(id, { status: 'completed', progress: 100 });
  },

  /** Supprime un objectif. */
  async remove(id: string): Promise<void> {
    await guard('goals.remove', async () => {
      await db.goals.delete(id);
    });
  },

  async count(): Promise<number> {
    return guard('goals.count', () => db.goals.count());
  },

  /** Nombre d'objectifs atteints — sert à la progression globale. */
  async countCompleted(): Promise<number> {
    return guard('goals.countCompleted', () => db.goals.where('status').equals('completed').count());
  },
};

/** Ordre d'affichage : priorités, puis date cible, puis création récente. */
function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
    if (a.targetDate && b.targetDate && a.targetDate !== b.targetDate) {
      return a.targetDate.localeCompare(b.targetDate);
    }
    if (a.targetDate && !b.targetDate) return -1;
    if (!a.targetDate && b.targetDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Bornage de l'avancement — évite d'enregistrer 120 % ou -10. */
function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

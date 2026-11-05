import { db } from '@/database/db';
import type { Challenge, ChallengeDay, ChallengeStatus } from '@/types';
import { nowIso, shiftDays, todayKey } from '@/utils/dates';
import { guard, prepareInsert, prepareUpdate } from './base.repository';

/**
 * Acces aux challenges.
 *
 * DEUX INVARIANTS TENUS ICI, et nulle part ailleurs :
 *
 *   1. `daysCompleted` est toujours DERIVE de `days`. Il n'est jamais fourni
 *      par l'appelant, jamais incremente a la main. C'est ce qui rend
 *      impossible une progression qui ne correspondrait pas aux etapes
 *      reellement cochees.
 *
 *   2. `endDate` est toujours DERIVE de `startDate + durationDays - 1`. Le
 *      challenge dure N jours, jour de depart inclus : un « 7 jours » qui
 *      commence jeudi finit le mercredi suivant.
 *
 * Le statut est recalcule a chaque lecture : un challenge dont la date de
 * depart est passee devient actif sans qu'aucune tache planifiee n'ait a le
 * faire.
 */

export interface CreateChallengeInput {
  title: string;
  description?: string;
  goal?: string;
  durationDays: number;
  /** Jour de depart `YYYY-MM-DD`. Par defaut, aujourd'hui. */
  startDate?: string;
  /** Libelles des etapes. Si absent, un libelle generique par jour est utilise. */
  steps?: string[];
  habitId?: string;
}

/** Construit les N etapes d'un challenge, en reprenant les libelles fournis. */
function buildDays(durationDays: number, steps: string[] = []): ChallengeDay[] {
  return Array.from({ length: durationDays }, (_, index) => ({
    dayNumber: index + 1,
    label: (steps[index] ?? '').trim() || 'Action du jour ' + (index + 1),
  }));
}

/** Dernier jour du challenge : depart + duree - 1. */
export function computeEndDate(startDate: string, durationDays: number): string {
  return shiftDays(startDate, Math.max(0, durationDays - 1));
}

/** Compteur derive des etapes completees. Jamais saisi a la main. */
function countCompleted(days: ChallengeDay[]): number {
  return days.filter((day) => day.completedAt !== undefined).length;
}

/**
 * Recalcule le statut a partir de la seule realite : les dates et les etapes.
 *
 * - toutes les etapes faites     -> completed
 * - jour de depart dans le futur -> upcoming
 * - mis de cote manuellement     -> abandoned (jamais ecrase)
 * - sinon                        -> active
 */
export function resolveStatus(
  challenge: Challenge,
  reference: string = todayKey(),
): ChallengeStatus {
  if (challenge.status === 'abandoned') return 'abandoned';
  if (challenge.days.every((day) => day.completedAt !== undefined)) return 'completed';
  if (challenge.startDate > reference) return 'upcoming';
  return 'active';
}

/** Applique le statut recalcule et le compteur derive. */
function withDerived(challenge: Challenge, reference?: string): Challenge {
  const status = resolveStatus(challenge, reference);
  return {
    ...challenge,
    status,
    daysCompleted: countCompleted(challenge.days),
    completedAt: status === 'completed' ? challenge.completedAt ?? nowIso() : undefined,
  };
}

export const challengesRepository = {
  /** Tous les challenges, avec statut et compteur a jour. */
  async listAll(): Promise<Challenge[]> {
    return guard('challenges.listAll', async () => {
      const items = await db.challenges.toArray();
      return items.map((item) => withDerived(item)).sort(sortChallenges);
    });
  },

  /** Challenges par statut. */
  async listByStatus(status: ChallengeStatus): Promise<Challenge[]> {
    return guard('challenges.listByStatus', async () => {
      const items = await db.challenges.where('status').equals(status).toArray();
      return items.map((item) => withDerived(item)).sort(sortChallenges);
    });
  },

  /** Les challenges en cours. */
  async listActive(): Promise<Challenge[]> {
    return challengesRepository.listByStatus('active');
  },

  async get(id: string): Promise<Challenge | null> {
    return guard('challenges.get', async () => {
      const item = await db.challenges.get(id);
      return item ? withDerived(item) : null;
    });
  },

  /**
   * Cree un challenge.
   * Les etapes et la date de fin sont construites ici, jamais par l'appelant.
   */
  async create(input: CreateChallengeInput): Promise<Challenge> {
    return guard('challenges.create', async () => {
      const startDate = input.startDate ?? todayKey();
      const durationDays = Math.max(1, Math.round(input.durationDays));
      const days = buildDays(durationDays, input.steps);

      const challenge = prepareInsert<Challenge>({
        title: input.title.trim(),
        description: input.description?.trim() ?? '',
        goal: input.goal?.trim() ?? '',
        durationDays,
        startDate,
        endDate: computeEndDate(startDate, durationDays),
        status: 'upcoming',
        daysCompleted: 0,
        days,
        habitId: input.habitId,
      });

      const derived = withDerived(challenge);
      await db.challenges.add(derived);
      return derived;
    });
  },

  /**
   * Coche l'etape d'un jour donne.
   *
   * IDEMPOTENT : si l'etape est deja cochee, la fonction renvoie le challenge
   * inchange sans rien ecrire. C'est ce qui garantit qu'une journee ne peut
   * jamais etre comptee deux fois.
   */
  async completeDay(
    id: string,
    dayNumber: number,
    date: string = todayKey(),
  ): Promise<Challenge | null> {
    return guard('challenges.completeDay', async () => {
      const existing = await db.challenges.get(id);
      if (!existing) return null;

      const index = existing.days.findIndex((day) => day.dayNumber === dayNumber);
      if (index === -1) return withDerived(existing);

      const target = existing.days[index];
      // Deja cochee : on ne recompte pas, on ne reecrit pas.
      if (target === undefined || target.completedAt !== undefined) {
        return withDerived(existing);
      }

      const days = existing.days.map((day, position) =>
        position === index ? { ...day, completedAt: date } : day,
      );

      const updated = withDerived({ ...existing, days }, date);
      await db.challenges.put(prepareUpdate(existing, updated));
      return updated;
    });
  },

  /**
   * Retire la coche d'un jour.
   * Une correction n'est jamais une punition : l'action doit rester possible.
   */
  async uncompleteDay(id: string, dayNumber: number): Promise<Challenge | null> {
    return guard('challenges.uncompleteDay', async () => {
      const existing = await db.challenges.get(id);
      if (!existing) return null;

      const days: ChallengeDay[] = existing.days.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        return { dayNumber: day.dayNumber, label: day.label };
      });

      const updated = withDerived({ ...existing, days }, todayKey());
      await db.challenges.put(prepareUpdate(existing, updated));
      return updated;
    });
  },

  /** Met un challenge de cote. Il n'est jamais « rate » : il est mis de cote. */
  async setAside(id: string): Promise<Challenge | null> {
    return guard('challenges.setAside', async () => {
      const existing = await db.challenges.get(id);
      if (!existing) return null;

      const updated = prepareUpdate(existing, { status: 'abandoned' });
      await db.challenges.put(updated);
      return updated;
    });
  },

  /** Reprend un challenge mis de cote. */
  async resume(id: string): Promise<Challenge | null> {
    return guard('challenges.resume', async () => {
      const existing = await db.challenges.get(id);
      if (!existing) return null;

      const restored = withDerived({ ...existing, status: 'active' });
      await db.challenges.put(prepareUpdate(existing, restored));
      return restored;
    });
  },

  /** Supprime un challenge. Ses etapes disparaissent avec lui. */
  async remove(id: string): Promise<void> {
    await guard('challenges.remove', async () => {
      await db.challenges.delete(id);
    });
  },

  async count(): Promise<number> {
    return guard('challenges.count', () => db.challenges.count());
  },

  /** Nombre de challenges en cours — utilise par la synthese de Journey. */
  async countActive(): Promise<number> {
    return guard('challenges.countActive', async () => {
      const items = await db.challenges.toArray();
      return items
        .map((item) => withDerived(item))
        .filter((item) => item.status === 'active').length;
    });
  },
};

/**
 * Ordre d'affichage : en cours d'abord, puis a venir, puis termine.
 * A l'interieur d'un statut, le depart le plus recent passe en tete.
 */
const STATUS_ORDER: Record<ChallengeStatus, number> = {
  active: 0,
  upcoming: 1,
  completed: 2,
  abandoned: 3,
};

function sortChallenges(a: Challenge, b: Challenge): number {
  const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (byStatus !== 0) return byStatus;
  return b.startDate.localeCompare(a.startDate);
}

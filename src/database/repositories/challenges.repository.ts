import { db } from '@/database/db';
import type {
  Challenge,
  ChallengeDay,
  ChallengeMilestone,
  ChallengeRhythm,
  ChallengeStatus,
} from '@/types';
import { nowIso, shiftDays, todayKey } from '@/utils/dates';
import { guard, prepareInsert, prepareUpdate } from './base.repository';

/**
 * Accès aux challenges — version avancée.
 *
 * DEUX INVARIANTS TENUS ICI, et nulle part ailleurs :
 *
 *   1. `daysCompleted` est toujours DÉRIVÉ de `days`. Il n'est jamais fourni
 *      par l'appelant, jamais incrémenté à la main. C'est ce qui rend
 *      impossible une progression qui ne correspondrait pas aux étapes
 *      réellement cochées.
 *
 *   2. `endDate` est toujours DÉRIVÉ de `startDate + durationDays - 1 +
 *      postponedDays`. Le challenge dure N jours, jour de départ inclus, et
 *      chaque report le décale d'autant.
 *
 * TROISIÈME INVARIANT, ajouté avec les jalons :
 *
 *   3. Un jalon est FRANCHI quand toutes les étapes qu'il couvre sont faites.
 *      Sa date de franchissement est relevée sur les étapes elles-mêmes, jamais
 *      inventée. Un jalon ne peut donc pas être « atteint » sans progression
 *      réelle.
 *
 * QUATRIÈME INVARIANT, ajouté avec l'édition des étapes :
 *
 *   4. Une étape ne voit JAMAIS sa coche modifiée par l'édition du libellé.
 *      `updateSteps` réécrit les `label` en préservant `completedAt`
 *      position par position — la progression est de la donnée, pas du texte.
 *
 * Le statut est recalculé à chaque lecture : un challenge dont la date de
 * départ est passée devient actif sans qu'aucune tâche planifiée n'ait à le
 * faire.
 */

export interface CreateChallengeInput {
  title: string;
  description?: string;
  goal?: string;
  durationDays: number;
  /** Jour de départ `YYYY-MM-DD`. Par défaut, aujourd'hui. */
  startDate?: string;
  /** Libellés des étapes. Si absent, un libellé générique par jour est utilisé. */
  steps?: string[];
  habitId?: string;
  /** Rythme choisi. Par défaut `once` — le parcours linéaire historique. */
  rhythm?: ChallengeRhythm;
  /** Cible par période, pour le rythme `recurring`. */
  targetPerPeriod?: number;
  /** Jalons demandés, sous forme « jusqu'au jour N » + titre. */
  milestones?: Array<{ title: string; throughDay: number }>;
}

/**
 * Modification d'un challenge existant.
 *
 * Seuls les champs EDITABLES y figurent : ni `daysCompleted`, ni `status`, ni
 * `endDate`. Ces valeurs sont dérivées ou liées à un cycle de vie qui a ses
 * propres méthodes (`completeDay`, `postpone`, `setAside`).
 *
 * `steps` n'y figure PAS : les étapes se modifient par `updateSteps`, qui a sa
 * propre garantie — préserver les coches. Les accepter ici laisserait un
 * appelant écrire `days` en bloc et effacer une progression réelle.
 */
export interface UpdateChallengeInput {
  title?: string;
  description?: string;
  goal?: string;
  /** Jalons complets, en remplacement. Un tableau vide les supprime tous. */
  milestones?: Array<{ title: string; throughDay: number }>;
  /** Cible par période, uniquement pour un rythme `recurring`. */
  targetPerPeriod?: number;
}

/** Construit les N étapes d'un challenge, en reprenant les libellés fournis. */
function buildDays(durationDays: number, steps: string[] = []): ChallengeDay[] {
  return Array.from({ length: durationDays }, (_, index) => ({
    dayNumber: index + 1,
    label: (steps[index] ?? '').trim() || 'Action du jour ' + (index + 1),
  }));
}

/**
 * Construit les jalons demandés, en les bornant à la durée réelle.
 *
 * Un jalon qui couvrirait plus de jours que le challenge n'en compte ne serait
 * jamais franchi : on le ramène à la durée, pour qu'il reste atteignable.
 */
function buildMilestones(
  requested: Array<{ title: string; throughDay: number }> | undefined,
  durationDays: number,
): ChallengeMilestone[] {
  if (!requested || requested.length === 0) return [];

  return requested
    .map((item) => ({
      title: item.title.trim(),
      throughDay: Math.min(Math.max(1, Math.round(item.throughDay)), durationDays),
    }))
    .filter((item) => item.title.length > 0)
    .sort((a, b) => a.throughDay - b.throughDay)
    .map((item, index) => ({ index: index + 1, title: item.title, throughDay: item.throughDay }));
}

/** Dernier jour du challenge : départ + durée - 1 + reports. */
export function computeEndDate(
  startDate: string,
  durationDays: number,
  postponedDays = 0,
): string {
  return shiftDays(startDate, Math.max(0, durationDays - 1) + Math.max(0, postponedDays));
}

/** Compteur dérivé des étapes complétées. Jamais saisi à la main. */
function countCompleted(days: ChallengeDay[]): number {
  return days.filter((day) => day.completedAt !== undefined).length;
}

/**
 * Recalcule les jalons depuis les étapes réellement faites.
 *
 * La date de franchissement est celle de la DERNIÈRE étape du jalon : c'est le
 * jour où, concrètement, le jalon a été atteint. Si le jalon n'est pas encore
 * franchi, `reachedAt` est retiré — un jalon franchi ne peut pas le redevenir
 * après décochage.
 */
function deriveMilestones(
  milestones: ChallengeMilestone[] | undefined,
  days: ChallengeDay[],
): ChallengeMilestone[] {
  if (!milestones || milestones.length === 0) return [];

  return milestones.map((milestone) => {
    const covered = days.filter((day) => day.dayNumber <= milestone.throughDay);
    const reached = covered.length > 0 && covered.every((day) => day.completedAt !== undefined);

    if (!reached) return { ...milestone, reachedAt: undefined };

    // Date la plus tardive parmi les étapes du jalon.
    const dates = covered
      .map((day) => day.completedAt)
      .filter((value): value is string => value !== undefined)
      .sort();

    return { ...milestone, reachedAt: dates[dates.length - 1] };
  });
}

/**
 * Recalcule le statut à partir de la seule réalité : les dates et les étapes.
 *
 * - toutes les étapes faites     -> completed
 * - jour de départ dans le futur -> upcoming
 * - mis de côté manuellement     -> abandoned (jamais écrasé)
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

/** Applique le statut recalculé, le compteur dérivé et les jalons dérivés. */
function withDerived(challenge: Challenge, reference?: string): Challenge {
  const status = resolveStatus(challenge, reference);
  const milestones = deriveMilestones(challenge.milestones, challenge.days);

  return {
    ...challenge,
    status,
    daysCompleted: countCompleted(challenge.days),
    milestones,
    endDate: computeEndDate(
      challenge.startDate,
      challenge.durationDays,
      challenge.postponedDays ?? 0,
    ),
    completedAt: status === 'completed' ? challenge.completedAt ?? nowIso() : undefined,
  };
}

export const challengesRepository = {
  /** Tous les challenges, avec statut, compteur et jalons à jour. */
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

  /** Challenges filtrés par rythme. */
  async listByRhythm(rhythm: ChallengeRhythm): Promise<Challenge[]> {
    return guard('challenges.listByRhythm', async () => {
      const all = await challengesRepository.listAll();
      // Un challenge sans rythme explicite est `once` : il doit apparaître
      // dans ce filtre, sinon il disparaîtrait de la vue sans raison.
      return all.filter((item) => (item.rhythm ?? 'once') === rhythm);
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
   * Crée un challenge.
   * Les étapes, la date de fin et les jalons sont construits ici, jamais par
   * l'appelant.
   */
  async create(input: CreateChallengeInput): Promise<Challenge> {
    return guard('challenges.create', async () => {
      const startDate = input.startDate ?? todayKey();
      const durationDays = Math.max(1, Math.round(input.durationDays));
      const days = buildDays(durationDays, input.steps);
      const rhythm = input.rhythm ?? 'once';

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
        rhythm,
        rhythmConfig:
          rhythm === 'recurring'
            ? { rhythm, targetPerPeriod: input.targetPerPeriod, periodDays: 7 }
            : { rhythm },
        milestones: buildMilestones(input.milestones, durationDays),
        postponedDays: 0,
      });

      const derived = withDerived(challenge);
      await db.challenges.add(derived);
      return derived;
    });
  },

  /**
   * Modifie un challenge existant.
   *
   * SEULS LES CHAMPS EDITABLES SONT ACCEPTÉS, et c'est délibéré :
   *   - `days` n'est jamais remplacé en bloc. Les étapes portent des coches ;
   *     les réécrire effacerait une progression réelle. Pour les libellés, voir
   *     `updateSteps`, qui préserve `completedAt`.
   *   - `status`, `endDate` et `daysCompleted` sont dérivés.
   *
   * Les jalons, eux, sont remplacés en bloc. Leur date de franchissement est
   * recalculée à partir des étapes : modifier un jalon ne peut donc pas créer
   * un jalon « atteint » sans progression.
   */
  async update(id: string, input: UpdateChallengeInput): Promise<Challenge | null> {
    return guard('challenges.update', async () => {
      const existing = await db.challenges.get(id);
      if (!existing) return null;

      const patch: Partial<Challenge> = {};

      if (input.title !== undefined) patch.title = input.title.trim();
      if (input.description !== undefined) patch.description = input.description.trim();
      if (input.goal !== undefined) patch.goal = input.goal.trim();

      if (input.milestones !== undefined) {
        patch.milestones = buildMilestones(input.milestones, existing.durationDays);
      }

      if (input.targetPerPeriod !== undefined && existing.rhythm === 'recurring') {
        patch.rhythmConfig = {
          rhythm: 'recurring',
          targetPerPeriod: input.targetPerPeriod,
          periodDays: existing.rhythmConfig?.periodDays ?? 7,
        };
      }

      const updated = withDerived({ ...existing, ...patch }, todayKey());
      await db.challenges.put(prepareUpdate(existing, updated));
      return updated;
    });
  },

  /**
   * Réécrit les LIBELLÉS des étapes, en préservant intégralement les coches.
   *
   * C'est la seule opération autorisée à toucher `days`, et elle ne le fait que
   * champs par champs :
   *
   *   - `label`      : remplacé par le texte fourni, ou laissé tel quel si
   *                    l'entrée correspondante est absente ou vide ;
   *   - `completedAt`: JAMAIS modifié. Copié à l'identique depuis l'étape
   *                    existante, position par position ;
   *   - `dayNumber`  : conservé, c'est la clé de lecture des jalons.
   *
   * Le nombre d'étapes ne change pas non plus : la durée d'un challenge se
   * décide à la création, et l'étendre après coup romprait le lien entre les
   * jalons et les jours qu'ils couvrent.
   *
   * Une progression ne peut donc pas être perdue par une correction de texte,
   * et un jalon franchi le reste.
   */
  async updateSteps(id: string, labels: string[]): Promise<Challenge | null> {
    return guard('challenges.updateSteps', async () => {
      const existing = await db.challenges.get(id);
      if (!existing) return null;

      const days: ChallengeDay[] = existing.days.map((day, position) => {
        const provided = (labels[position] ?? '').trim();
        // Libellé vide : on garde l'ancien plutôt que d'effacer le texte. Un
        // champ vidé par accident ne doit pas faire disparaître une étape.
        const label = provided.length > 0 ? provided : day.label;
        return { dayNumber: day.dayNumber, label, completedAt: day.completedAt };
      });

      const updated = withDerived({ ...existing, days }, todayKey());
      await db.challenges.put(prepareUpdate(existing, updated));
      return updated;
    });
  },

  /**
   * Coche l'étape d'un jour donné.
   *
   * IDEMPOTENT : si l'étape est déjà cochée, la fonction renvoie le challenge
   * inchangé sans rien écrire. C'est ce qui garantit qu'une journée ne peut
   * jamais être comptée deux fois.
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
      // Déjà cochée : on ne recompte pas, on ne réécrit pas.
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

  /**
   * Reporte un challenge de quelques jours.
   *
   * RÈGLE PRODUIT : un jour manqué n'est JAMAIS une remise à zéro. L'utilisateur
   * décale son challenge, `endDate` est recalculé, et le compteur de reports
   * augmente. Aucune étape n'est décochée, aucune progression n'est perdue.
   *
   * Le report est borné : au-delà de 30 jours cumulés, on refuse plutôt que de
   * laisser glisser indéfiniment un challenge qui ne se termine jamais.
   */
  async postpone(id: string, days = 1): Promise<Challenge | null> {
    return guard('challenges.postpone', async () => {
      const existing = await db.challenges.get(id);
      if (!existing) return null;

      const requested = Math.max(1, Math.round(days));
      const already = existing.postponedDays ?? 0;
      const applied = Math.min(requested, Math.max(0, 30 - already));
      if (applied === 0) return withDerived(existing);

      const postponedDays = already + applied;
      const updated = withDerived({ ...existing, postponedDays }, todayKey());
      await db.challenges.put(prepareUpdate(existing, updated));
      return updated;
    });
  },

  /** Met un challenge de côté. Il n'est jamais « raté » : il est mis de côté. */
  async setAside(id: string): Promise<Challenge | null> {
    return guard('challenges.setAside', async () => {
      const existing = await db.challenges.get(id);
      if (!existing) return null;

      const updated = prepareUpdate(existing, { status: 'abandoned' });
      await db.challenges.put(updated);
      return updated;
    });
  },

  /** Reprend un challenge mis de côté. */
  async resume(id: string): Promise<Challenge | null> {
    return guard('challenges.resume', async () => {
      const existing = await db.challenges.get(id);
      if (!existing) return null;

      const restored = withDerived({ ...existing, status: 'active' });
      await db.challenges.put(prepareUpdate(existing, restored));
      return restored;
    });
  },

  /** Supprime un challenge. Ses étapes disparaissent avec lui. */
  async remove(id: string): Promise<void> {
    await guard('challenges.remove', async () => {
      await db.challenges.delete(id);
    });
  },

  async count(): Promise<number> {
    return guard('challenges.count', () => db.challenges.count());
  },

  /** Nombre de challenges en cours — utilisé par la synthèse de Journey. */
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
 * Ordre d'affichage : en cours d'abord, puis à venir, puis terminé.
 * À l'intérieur d'un statut, le départ le plus récent passe en tête.
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

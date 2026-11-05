/**
 * Tests des challenges.
 *
 * Deux niveaux :
 *   1. Le module pur `@/utils/challenge-stats` — progression, etapes, resume.
 *   2. Le repository, sur une IndexedDB simulee avec `fake-indexeddb`.
 *
 * C'est le second niveau qui verifie les invariants les plus importants :
 * idempotence d'une coche, compteur derive, derivation de la date de fin, et
 * persistance reelle.
 *
 * NOTE : `fake-indexeddb/auto` est importe en tout premier, AVANT tout module
 * qui touche a Dexie. Sans cela, `db.ts` s'initialiserait sans IndexedDB et
 * tous les tests de persistance echoueraient.
 */
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  computeChallengeProgress,
  describePace,
  summarizeChallenges,
  viewChallengeDays,
} from '@/utils/challenge-stats';
import { computeEndDate } from '@/database/repositories';
import type { Challenge, ChallengeDay } from '@/types';
import { shiftDays, todayKey } from '@/utils/dates';

/* --------------------------------------------------------------------------
   Fabriques
   -------------------------------------------------------------------------- */

function days(count: number, completedCount = 0): ChallengeDay[] {
  return Array.from({ length: count }, (_, index) => ({
    dayNumber: index + 1,
    label: 'Etape ' + (index + 1),
    ...(index < completedCount ? { completedAt: todayKey() } : {}),
  }));
}

function challenge(overrides: Partial<Challenge> = {}): Challenge {
  const durationDays = overrides.durationDays ?? 7;
  const startDate = overrides.startDate ?? todayKey();
  return {
    id: 'c-1',
    title: 'Test',
    description: '',
    goal: '',
    durationDays,
    startDate,
    endDate: computeEndDate(startDate, durationDays),
    status: 'active',
    daysCompleted: 0,
    days: days(durationDays),
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
    ...overrides,
  };
}

/* --------------------------------------------------------------------------
   1. PROGRESSION
   -------------------------------------------------------------------------- */

describe('computeChallengeProgress', () => {
  it('donne une progression de 0 % sur un challenge neuf', () => {
    const progress = computeChallengeProgress(challenge({ durationDays: 7 }));
    expect(progress.percent).toBe(0);
    expect(progress.completedDays).toBe(0);
    expect(progress.totalDays).toBe(7);
    expect(progress.remainingDays).toBe(7);
    expect(progress.isComplete).toBe(false);
  });

  it('donne une progression intermediaire exacte', () => {
    const progress = computeChallengeProgress(
      challenge({ durationDays: 7, days: days(7, 3) }),
    );
    expect(progress.completedDays).toBe(3);
    expect(progress.percent).toBe(43);
    expect(progress.remainingDays).toBe(4);
  });

  it('donne une progression de 100 % quand tout est fait', () => {
    const progress = computeChallengeProgress(
      challenge({ durationDays: 7, days: days(7, 7) }),
    );
    expect(progress.percent).toBe(100);
    expect(progress.isComplete).toBe(true);
    expect(progress.remainingDays).toBe(0);
  });

  it('gere un challenge de 3 jours', () => {
    const progress = computeChallengeProgress(
      challenge({ durationDays: 3, days: days(3, 1) }),
    );
    expect(progress.totalDays).toBe(3);
    expect(progress.percent).toBe(33);
  });

  it('propose le jour 1 pour un challenge qui commence aujourd hui', () => {
    const progress = computeChallengeProgress(challenge({ startDate: todayKey() }));
    expect(progress.todayStepNumber).toBe(1);
    expect(progress.todayDone).toBe(false);
  });

  it('propose le jour 3 pour un challenge commence il y a deux jours', () => {
    const progress = computeChallengeProgress(
      challenge({ startDate: shiftDays(todayKey(), -2) }),
    );
    expect(progress.todayStepNumber).toBe(3);
  });

  it('ne propose aucune etape hors de la fenetre du challenge', () => {
    const past = computeChallengeProgress(
      challenge({ startDate: shiftDays(todayKey(), -30), durationDays: 3 }),
    );
    expect(past.todayStepNumber).toBeNull();

    const future = computeChallengeProgress(
      challenge({ startDate: shiftDays(todayKey(), 5) }),
    );
    expect(future.todayStepNumber).toBeNull();
  });

  it('indique que l etape du jour est faite', () => {
    const progress = computeChallengeProgress(
      challenge({ startDate: todayKey(), days: days(7, 1) }),
    );
    expect(progress.todayDone).toBe(true);
  });

  it('renvoie null si la duree est invalide, sans afficher un faux 0 %', () => {
    const progress = computeChallengeProgress(challenge({ durationDays: 0, days: [] }));
    expect(progress.percent).toBeNull();
  });
});

/* --------------------------------------------------------------------------
   2. ETAPES
   -------------------------------------------------------------------------- */

describe('viewChallengeDays', () => {
  it('associe chaque etape a son jour calendaire', () => {
    const start = '2026-03-01';
    const view = viewChallengeDays(challenge({ startDate: start, durationDays: 3 }), start);

    expect(view[0]?.date).toBe('2026-03-01');
    expect(view[1]?.date).toBe('2026-03-02');
    expect(view[2]?.date).toBe('2026-03-03');
  });

  it('marque le jour courant', () => {
    const today = todayKey();
    const view = viewChallengeDays(challenge({ startDate: today, durationDays: 3 }), today);
    expect(view[0]?.isToday).toBe(true);
    expect(view[1]?.isToday).toBe(false);
  });

  it('laisse un jour passe non coche actionnable (rattrapage)', () => {
    const today = todayKey();
    const start = shiftDays(today, -2);
    const view = viewChallengeDays(challenge({ startDate: start, durationDays: 5 }), today);

    expect(view[0]?.isPast).toBe(true);
    expect(view[0]?.isActionable).toBe(true);
  });

  it('rend un jour passe deja coche non actionnable', () => {
    const today = todayKey();
    const start = shiftDays(today, -2);
    const base = challenge({ startDate: start, durationDays: 5 });
    const withDone = {
      ...base,
      days: base.days.map((day, index) =>
        index === 0 ? { ...day, completedAt: start } : day,
      ),
    };

    const view = viewChallengeDays(withDone, today);
    expect(view[0]?.isActionable).toBe(false);
  });
});

/* --------------------------------------------------------------------------
   3. RESUME
   -------------------------------------------------------------------------- */

describe('summarizeChallenges', () => {
  it('renvoie un resume vide sans challenge', () => {
    const summary = summarizeChallenges([]);
    expect(summary.total).toBe(0);
    expect(summary.active).toBe(0);
    expect(summary.averageProgress).toBeNull();
  });

  it('compte chaque statut separement', () => {
    const summary = summarizeChallenges([
      challenge({ id: 'a', status: 'active' }),
      challenge({ id: 'b', status: 'active' }),
      challenge({ id: 'c', status: 'completed', days: days(7, 7) }),
      challenge({ id: 'd', status: 'upcoming' }),
      challenge({ id: 'e', status: 'abandoned' }),
    ]);

    expect(summary.total).toBe(5);
    expect(summary.active).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.upcoming).toBe(1);
    expect(summary.setAside).toBe(1);
  });

  it('ne moyenne la progression que sur les challenges en cours', () => {
    const summary = summarizeChallenges([
      challenge({ id: 'a', status: 'active', days: days(10, 5) }),
      challenge({ id: 'b', status: 'active', days: days(10, 10) }),
    ]);
    expect(summary.averageProgress).toBe(75);
  });
});

/* --------------------------------------------------------------------------
   4. LIBELLES
   -------------------------------------------------------------------------- */

describe('describePace', () => {
  it('ne dit rien quand tout est a jour', () => {
    const progress = computeChallengeProgress(
      challenge({ startDate: todayKey(), days: days(7, 1) }),
    );
    expect(describePace(progress)).toBeNull();
  });

  it('signale une journee en attente sans reproche', () => {
    const progress = computeChallengeProgress(
      challenge({ startDate: shiftDays(todayKey(), -2), days: days(7, 0) }),
    );
    const text = describePace(progress);
    expect(text).toContain('en attente');
    expect(text).toContain('quand tu veux');
    expect(text?.toLowerCase()).not.toContain('rate');
  });

  it('accorde le pluriel au-dela d une journee', () => {
    const progress = computeChallengeProgress(
      challenge({ startDate: shiftDays(todayKey(), -5), days: days(10, 0) }),
    );
    expect(describePace(progress)).toContain('journees sont en attente');
  });
});

/* --------------------------------------------------------------------------
   5. DERIVATIONS DU REPOSITORY
   -------------------------------------------------------------------------- */

describe('computeEndDate', () => {
  it('inclut le jour de depart dans la duree', () => {
    expect(computeEndDate('2026-03-01', 7)).toBe('2026-03-07');
  });

  it('gere un challenge de 3 jours', () => {
    expect(computeEndDate('2026-03-01', 3)).toBe('2026-03-03');
  });

  it('gere un challenge de 30 jours a cheval sur deux mois', () => {
    expect(computeEndDate('2026-01-15', 30)).toBe('2026-02-13');
  });

  it('renvoie le jour de depart pour une duree d un jour', () => {
    expect(computeEndDate('2026-03-01', 1)).toBe('2026-03-01');
  });
});

/* --------------------------------------------------------------------------
   6. PERSISTANCE INDEXEDDB
   -------------------------------------------------------------------------- */

describe('challengesRepository', () => {
  it('cree un challenge, le persiste et le relit', async () => {
    const { challengesRepository } = await import('@/database/repositories');

    const created = await challengesRepository.create({
      title: 'Reset 7 jours',
      durationDays: 7,
      startDate: todayKey(),
    });

    expect(created.durationDays).toBe(7);
    expect(created.days).toHaveLength(7);
    expect(created.status).toBe('active');
    expect(created.daysCompleted).toBe(0);

    const reread = await challengesRepository.get(created.id);
    expect(reread?.title).toBe('Reset 7 jours');

    await challengesRepository.remove(created.id);
  });

  it('derive la date de fin a la creation', async () => {
    const { challengesRepository } = await import('@/database/repositories');

    const created = await challengesRepository.create({
      title: 'Trois jours',
      durationDays: 3,
      startDate: '2026-03-01',
    });

    expect(created.endDate).toBe('2026-03-03');
    await challengesRepository.remove(created.id);
  });

  it('compte une journee une fois, et une seule', async () => {
    const { challengesRepository } = await import('@/database/repositories');

    const created = await challengesRepository.create({
      title: 'Idempotence',
      durationDays: 7,
      startDate: todayKey(),
    });

    const first = await challengesRepository.completeDay(created.id, 1);
    expect(first?.daysCompleted).toBe(1);

    const second = await challengesRepository.completeDay(created.id, 1);
    expect(second?.daysCompleted).toBe(1);

    const reread = await challengesRepository.get(created.id);
    expect(reread?.daysCompleted).toBe(1);

    await challengesRepository.remove(created.id);
  });

  it('passe a completed quand toutes les etapes sont faites', async () => {
    const { challengesRepository } = await import('@/database/repositories');

    const created = await challengesRepository.create({
      title: 'Completion',
      durationDays: 3,
      startDate: todayKey(),
    });

    await challengesRepository.completeDay(created.id, 1);
    await challengesRepository.completeDay(created.id, 2);
    const final = await challengesRepository.completeDay(created.id, 3);

    expect(final?.status).toBe('completed');
    expect(final?.daysCompleted).toBe(3);
    expect(final?.completedAt).toBeDefined();

    const reread = await challengesRepository.get(created.id);
    expect(reread?.status).toBe('completed');

    await challengesRepository.remove(created.id);
  });

  it('retire une coche sans punir', async () => {
    const { challengesRepository } = await import('@/database/repositories');

    const created = await challengesRepository.create({
      title: 'Correction',
      durationDays: 7,
      startDate: todayKey(),
    });

    await challengesRepository.completeDay(created.id, 1);
    await challengesRepository.completeDay(created.id, 2);
    const after = await challengesRepository.uncompleteDay(created.id, 1);

    expect(after?.daysCompleted).toBe(1);
    await challengesRepository.remove(created.id);
  });

  it('garde un challenge upcoming si le depart est dans le futur', async () => {
    const { challengesRepository } = await import('@/database/repositories');

    const created = await challengesRepository.create({
      title: 'Plus tard',
      durationDays: 7,
      startDate: '2099-01-01',
    });

    expect(created.status).toBe('upcoming');
    await challengesRepository.remove(created.id);
  });

  it('ne fait pas repasser un challenge termine en actif apres relecture', async () => {
    const { challengesRepository } = await import('@/database/repositories');

    const created = await challengesRepository.create({
      title: 'Stable',
      durationDays: 3,
      startDate: todayKey(),
    });
    await challengesRepository.completeDay(created.id, 1);
    await challengesRepository.completeDay(created.id, 2);
    await challengesRepository.completeDay(created.id, 3);

    const list = await challengesRepository.listAll();
    const found = list.find((item) => item.id === created.id);
    expect(found?.status).toBe('completed');

    await challengesRepository.remove(created.id);
  });

  it('met un challenge de cote et le reprend', async () => {
    const { challengesRepository } = await import('@/database/repositories');

    const created = await challengesRepository.create({
      title: 'En pause',
      durationDays: 7,
      startDate: todayKey(),
    });

    const aside = await challengesRepository.setAside(created.id);
    expect(aside?.status).toBe('abandoned');

    const back = await challengesRepository.resume(created.id);
    expect(back?.status).toBe('active');

    await challengesRepository.remove(created.id);
  });

  it('supprime un challenge sans laisser d orphelin', async () => {
    const { challengesRepository } = await import('@/database/repositories');

    const created = await challengesRepository.create({
      title: 'Ephemere',
      durationDays: 3,
      startDate: todayKey(),
    });

    await challengesRepository.remove(created.id);
    expect(await challengesRepository.get(created.id)).toBeNull();
  });

  it('se comporte correctement sur une base vide', async () => {
    const { challengesRepository } = await import('@/database/repositories');

    const all = await challengesRepository.listAll();
    expect(Array.isArray(all)).toBe(true);
    expect(await challengesRepository.get('inexistant')).toBeNull();
  });
});

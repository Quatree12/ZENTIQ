/**
 * Regressions de la phase QA.
 *
 * Ces tests protegent les deux corrections de finition, et ne remplacent aucun
 * test existant : ils s'ajoutent a `journey-stats.test.ts` et
 * `challenges.test.ts`, qui restent inchanges.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { applyRenderSettings } from '@/services/storage.service';
import {
  computeGoalStats,
  computeJourneySummary,
  computeMoodStats,
  summarizeJourney,
  type HabitStat,
} from '@/utils/journey-stats';

/* --------------------------------------------------------------------------
   1. TEXTE PLUS LARGE
   -------------------------------------------------------------------------- */

describe('applyRenderSettings — Texte plus large', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-large-text');
    document.documentElement.removeAttribute('data-accent');
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-reduce-motion');
  });

  it('pose data-large-text="true" quand la preference est active', () => {
    applyRenderSettings({
      accentTheme: 'teal',
      reduceMotion: false,
      density: 'comfortable',
      largeReadableText: true,
    });

    expect(document.documentElement.dataset.largeText).toBe('true');
  });

  it('pose data-large-text="false" quand la preference est desactivee', () => {
    applyRenderSettings({
      accentTheme: 'teal',
      reduceMotion: false,
      density: 'comfortable',
      largeReadableText: false,
    });

    expect(document.documentElement.dataset.largeText).toBe('false');
  });

  it('applique les quatre preferences de rendu ensemble', () => {
    applyRenderSettings({
      accentTheme: 'lavender',
      reduceMotion: true,
      density: 'compact',
      largeReadableText: true,
    });

    const root = document.documentElement;
    expect(root.dataset.accent).toBe('lavender');
    expect(root.dataset.density).toBe('compact');
    expect(root.dataset.reduceMotion).toBe('true');
    expect(root.dataset.largeText).toBe('true');
  });

  it('bascule la valeur dans les deux sens sans etat intermediaire', () => {
    const base = {
      accentTheme: 'teal' as const,
      reduceMotion: false,
      density: 'comfortable' as const,
    };

    applyRenderSettings({ ...base, largeReadableText: true });
    expect(document.documentElement.dataset.largeText).toBe('true');

    applyRenderSettings({ ...base, largeReadableText: false });
    expect(document.documentElement.dataset.largeText).toBe('false');
  });
});

/* --------------------------------------------------------------------------
   2. HABITUDES SUIVIES vs REGULARITE
   -------------------------------------------------------------------------- */

/**
 * Habitude de test pour une statistique.
 *
 * `lastReviewedAt` est fourni : le champ est REQUIS par le type `Habit` depuis
 * la migration v2. L'omettre ici faisait echouer le type-check sur ce fichier.
 */
function habitStat(consistency: number | null, name = 'Test'): HabitStat {
  return {
    habit: {
      id: 'h-' + name,
      name,
      intention: '',
      frequency: 'daily',
      targetDays: [0, 1, 2, 3, 4, 5, 6],
      weeklyTarget: null,
      icon: 'circle-check',
      accent: 'teal',
      archived: false,
      lastReviewedAt: null,
      createdAt: '2026-01-01T08:00:00.000Z',
      updatedAt: '2026-01-01T08:00:00.000Z',
    },
    completedDays: 0,
    expectedDays: 7,
    consistency,
    currentStreak: 0,
    bestStreak: 0,
    last7Days: 0,
    previous7Days: 0,
    recentTrend: 'stable',
  };
}

describe('habitudes suivies et regularite', () => {
  it('compte les habitudes suivies independamment de leur regularite', () => {
    const summary = computeJourneySummary({
      moods: computeMoodStats([], 7),
      habitStats: [habitStat(0, 'A'), habitStat(0, 'B')],
      goals: computeGoalStats([]),
      journalCount: 0,
    });

    expect(summary.habitsTracked).toBe(2);
    expect(summary.consistency).toBe(0);
  });

  it('conserve la regularite a 0 % quand rien n est coche', () => {
    const summary = computeJourneySummary({
      moods: computeMoodStats([], 7),
      habitStats: [habitStat(0, 'A')],
      goals: computeGoalStats([]),
      journalCount: 0,
    });

    expect(summary.consistency).toBe(0);
    expect(summary.consistency).not.toBeNull();
  });

  it('ne confond pas nombre d habitudes et taux de regularite', () => {
    const summary = computeJourneySummary({
      moods: computeMoodStats([], 7),
      habitStats: [habitStat(100, 'A'), habitStat(100, 'B'), habitStat(100, 'C')],
      goals: computeGoalStats([]),
      journalCount: 0,
    });

    expect(summary.habitsTracked).toBe(3);
    expect(summary.consistency).toBe(100);
    expect(summary.habitsTracked).not.toBe(summary.consistency);
  });

  it('renvoie null — et non 0 — quand aucune habitude n est mesurable', () => {
    const summary = computeJourneySummary({
      moods: computeMoodStats([], 7),
      habitStats: [],
      goals: computeGoalStats([]),
      journalCount: 0,
    });

    expect(summary.habitsTracked).toBe(0);
    expect(summary.consistency).toBeNull();
  });

  it('garde la phrase de synthese non culpabilisante', () => {
    const summary = computeJourneySummary({
      moods: computeMoodStats([], 7),
      habitStats: [habitStat(0, 'A'), habitStat(0, 'B')],
      goals: computeGoalStats([]),
      journalCount: 0,
    });

    const text = summarizeJourney(summary);
    expect(text.toLowerCase()).not.toContain('echec');
    expect(text.toLowerCase()).not.toContain('rate');
  });
});

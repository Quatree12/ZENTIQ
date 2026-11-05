/**
 * Tests de l'analytique de tendances.
 *
 * L'ENJEU DE CE FICHIER
 * ---------------------
 * Une analytique fausse est pire qu'aucune analytique : elle a l'air d'une
 * mesure. Ces tests verrouillent donc surtout les REFUS de conclure —
 * l'echantillon trop petit, la serie constante, la periode precedente vide.
 *
 * Le cas qui a motive le fichier : une « tendance » affichee sur deux points.
 * Elle a ete retiree de Journey apres plusieurs tentatives de correction ; ces
 * tests empechent qu'elle revienne sous une autre forme.
 */
import { describe, expect, it } from 'vitest';
import {
  MIN_PAIRS_FOR_CORRELATION,
  MIN_POINTS_FOR_TREND,
  alignByDate,
  comparePeriods,
  computeCorrelation,
  computeRegularity,
  computeTrend,
  longestPresenceStreak,
  windowEndingAt,
} from '@/utils/trends';

describe('computeTrend', () => {
  it('detecte une hausse', () => {
    const result = computeTrend([1, 1, 2, 3]);
    expect(result?.direction).toBe('up');
    expect(result?.delta).toBeGreaterThan(0);
  });

  it('detecte une baisse', () => {
    const result = computeTrend([4, 4, 2, 1]);
    expect(result?.direction).toBe('down');
    expect(result?.delta).toBeLessThan(0);
  });

  it('declare stable un ecart sous le seuil', () => {
    const result = computeTrend([3, 3, 3.1, 3.1]);
    expect(result?.direction).toBe('stable');
  });

  it('marque NON FIABLE une serie trop courte', () => {
    // C'est le verrou du bug : deux points ne font pas une tendance.
    const result = computeTrend([2, 4]);
    expect(result?.reliable).toBe(false);
    expect(result?.points).toBe(2);
  });

  it('marque fiable une serie au seuil', () => {
    const values = Array.from({ length: MIN_POINTS_FOR_TREND }, (_, i) => i + 1);
    expect(computeTrend(values)?.reliable).toBe(true);
  });

  it('renvoie null sans aucune valeur exploitable', () => {
    expect(computeTrend([])).toBeNull();
    expect(computeTrend([Number.NaN])).toBeNull();
  });

  it('ignore les valeurs non finies', () => {
    const result = computeTrend([1, 2, Number.NaN, 3, 4]);
    expect(result?.points).toBe(4);
  });
});

describe('computeCorrelation', () => {
  it('detecte une correlation positive parfaite', () => {
    const pairs = Array.from({ length: MIN_PAIRS_FOR_CORRELATION }, (_, i) => ({ a: i, b: i }));
    expect(computeCorrelation(pairs)?.coefficient).toBe(1);
  });

  it('detecte une correlation negative parfaite', () => {
    const pairs = Array.from({ length: MIN_PAIRS_FOR_CORRELATION }, (_, i) => ({ a: i, b: -i }));
    expect(computeCorrelation(pairs)?.coefficient).toBe(-1);
  });

  it('refuse de conclure sous le seuil d echantillon', () => {
    const pairs = Array.from({ length: MIN_PAIRS_FOR_CORRELATION - 1 }, (_, i) => ({ a: i, b: i }));
    expect(computeCorrelation(pairs)).toBeNull();
  });

  it('renvoie null quand une serie est constante', () => {
    // Une habitude jamais cochee : la correlation n'est pas definie. Renvoyer 0
    // laisserait croire a une absence de lien qui aurait ete mesuree.
    const pairs = Array.from({ length: 10 }, (_, i) => ({ a: 3, b: i }));
    expect(computeCorrelation(pairs)).toBeNull();
  });

  it('ne compte que les paires completes', () => {
    const pairs = [
      { a: 1, b: 2 },
      { a: Number.NaN, b: 3 },
      { a: 4, b: 5 },
    ];
    expect(computeCorrelation(pairs)).toBeNull();
  });
});

describe('computeRegularity', () => {
  const week = [
    '2026-01-05',
    '2026-01-06',
    '2026-01-07',
    '2026-01-08',
    '2026-01-09',
    '2026-01-10',
    '2026-01-11',
  ];

  it('calcule un pourcentage sur les jours attendus', () => {
    const done = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08'];
    // 4 sur 7 jours attendus.
    expect(computeRegularity(done, week, [0, 1, 2, 3, 4, 5, 6])).toBe(57);
  });

  it('ne compte que les jours vises par l habitude', () => {
    // Habitude du lundi (1) et mercredi (3) uniquement : 2 jours attendus.
    const done = ['2026-01-05'];
    expect(computeRegularity(done, week, [1, 3])).toBe(50);
  });

  it('renvoie null si aucun jour attendu', () => {
    expect(computeRegularity([], week, [])).toBeNull();
  });

  it('renvoie 0 quand rien n est fait mais que des jours etaient attendus', () => {
    expect(computeRegularity([], week, [1, 2, 3])).toBe(0);
  });

  it('ignore les coches hors fenetre', () => {
    const done = ['2025-12-01', '2026-01-05'];
    expect(computeRegularity(done, week, [1])).toBe(100);
  });
});

describe('comparePeriods', () => {
  it('calcule une variation', () => {
    expect(comparePeriods(12, 10)).toEqual({ delta: 2, percent: 20 });
  });

  it('refuse de comparer a une periode vide', () => {
    // « +100 % » depuis zero serait faux : il n'y a pas de base.
    expect(comparePeriods(5, 0)).toBeNull();
  });

  it('gere la baisse', () => {
    expect(comparePeriods(5, 10)).toEqual({ delta: -5, percent: -50 });
  });
});

describe('windowEndingAt', () => {
  it('renvoie la fenetre demandee, la plus ancienne d abord', () => {
    const window = windowEndingAt('2026-03-10', 3);
    expect(window).toEqual(['2026-03-08', '2026-03-09', '2026-03-10']);
  });

  it('decale la fenetre quand on le demande', () => {
    const window = windowEndingAt('2026-03-10', 3, 3);
    expect(window).toEqual(['2026-03-05', '2026-03-06', '2026-03-07']);
  });
});

describe('alignByDate', () => {
  it('ne garde que les jours presents des deux cotes', () => {
    const left = [
      { date: '2026-01-01', value: 1 },
      { date: '2026-01-02', value: 0 },
      { date: '2026-01-03', value: 1 },
    ];
    const right = [
      { date: '2026-01-02', value: 4 },
      { date: '2026-01-03', value: 5 },
    ];
    expect(alignByDate(left, right)).toEqual([
      { a: 0, b: 4 },
      { a: 1, b: 5 },
    ]);
  });

  it('renvoie une liste vide quand rien ne se recoupe', () => {
    expect(alignByDate([{ date: '2026-01-01', value: 1 }], [])).toEqual([]);
  });
});

describe('longestPresenceStreak', () => {
  it('trouve la plus longue serie de jours consecutifs', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-10'];
    expect(longestPresenceStreak(dates)).toBe(3);
  });

  it('dedoublonne les jours repetes', () => {
    expect(longestPresenceStreak(['2026-01-01', '2026-01-01', '2026-01-02'])).toBe(2);
  });

  it('renvoie 1 pour un jour isole', () => {
    expect(longestPresenceStreak(['2026-01-01'])).toBe(1);
  });

  it('renvoie 0 sans aucune date', () => {
    expect(longestPresenceStreak([])).toBe(0);
  });

  it('traverse un changement de mois', () => {
    expect(longestPresenceStreak(['2026-01-30', '2026-01-31', '2026-02-01'])).toBe(3);
  });
});

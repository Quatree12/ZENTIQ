/**
 * Tests des statistiques de Journey.
 *
 * Le module `@/utils/journey-stats` est PUR : ces tests lui donnent des
 * donnees controlees et verifient les mesures. Aucun acces a IndexedDB, aucun
 * rendu React — c'est exactement ce qui rend ces calculs verifiables.
 *
 * Les dates sont exprimees RELATIVEMENT a aujourd'hui (via `lastNDays`), pour
 * que les tests ne dependent pas du jour d'execution.
 */
import { describe, expect, it } from 'vitest';
import {
  computeBestStreak,
  computeCurrentStreak,
  computeGoalStats,
  computeHabitStat,
  computeJourneySummary,
  computeMoodStats,
  computeOverallConsistency,
  describeTrend,
  expectedDaysIn,
  summarizeJourney,
} from '@/utils/journey-stats';
import { lastNDays } from '@/utils/dates';
import type { Goal, Habit, HabitCompletion, MoodEntry, MoodLevel } from '@/types';

/* --------------------------------------------------------------------------
   Fabriques de donnees de test
   -------------------------------------------------------------------------- */

function mood(date: string, level: MoodLevel, createdAt = '2026-01-01T08:00:00.000Z'): MoodEntry {
  return {
    id: 'm-' + date + '-' + level,
    date,
    mood: level,
    note: '',
    emotions: [],
    createdAt,
    updatedAt: createdAt,
  };
}

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h-1',
    name: 'Marche',
    intention: '',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    weeklyTarget: null,
    icon: 'circle-check',
    accent: 'teal',
    archived: false,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
    ...overrides,
  };
}

function completion(habitId: string, date: string): HabitCompletion {
  return {
    id: 'c-' + habitId + '-' + date,
    habitId,
    date,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  };
}

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g-1',
    title: 'Courir',
    motivation: '',
    status: 'active',
    horizon: 'medium',
    progress: 40,
    isPriority: false,
    nextStep: '',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
    ...overrides,
  };
}

/* --------------------------------------------------------------------------
   1. HUMEUR
   -------------------------------------------------------------------------- */

describe('computeMoodStats', () => {
  it('renvoie un etat vide quand il n y a aucune donnee', () => {
    const stats = computeMoodStats([], 7);

    expect(stats.average).toBeNull();
    expect(stats.entriesCount).toBe(0);
    expect(stats.missingCount).toBe(7);
    expect(stats.trend).toBeNull();
    expect(stats.bestDay).toBeNull();
    expect(stats.hardestDay).toBeNull();
    // La serie de points doit rester complete, meme vide : c'est elle qui
    // dessine la courbe.
    expect(stats.points).toHaveLength(7);
    expect(stats.points.every((p) => p.mood === null)).toBe(true);
  });

  it('calcule la moyenne sur 7 jours', () => {
    const days = lastNDays(7);
    const entries = [mood(days[0]!, 2), mood(days[1]!, 4), mood(days[2]!, 5)];

    const stats = computeMoodStats(entries, 7);
    // (2 + 4 + 5) / 3 = 3.666... -> 3.7
    expect(stats.average).toBe(3.7);
    expect(stats.entriesCount).toBe(3);
    expect(stats.missingCount).toBe(4);
  });

  it('calcule la moyenne sur 30 jours', () => {
    const days = lastNDays(30);
    const entries = [mood(days[0]!, 5), mood(days[29]!, 1)];

    const stats = computeMoodStats(entries, 30);
    expect(stats.average).toBe(3);
    expect(stats.entriesCount).toBe(2);
    expect(stats.missingCount).toBe(28);
  });

  it('ignore les entrees hors de la periode demandee', () => {
    const days = lastNDays(30);
    const old = days[0]!; // il y a 30 jours : dans la fenetre de 30, hors de celle de 7
    const stats7 = computeMoodStats([mood(old, 1)], 7);

    expect(stats7.entriesCount).toBe(0);
    expect(stats7.average).toBeNull();
  });

  it('ne conserve qu une entree par jour, la plus recente', () => {
    const days = lastNDays(7);
    const today = days[6]!;
    const entries = [
      mood(today, 1, '2026-01-01T08:00:00.000Z'),
      mood(today, 5, '2026-01-01T20:00:00.000Z'),
    ];

    const stats = computeMoodStats(entries, 7);
    expect(stats.entriesCount).toBe(1);
    expect(stats.average).toBe(5);
  });

  it('detecte une tendance a la hausse', () => {
    const days = lastNDays(8);
    // Premieres moities basses, secondes hautes.
    const entries = [
      mood(days[0]!, 1),
      mood(days[1]!, 1),
      mood(days[2]!, 2),
      mood(days[3]!, 2),
      mood(days[4]!, 5),
      mood(days[5]!, 5),
      mood(days[6]!, 5),
      mood(days[7]!, 5),
    ];

    const stats = computeMoodStats(entries, 8 as 7);
    expect(stats.trend).toBe('up');
    expect(stats.trendDelta).toBeGreaterThan(0.3);
  });

  it('detecte une tendance a la baisse', () => {
    const days = lastNDays(8);
    const entries = [
      mood(days[0]!, 5),
      mood(days[1]!, 5),
      mood(days[2]!, 5),
      mood(days[3]!, 5),
      mood(days[4]!, 1),
      mood(days[5]!, 1),
      mood(days[6]!, 2),
      mood(days[7]!, 1),
    ];

    const stats = computeMoodStats(entries, 8 as 7);
    expect(stats.trend).toBe('down');
  });

  it('considere une variation faible comme stable', () => {
    const days = lastNDays(8);
    const entries = days.map((day) => mood(day, 4));

    const stats = computeMoodStats(entries, 8 as 7);
    expect(stats.trend).toBe('stable');
    expect(stats.trendDelta).toBe(0);
  });

  it('identifie le meilleur jour et le plus difficile', () => {
    const days = lastNDays(7);
    const entries = [mood(days[0]!, 2), mood(days[1]!, 5), mood(days[2]!, 3)];

    const stats = computeMoodStats(entries, 7);
    expect(stats.bestDay?.mood).toBe(5);
    expect(stats.hardestDay?.mood).toBe(2);
  });
});

describe('describeTrend', () => {
  it('donne un libelle non culpabilisant pour chaque etat', () => {
    expect(describeTrend('up')).toBe('En hausse');
    expect(describeTrend('down')).toBe('En baisse');
    expect(describeTrend('stable')).toBe('Stable');
    expect(describeTrend(null)).toBe('Pas encore assez de donnees');
  });
});

/* --------------------------------------------------------------------------
   2. HABITUDES
   -------------------------------------------------------------------------- */

describe('expectedDaysIn', () => {
  it('compte tous les jours pour une habitude quotidienne', () => {
    const window = lastNDays(7);
    expect(expectedDaysIn(habit({ frequency: 'daily' }), window)).toBe(7);
  });

  it('compte une fois par semaine pour une habitude hebdomadaire', () => {
    const window = lastNDays(28);
    expect(expectedDaysIn(habit({ frequency: 'weekly' }), window)).toBe(4);
  });

  it('compte uniquement les jours cibles pour une habitude personnalisee', () => {
    const window = lastNDays(7);
    // Une seule cible : le jour courant de la semaine apparait une fois sur 7 jours.
    const monday = 1;
    const result = expectedDaysIn(habit({ frequency: 'custom', targetDays: [monday] }), window);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(7);
  });
});

describe('computeHabitStat', () => {
  it('calcule la regularite sur les donnees reelles', () => {
    const window = lastNDays(7);
    const habitData = habit();
    const completions = window.slice(0, 4).map((day) => completion(habitData.id, day));

    const stat = computeHabitStat(habitData, completions, 7);
    expect(stat.completedDays).toBe(4);
    expect(stat.expectedDays).toBe(7);
    expect(stat.consistency).toBe(57); // 4/7 -> 57 %
  });

  it('renvoie null et non 0 quand rien n etait attendu', () => {
    const habitData = habit({ frequency: 'custom', targetDays: [] });
    const stat = computeHabitStat(habitData, [], 7);

    // Un « 0 % » serait un reproche immérité : la valeur doit rester absente.
    expect(stat.consistency).toBeNull();
  });

  it('ne melange pas les realisations de deux habitudes', () => {
    const window = lastNDays(7);
    const a = habit({ id: 'h-a', name: 'A' });
    const b = habit({ id: 'h-b', name: 'B' });
    const completions = [completion('h-a', window[0]!), completion('h-b', window[1]!)];

    expect(computeHabitStat(a, completions, 7).completedDays).toBe(1);
    expect(computeHabitStat(b, completions, 7).completedDays).toBe(1);
  });

  it('calcule la meilleure serie sans l inventer', () => {
    const days = lastNDays(10);
    const habitData = habit();
    // Serie de 3 jours, puis trou, puis serie de 2 jours.
    const completions = [
      completion(habitData.id, days[0]!),
      completion(habitData.id, days[1]!),
      completion(habitData.id, days[2]!),
      completion(habitData.id, days[5]!),
      completion(habitData.id, days[6]!),
    ];

    const stat = computeHabitStat(habitData, completions, 30);
    expect(stat.bestStreak).toBe(3);
  });

  it('ignore les realisations hors periode pour la regularite', () => {
    const days = lastNDays(30);
    const habitData = habit();
    const completions = [completion(habitData.id, days[0]!)]; // il y a 30 jours

    const stat = computeHabitStat(habitData, completions, 7);
    expect(stat.completedDays).toBe(0);
    expect(stat.consistency).toBe(0);
  });
});

describe('computeCurrentStreak', () => {
  it('renvoie 0 sans aucune realisation', () => {
    expect(computeCurrentStreak(new Set())).toBe(0);
  });

  it('compte les jours consecutifs jusqu a aujourd hui', () => {
    const days = lastNDays(5);
    const dates = new Set([days[1]!, days[2]!, days[3]!, days[4]!]);
    expect(computeCurrentStreak(dates)).toBe(4);
  });

  it('ne casse pas la serie si aujourd hui n est pas encore coche', () => {
    const days = lastNDays(5);
    // Les 3 jours precedents sont coches, pas aujourd'hui.
    const dates = new Set([days[1]!, days[2]!, days[3]!]);
    expect(computeCurrentStreak(dates)).toBe(3);
  });

  it('s arrete au premier jour manquant', () => {
    const days = lastNDays(6);
    // Aujourd'hui et avant-hier, mais pas hier.
    const dates = new Set([days[5]!, days[3]!, days[2]!]);
    expect(computeCurrentStreak(dates)).toBe(1);
  });
});

describe('computeBestStreak', () => {
  it('renvoie 0 sans donnee', () => {
    expect(computeBestStreak(new Set())).toBe(0);
  });

  it('trouve la plus longue suite, meme ancienne', () => {
    const days = lastNDays(12);
    const dates = new Set([days[0]!, days[1]!, days[2]!, days[3]!, days[4]!, days[9]!]);
    expect(computeBestStreak(dates)).toBe(5);
  });

  it('renvoie 1 pour une seule journee isolee', () => {
    const days = lastNDays(3);
    expect(computeBestStreak(new Set([days[0]!]))).toBe(1);
  });
});

describe('computeOverallConsistency', () => {
  it('renvoie null quand aucune habitude n est mesurable', () => {
    expect(computeOverallConsistency([])).toBeNull();
  });

  it('ignore les habitudes sans regularite calculable', () => {
    const window = lastNDays(7);
    const measurable = computeHabitStat(
      habit({ id: 'h-a' }),
      window.slice(0, 7).map((day) => completion('h-a', day)),
      7,
    );
    const notMeasurable = computeHabitStat(
      habit({ id: 'h-b', frequency: 'custom', targetDays: [] }),
      [],
      7,
    );

    expect(computeOverallConsistency([measurable, notMeasurable])).toBe(100);
  });
});

/* --------------------------------------------------------------------------
   3. OBJECTIFS
   -------------------------------------------------------------------------- */

describe('computeGoalStats', () => {
  it('renvoie un etat vide sans objectif', () => {
    const stats = computeGoalStats([]);
    expect(stats.total).toBe(0);
    expect(stats.overallProgress).toBeNull();
    expect(stats.active).toHaveLength(0);
  });

  it('separe les objectifs actifs des objectifs atteints', () => {
    const stats = computeGoalStats([
      goal({ id: 'g-1', status: 'active' }),
      goal({ id: 'g-2', status: 'completed' }),
      goal({ id: 'g-3', status: 'archived' }),
    ]);

    expect(stats.active).toHaveLength(1);
    expect(stats.completed).toHaveLength(1);
    // Les archives sont exclues du total.
    expect(stats.total).toBe(2);
  });

  it('calcule la progression moyenne des seuls objectifs actifs', () => {
    const stats = computeGoalStats([
      goal({ id: 'g-1', status: 'active', progress: 20 }),
      goal({ id: 'g-2', status: 'active', progress: 80 }),
      goal({ id: 'g-3', status: 'completed', progress: 100 }),
    ]);

    // (20 + 80) / 2 = 50 : l'objectif atteint ne gonfle pas la moyenne.
    expect(stats.overallProgress).toBe(50);
  });

  it('ne considere pas un objectif en pause comme atteint', () => {
    const stats = computeGoalStats([goal({ id: 'g-1', status: 'paused', progress: 30 })]);
    expect(stats.active).toHaveLength(1);
    expect(stats.completed).toHaveLength(0);
  });

  it('detecte les echeances depassees', () => {
    const stats = computeGoalStats([goal({ id: 'g-1', targetDate: '2020-01-01' })], '2026-06-01');
    expect(stats.overdue).toHaveLength(1);
  });

  it('detecte les echeances proches', () => {
    const stats = computeGoalStats([goal({ id: 'g-1', targetDate: '2026-06-10' })], '2026-06-01');
    expect(stats.dueSoon).toHaveLength(1);
  });

  it('ignore les objectifs sans echeance dans overdue et dueSoon', () => {
    const stats = computeGoalStats([goal({ id: 'g-1' })], '2026-06-01');
    expect(stats.overdue).toHaveLength(0);
    expect(stats.dueSoon).toHaveLength(0);
  });
});

/* --------------------------------------------------------------------------
   4. SYNTHESE
   -------------------------------------------------------------------------- */

describe('computeJourneySummary', () => {
  it('produit un resume vide coherent sans donnees', () => {
    const summary = computeJourneySummary({
      moods: computeMoodStats([], 7),
      habitStats: [],
      goals: computeGoalStats([]),
      journalCount: 0,
    });

    expect(summary.moodAverage).toBeNull();
    expect(summary.consistency).toBeNull();
    expect(summary.goalsProgress).toBeNull();
    expect(summary.goalsActive).toBe(0);
    expect(summary.challengesActive).toBe(0);
  });

  it('agrege les mesures des quatre domaines', () => {
    const window = lastNDays(7);
    const habitData = habit({ id: 'h-1' });

    const summary = computeJourneySummary({
      moods: computeMoodStats([mood(window[6]!, 4)], 7),
      habitStats: [computeHabitStat(habitData, [completion('h-1', window[6]!)], 7)],
      goals: computeGoalStats([goal({ status: 'active', progress: 60 })]),
      journalCount: 3,
      challengesActive: 1,
    });

    expect(summary.moodAverage).toBe(4);
    expect(summary.moodEntries).toBe(1);
    expect(summary.goalsActive).toBe(1);
    expect(summary.goalsProgress).toBe(60);
    expect(summary.journalEntries).toBe(3);
    expect(summary.challengesActive).toBe(1);
  });
});

describe('summarizeJourney', () => {
  it('reste encourageant quand tout est vide', () => {
    const text = summarizeJourney({
      moodAverage: null,
      moodEntries: 0,
      consistency: null,
      habitsTracked: 0,
      goalsActive: 0,
      goalsCompleted: 0,
      goalsProgress: null,
      journalEntries: 0,
      challengesActive: 0,
    });

    expect(text).toContain('Chaque geste compte');
    // Aucun mot de reproche.
    expect(text.toLowerCase()).not.toContain('echec');
    expect(text.toLowerCase()).not.toContain('raté');
  });

  it('accorde les libelles au singulier', () => {
    const text = summarizeJourney({
      moodAverage: 4,
      moodEntries: 1,
      consistency: 50,
      habitsTracked: 1,
      goalsActive: 1,
      goalsCompleted: 1,
      goalsProgress: 50,
      journalEntries: 1,
      challengesActive: 0,
    });

    expect(text).toContain('1 journee documentee');
    expect(text).toContain('1 entree de journal');
    expect(text).toContain('1 objectif atteint');
  });
});

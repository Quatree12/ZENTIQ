/**
 * Analytique de tendances.
 *
 * CE QUE CE MODULE FAIT, ET CE QU'IL NE FAIT PAS
 * ----------------------------------------------
 * Il calcule uniquement a partir des donnees reellement presentes en base. Il
 * n'extrapole jamais, ne comble jamais un trou, n'invente jamais une valeur
 * manquante. Quand la donnee est insuffisante, il renvoie `null` plutot qu'un
 * chiffre qui aurait l'air d'une mesure.
 *
 * Une moyenne sur deux points n'est pas une tendance. Le module porte donc des
 * seuils explicites : en dessous, il refuse de conclure.
 */

import { daysBetween, shiftDays } from '@/utils/dates';

/** Nombre minimal de points pour parler d'une tendance. */
export const MIN_POINTS_FOR_TREND = 4;

/** Nombre minimal de jours communs pour parler d'une correlation. */
export const MIN_PAIRS_FOR_CORRELATION = 7;

export type TrendDirection = 'up' | 'down' | 'stable';

export interface TrendResult {
  direction: TrendDirection;
  /** Variation entre les deux moities, en points de l'echelle mesuree. */
  delta: number;
  /** Nombre de points utilise effectivement. */
  points: number;
  /** Vrai si le seuil minimal est atteint : sinon, ne pas afficher. */
  reliable: boolean;
}

/**
 * Compare la premiere moitie et la seconde moitie d'une serie.
 *
 * Methode volontairement simple et explicable : on ne fait pas de regression
 * sur des series de quelques points, on compare deux moyennes. Un ecart
 * inferieur a `threshold` est declare stable, pour ne pas presenter un
 * tressaillement comme un mouvement.
 */
export function computeTrend(
  values: number[],
  threshold = 0.3,
): TrendResult | null {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length === 0) return null;

  const half = Math.floor(clean.length / 2);
  const first = clean.slice(0, half);
  const second = clean.slice(clean.length - half);

  if (first.length === 0 || second.length === 0) {
    return { direction: 'stable', delta: 0, points: clean.length, reliable: false };
  }

  const average = (numbers: number[]): number =>
    numbers.reduce((sum, value) => sum + value, 0) / numbers.length;

  const delta = average(second) - average(first);
  const direction: TrendDirection =
    Math.abs(delta) < threshold ? 'stable' : delta > 0 ? 'up' : 'down';

  return {
    direction,
    delta: Math.round(delta * 100) / 100,
    points: clean.length,
    reliable: clean.length >= MIN_POINTS_FOR_TREND,
  };
}

/**
 * Correlation entre deux series alignees jour par jour.
 *
 * Coefficient de Pearson, calcule sur les SEULS jours ou les deux mesures
 * existent. Renvoie `null` si l'echantillon est trop petit, ou si l'une des
 * series est constante : dans ce cas la correlation n'est pas definie, et
 * afficher 0 laisserait croire a une absence de lien mesuree.
 */
export function computeCorrelation(
  pairs: Array<{ a: number; b: number }>,
): { coefficient: number; sampleSize: number } | null {
  const clean = pairs.filter((pair) => Number.isFinite(pair.a) && Number.isFinite(pair.b));
  if (clean.length < MIN_PAIRS_FOR_CORRELATION) return null;

  const n = clean.length;
  const meanA = clean.reduce((sum, pair) => sum + pair.a, 0) / n;
  const meanB = clean.reduce((sum, pair) => sum + pair.b, 0) / n;

  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;

  for (const pair of clean) {
    const da = pair.a - meanA;
    const db = pair.b - meanB;
    covariance += da * db;
    varianceA += da * da;
    varianceB += db * db;
  }

  // Serie constante : la correlation n'est pas definie.
  if (varianceA === 0 || varianceB === 0) return null;

  const coefficient = covariance / Math.sqrt(varianceA * varianceB);
  return {
    coefficient: Math.round(coefficient * 100) / 100,
    sampleSize: n,
  };
}

/**
 * Regularite sur une fenetre : proportion de jours coches, parmi les jours OU
 * l'habitude etait attendue.
 *
 * On ne divise pas par la fenetre entiere : un jour non vise par l'habitude ne
 * peut pas etre un manquement. Diviser par la fenetre ferait baisser le taux
 * pour une habitude qui n'a jamais ete prevue ce jour-la.
 */
export function computeRegularity(
  completedDates: string[],
  windowDays: string[],
  expectedWeekdays: number[],
): number | null {
  const expected = windowDays.filter((date) =>
    expectedWeekdays.includes(weekdayOfKey(date)),
  );
  if (expected.length === 0) return null;

  const done = new Set(completedDates);
  const hits = expected.filter((date) => done.has(date)).length;
  return Math.round((hits / expected.length) * 100);
}

/**
 * Comparaison entre deux periodes de meme longueur.
 * Renvoie `null` si la periode precedente est vide : comparer a rien n'a pas de
 * sens, et afficher « +100 % » serait faux.
 */
export function comparePeriods(
  current: number,
  previous: number,
): { delta: number; percent: number | null } | null {
  if (previous === 0) return null;
  const delta = current - previous;
  return { delta, percent: Math.round((delta / previous) * 100) };
}

/** Fenetre de `count` jours se terminant `endOffset` jours avant la reference. */
export function windowEndingAt(
  reference: string,
  count: number,
  endOffset = 0,
): string[] {
  const end = shiftDays(reference, -endOffset);
  return Array.from({ length: count }, (_, index) => shiftDays(end, index - (count - 1)));
}

/** Jours communs aux deux series, alignes par cle de jour. */
export function alignByDate(
  left: Array<{ date: string; value: number }>,
  right: Array<{ date: string; value: number }>,
): Array<{ a: number; b: number }> {
  const rightByDate = new Map(right.map((item) => [item.date, item.value]));
  const pairs: Array<{ a: number; b: number }> = [];

  for (const item of left) {
    const other = rightByDate.get(item.date);
    if (other !== undefined) pairs.push({ a: item.value, b: other });
  }

  return pairs;
}

/**
 * Serie de jours consecutifs documentes, la plus longue.
 *
 * Un jour est « documente » s'il apparait dans l'ensemble fourni. Ce n'est pas
 * une serie d'habitude : c'est une serie de PRESENCE, qui mesure l'engagement
 * sur l'application sans juger de ce qui y a ete fait.
 */
export function longestPresenceStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();

  let best = 1;
  let current = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const value = sorted[index];
    if (previous === undefined || value === undefined) continue;

    if (daysBetween(previous, value) === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

/** Numero du jour de semaine (0 = dimanche) pour une cle `YYYY-MM-DD`. */
function weekdayOfKey(key: string): number {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getDay();
}

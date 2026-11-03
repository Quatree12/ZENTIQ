import type { MoodLevel } from '@/types';

/**
 * Utilitaires de date.
 *
 * Convention unique du projet : une « journée » est une chaîne `YYYY-MM-DD`
 * en heure locale. Tous les modèles indexés par jour (`MoodEntry`, `JournalEntry`,
 * `HabitCompletion`) utilisent ce format, ce qui rend les comparaisons de
 * chaînes équivalentes à des comparaisons chronologiques.
 */

const MS_PER_DAY = 86_400_000;

/** Formate une Date en `YYYY-MM-DD` (heure locale). */
export function toDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Convertit `YYYY-MM-DD` en Date locale (minuit local). */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Clé du jour courant. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** Clé du jour précédent. */
export function yesterdayKey(): string {
  return shiftDays(todayKey(), -1);
}

/** Décale une clé de jour de `days` jours (négatif accepté). */
export function shiftDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Nombre de jours entiers entre deux clés (b - a). */
export function daysBetween(a: string, b: string): number {
  const start = fromDateKey(a).getTime();
  const end = fromDateKey(b).getTime();
  return Math.round((end - start) / MS_PER_DAY);
}

/** Vrai si les deux clés désignent le même jour. */
export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

/** Vrai si la clé est aujourd'hui. */
export function isToday(key: string): boolean {
  return key === todayKey();
}

/** Vrai si la clé est strictement dans le passé. */
export function isPast(key: string): boolean {
  return key < todayKey();
}

/** Vrai si la clé est strictement dans le futur. */
export function isFuture(key: string): boolean {
  return key > todayKey();
}

/** Jours de la semaine (0 = dimanche … 6 = samedi). */
export function weekdayOf(key: string): number {
  return fromDateKey(key).getDay();
}

/**
 * Renvoie les `count` dernières clés de jour, en incluant aujourd'hui.
 * Utilisé par les graphiques de progression (7 derniers jours, 30 derniers…).
 */
export function lastNDays(count: number, from: string = todayKey()): string[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) =>
    shiftDays(from, index - (count - 1)),
  );
}

/**
 * Début de semaine pour une clé donnée.
 * Par défaut la semaine commence le lundi (convention CH/FR).
 */
export function startOfWeek(key: string, startsOnMonday = true): string {
  const day = weekdayOf(key);
  const offset = startsOnMonday ? (day === 0 ? -6 : 1 - day) : -day;
  return shiftDays(key, offset);
}

/** Les 7 clés de la semaine contenant `key`. */
export function weekDays(key: string, startsOnMonday = true): string[] {
  const start = startOfWeek(key, startsOnMonday);
  return Array.from({ length: 7 }, (_, index) => shiftDays(start, index));
}

/** Horodatage ISO courant. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Formate une clé de jour en libellé lisible court.
 * `locale` reste paramétrable : l'app est aujourd'hui en français.
 */
export function formatDateKey(
  key: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
  locale = 'fr-FR',
): string {
  return new Intl.DateTimeFormat(locale, options).format(fromDateKey(key));
}

/** Libellé relatif (« Aujourd'hui », « Hier », puis date courte). */
export function formatRelativeDateKey(key: string, locale = 'fr-FR'): string {
  if (isToday(key)) return "Aujourd'hui";
  if (key === yesterdayKey()) return 'Hier';
  return formatDateKey(key, { weekday: 'long', day: 'numeric', month: 'short' }, locale);
}

/** Nom du jour abrégé (L, M, M, J, V, S, D) selon la convention choisie. */
export function weekdayShortLabel(weekday: number, startsOnMonday = true): string {
  const labels = startsOnMonday
    ? ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    : ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const index = startsOnMonday ? (weekday === 0 ? 6 : weekday - 1) : weekday;
  return labels[index] ?? '';
}

/**
 * Renvoie la clé de jour de l'itération suivante d'un rappel, à partir de
 * `from`, par rapport aux jours autorisés. Sert au service de notification.
 */
export function nextAllowedDay(from: string, allowedDays: number[]): string {
  if (allowedDays.length === 0) return from;
  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = shiftDays(from, offset);
    if (allowedDays.includes(weekdayOf(candidate))) return candidate;
  }
  return from;
}

/** Vérifie qu'une chaîne est une clé de jour valide. */
export function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Âge en années révolues, à partir d'une date ISO. */
export function ageFrom(isoDate: string): number {
  const birth = new Date(isoDate);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (MS_PER_DAY * 365.2425));
}

/** Type d'humeur réutilisable — évite d'importer le type à chaque usage. */
export type MoodValue = MoodLevel;

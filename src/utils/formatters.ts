/**
 * Fonctions de formatage pures.
 *
 * Aucune dépendance externe : tout repose sur Intl, disponible hors ligne.
 */

/** `0` -> `00`, `12` -> `12`. Utilisé pour les heures et les décomptes. */
export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Pourcentage borné à 0..100, arrondi à l'entier. */
export function toPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

/** 1 -> `1er`, 2 -> `2e`. */
export function ordinal(value: number): string {
  return value === 1 ? '1er' : `${value}e`;
}

/**
 * Pluriel simple. `count(0, 'jour')` -> `0 jour` (on ne pluralise pas à zéro
 * en français).
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count > 1 || count === 0) return `${count} ${plural ?? `${singular}s`}`;
  return `${count} ${singular}`;
}

/** Formate une heure `HH:mm` en libellé 24 h ou 12 h. */
export function formatTime(time: string, use24Hour = true): string {
  const [rawHours, rawMinutes] = time.split(':');
  const hours = Number(rawHours ?? 0);
  const minutes = rawMinutes ?? '00';
  if (use24Hour) return `${pad2(hours)}:${minutes}`;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${minutes} ${suffix}`;
}

/** Nombres de jours en libellé lisible (« 5 jours », « 1 journée »). */
export function formatDayCount(days: number): string {
  if (days === 1) return '1 journée';
  return `${days} jours`;
}

/** Tronque un texte en préservant les mots, avec ellipse. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Initiales à partir d'un nom (« Léa Martin » -> « LM »). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Hash déterministe (FNV-1a 32 bits).
 * Sert à choisir l'inspiration du jour : même jour -> même contenu,
 * sans avoir besoin de stocker un tirage.
 */
export function stableHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Choisit un élément stable dans une liste à partir d'une clé. */
export function pickStable<T>(items: readonly T[], key: string): T | undefined {
  if (items.length === 0) return undefined;
  return items[stableHash(key) % items.length];
}

/** Taille de fichier lisible. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ['Ko', 'Mo', 'Go'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

/** Date/heure courte complète, pour les journaux techniques. */
export function formatDateTime(iso: string, locale = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

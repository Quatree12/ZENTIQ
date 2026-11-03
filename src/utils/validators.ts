/**
 * Validation légère et sans dépendance.
 *
 * Les validateurs renvoient un message prêt à afficher, ou `null` si la valeur
 * est acceptable. Aucun ne bloque la saisie : ils informent.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type ValidationMessage = string | null;

/** Champ obligatoire. */
export function required(value: string, label = 'Ce champ'): ValidationMessage {
  return value.trim().length === 0 ? `${label} est requis.` : null;
}

/** Longueur minimale. */
export function minLength(value: string, min: number, label = 'Ce champ'): ValidationMessage {
  return value.trim().length < min ? `${label} doit contenir au moins ${min} caractères.` : null;
}

/** Longueur maximale. */
export function maxLength(value: string, max: number, label = 'Ce champ'): ValidationMessage {
  return value.length > max ? `${label} ne peut pas dépasser ${max} caractères.` : null;
}

/** Bornes numériques incluses. */
export function inRange(value: number, min: number, max: number, label = 'La valeur'): ValidationMessage {
  if (Number.isNaN(value)) return `${label} doit être un nombre.`;
  if (value < min || value > max) return `${label} doit être comprise entre ${min} et ${max}.`;
  return null;
}

/** Format `HH:mm`. */
export function isTimeString(value: string): ValidationMessage {
  return TIME_PATTERN.test(value) ? null : "L'heure doit être au format HH:mm.";
}

/** Email — utilisé uniquement si l'utilisateur en saisit un volontairement. */
export function isEmail(value: string): ValidationMessage {
  return EMAIL_PATTERN.test(value.trim()) ? null : "Cette adresse e-mail n'est pas valide.";
}

/**
 * Exécute une suite de validations et renvoie la première erreur.
 * Rend les formulaires lisibles sans chaînes de conditions.
 */
export function firstError(...messages: ValidationMessage[]): ValidationMessage {
  return messages.find((message) => message !== null) ?? null;
}

/** Vrai si aucun message d'erreur n'est présent. */
export function isValid(...messages: ValidationMessage[]): boolean {
  return firstError(...messages) === null;
}

/**
 * Valide la forme d'un document de sauvegarde ZENTIQ.
 * Volontairement tolérant : on vérifie ce dont l'import a besoin, pas plus.
 */
export function isBackupDocument(value: unknown): value is {
  kind: 'zentiq-backup';
  schemaVersion: number;
  exportedAt: string;
  data: Record<string, unknown>;
} {
  if (typeof value !== 'object' || value === null) return false;
  const doc = value as Record<string, unknown>;
  return (
    doc.kind === 'zentiq-backup' &&
    typeof doc.schemaVersion === 'number' &&
    typeof doc.exportedAt === 'string' &&
    typeof doc.data === 'object' &&
    doc.data !== null
  );
}

/**
 * Nettoie une chaîne destinée à un identifiant ou un slug.
 * Sans accents, minuscules, tirets simples.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Vrai si la valeur est un objet simple (et non un tableau ou null). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

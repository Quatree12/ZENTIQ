import type { BaseEntity, MoodLevel } from './index';

/**
 * Un check-in d'humeur pour une journée donnée.
 *
 * Une seule entrée par jour est attendue (clé logique `date`), mais le schéma
 * n'impose pas la contrainte : l'utilisateur doit pouvoir corriger son ressenti
 * et garder une trace de son évolution.
 */
export interface MoodEntry extends BaseEntity {
  /** Jour concerné, format `YYYY-MM-DD` (index). */
  date: string;
  /** Ressenti global, 1 (difficile) à 5 (lumineux). */
  mood: MoodLevel;
  /** Énergie perçue, 1 à 5. Facultative. */
  energy?: MoodLevel;
  /** Note libre courte. */
  note: string;
  /** Émotions sélectionnées (tags courts : 'calme', 'focus', …). */
  emotions: string[];
}

/** Libellés non culpabilisants associés à l'échelle d'humeur. */
export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: 'Difficile',
  2: 'En retrait',
  3: 'Neutre',
  4: 'Posé',
  5: 'Lumineux',
};

export const MOOD_LEVELS: MoodLevel[] = [1, 2, 3, 4, 5];

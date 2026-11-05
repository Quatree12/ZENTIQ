import type { MoodLevel } from '@/types';

/**
 * Suggestions d'émotions pour le check-in d'humeur.
 *
 * Libellés neutres : ils décrivent un état, ils ne le jugent pas.
 *
 * NOTE : le jeu de contenu inspirant a déménagé dans `@/content/library`, qui
 * est désormais la seule source de vérité (48 citations, 24 affirmations,
 * 24 références musicales). Ce fichier ne porte plus que les émotions, pour
 * éviter deux sources concurrentes.
 */

export const MOOD_EMOTIONS: string[] = [
  'calme',
  'focused',
  'fatigué',
  'motivé',
  'tendu',
  'reconnaissant',
  'solitaire',
  'énergique',
];

/** Réexport de commodité pour les composants qui n'importent pas les types. */
export type { MoodLevel };

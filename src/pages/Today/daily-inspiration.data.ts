import type { MoodLevel } from '@/types';

/**
 * Jeu d'inspirations du jour.
 *
 * Ce fichier est un jeu de départ : la banque de contenu complète, ses
 * catégories et sa recherche arrivent dans la phase « Contenu & curation ».
 * Il vit ici, avec la page qui l'utilise, plutôt que d'être semé dans la base :
 * rien n'est présenté comme une donnée utilisateur.
 */

export interface DailyInspirationItem {
  text: string;
  author: string;
  /** Catégorie éditoriale, alignée sur le modèle de contenu. */
  category: 'motivation' | 'calme' | 'confiance' | 'resilience' | 'clarte';
}

export const DAILY_INSPIRATION: DailyInspirationItem[] = [
  {
    text: "Tu n'as pas besoin de tout savoir pour commencer. Il suffit d'un pas.",
    author: 'ZENTIQ',
    category: 'motivation',
  },
  {
    text: 'Le calme n\'est pas l\'absence de mouvement, c\'est un endroit où se poser.',
    author: 'ZENTIQ',
    category: 'calme',
  },
  {
    text: 'Fais confiance à la lenteur. Elle construit ce que la vitesse disperse.',
    author: 'ZENTIQ',
    category: 'clarte',
  },
  {
    text: "Ce que tu répètes devient ce que tu es. Choisis tes répétitions avec soin.",
    author: 'ZENTIQ',
    category: 'confiance',
  },
  {
    text: 'Revenir après une pause n\'est pas repartir de zéro.',
    author: 'ZENTIQ',
    category: 'resilience',
  },
  {
    text: 'Ta motivation ne disparaît pas. Parfois elle a juste besoin de silence.',
    author: 'ZENTIQ',
    category: 'resilience',
  },
  {
    text: 'Commence petit. Petit, répété, devient grand.',
    author: 'ZENTIQ',
    category: 'motivation',
  },
];

/** Suggestions d'émotions pour le check-in — libellés neutres. */
export const MOOD_EMOTIONS: string[] = [
  'calme',
  'focused',
  'fatigué',
  ' motivé',
  'tendu',
  'reconnaissant',
];

/** Réexport de commodité pour les composants qui n'importent pas les types. */
export type { MoodLevel };

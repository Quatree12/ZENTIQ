import type { BaseEntity } from './index';

/** Familles de contenu inspirant. */
export type InspirationKind = 'quote' | 'affirmation' | 'music';

/** Domaines éditoriaux — servent au filtrage et à la découverte. */
export type InspirationCategory =
  | 'motivation'
  | 'calme'
  | 'confiance'
  | 'resilience'
  | 'clarte'
  | 'gratitude'
  | 'courage'
  | 'focus';

/**
 * Noyau commun aux contenus inspirants.
 *
 * Le contenu éditorial vit en base locale : il doit être disponible hors ligne
 * et pouvoir être étoffé par des phases de curation sans changer le schéma.
 */
export interface InspirationItem extends BaseEntity {
  /** Texte principal (la citation, l'affirmation, ou le titre de la chanson). */
  text: string;
  /** Auteur, interprète ou source. */
  author: string;
  category: InspirationCategory;
  /** Ajouté aux favoris — dénormalisé pour un filtrage immédiat. */
  favorite: boolean;
  /** Compteur d'affichages, utilisé pour ne pas répéter le même contenu. */
  shownCount: number;
  /** Langue du contenu, pour préparer l'internationalisation. */
  language: 'fr' | 'en';
}

export interface Quote extends InspirationItem {}
export interface Affirmation extends InspirationItem {}

/** Référence musicale inspirante. */
export interface MusicInspiration extends BaseEntity {
  /** Titre de la chanson. */
  title: string;
  /** Interprète ou compositeur. */
  artist: string;
  /** Extrait de paroles ou note d'écoute. */
  note: string;
  category: InspirationCategory;
  favorite: boolean;
  /** Moment d'écoute conseillé. */
  moment: 'matin' | 'focus' | 'soir' | 'effort';
  /** Lien facultatif vers une plateforme d'écoute. */
  externalUrl?: string;
}

/**
 * Favori générique.
 *
 * Évite d'ajouter une colonne `favorite` à chaque futur type de contenu :
 * une seule table référence n'importe quelle entité par `refType` + `refId`.
 */
export interface Favorite extends BaseEntity {
  refType: 'quote' | 'affirmation' | 'music';
  refId: string;
}

export const INSPIRATION_CATEGORY_LABELS: Record<InspirationCategory, string> = {
  motivation: 'Motivation',
  calme: 'Calme',
  confiance: 'Confiance',
  resilience: 'Résilience',
  clarte: 'Clarté',
  gratitude: 'Gratitude',
  courage: 'Courage',
  focus: 'Focus',
};

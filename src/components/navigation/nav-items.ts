/**
 * Navigation principale.
 *
 * Une seule source de vérité pour les cinq espaces : la sidebar desktop, le
 * drawer mobile et la barre inférieure mobile en dérivent tous. Ajouter un
 * espace ne demande donc qu'une entrée ici.
 */
import {
  Compass,
  Footprints,
  Route,
  Sprout,
  Sun,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  /** Chemin de route. */
  path: string;
  /** Libellé affiché. */
  label: string;
  /** Phrase courte, utilisée en sous-titre et en infobulle. */
  tagline: string;
  /** Icône Lucide. */
  icon: LucideIcon;
  /** Affiché dans la barre inférieure mobile (limité à 5). */
  inMobileBar: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    path: '/today',
    label: 'Today',
    tagline: 'Ton point de départ du jour',
    icon: Sun,
    inMobileBar: true,
  },
  {
    path: '/inspire',
    label: 'Inspire',
    tagline: 'Citations, affirmations, musique',
    icon: Compass,
    inMobileBar: true,
  },
  {
    path: '/grow',
    label: 'Grow',
    tagline: 'Objectifs, habitudes, challenges',
    icon: Sprout,
    inMobileBar: true,
  },
  {
    path: '/journey',
    label: 'Journey',
    tagline: 'Journal, humeurs, évolution',
    icon: Route,
    inMobileBar: true,
  },
  {
    path: '/me',
    label: 'Me',
    tagline: 'Profil, préférences, confidentialité',
    icon: Footprints,
    inMobileBar: true,
  },
];

/** Route d'accueil de l'application. */
export const HOME_PATH = '/today';

/**
 * Retrouve l'élément de navigation correspondant à un chemin.
 * La correspondance est préfixée : `/grow/habits` reste dans l'espace Grow.
 */
export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
}

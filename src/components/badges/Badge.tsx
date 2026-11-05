/**
 * Badge — etiquette courte, tonale.
 * Utilise pour les categories, les statuts et les compteurs.
 *
 * PHASE 4.1 — TONS D'ACCENT
 * -------------------------
 * Deux tons suivent desormais l'ACCENT ACTIF plutot qu'une couleur figee :
 *
 *   'accent'    -> --color-accent        (teal par defaut, lavande si thème lavande)
 *   'inspiration' -> --color-inspiration (la teinte complementaire de l'accent)
 *
 * Les anciens tons `teal` et `lavender` sont CONSERVES : ils restent utiles
 * quand une couleur precise porte un sens (un badge « Musique » toujours teal,
 * par exemple), independamment du theme choisi.
 *
 * Ce qui a change dans les ecrans : les badges de categorie des citations et
 * des affirmations utilisaient `tone="lavender"` en dur. En accent teal, ils
 * restaient donc lavande — incoherent avec le reste de la page. Ils passent a
 * `tone="accent"` et suivent le theme.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import './Badge.css';

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'inspiration'
  | 'teal'
  | 'lavender'
  | 'success'
  | 'warning'
  | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Variante pleine, pour les etats actifs. */
  solid?: boolean;
  /** Icone optionnelle. */
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', solid = false, icon, className, children, ...rest }: BadgeProps) {
  const classes = [
    'badge',
    'badge--' + tone,
    solid ? 'badge--solid' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {icon && (
        <span className="badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

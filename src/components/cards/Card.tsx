/**
 * Carte standard — surface élévée, bordure fine, padding généreux.
 * Peut devenir interactive : dans ce cas elle est rendue comme un bouton,
 * donc focusable et activable au clavier.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Rend la carte cliquable (rôle bouton, focusable). */
  interactive?: boolean;
  /** Padding réduit, pour les listes denses. */
  compact?: boolean;
  /** Accent discret du contour. */
  accent?: 'none' | 'teal' | 'lavender';
  children: ReactNode;
}

export function Card({
  interactive = false,
  compact = false,
  accent = 'none',
  className,
  children,
  onClick,
  ...rest
}: CardProps) {
  const classes = [
    'card',
    compact ? 'card--compact' : '',
    accent !== 'none' ? `card--accent-${accent}` : '',
    interactive ? 'card--interactive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  if (interactive) {
    return (
      <button type="button" className={classes} onClick={onClick} {...rest}>
        {children}
      </button>
    );
  }

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

/** Carte éditoriale — pour l'inspiration (citation, affirmation, texte fort). */
export interface EditorialCardProps extends HTMLAttributes<HTMLElement> {
  /** Sur-titre discret. */
  eyebrow?: string;
  /** Texte principal, mis en scène par la typographie éditoriale. */
  text: string;
  /** Attribution : auteur, artiste, source. */
  attribution?: string;
  /** Actions affichées en pied de carte. */
  footer?: ReactNode;
  /** Dosage de l'accent lavande. */
  tone?: 'inspiration' | 'neutral';
}

export function EditorialCard({
  eyebrow,
  text,
  attribution,
  footer,
  tone = 'inspiration',
  className,
  ...rest
}: EditorialCardProps) {
  const classes = ['editorial-card', tone === 'inspiration' ? 'editorial-card--tone' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <figure className={classes} {...rest}>
      {eyebrow && <p className="overline editorial-card__eyebrow">{eyebrow}</p>}
      <blockquote className="editorial-card__text editorial-quote">{text}</blockquote>
      {attribution && <figcaption className="editorial-card__author">{attribution}</figcaption>}
      {footer && <div className="editorial-card__footer">{footer}</div>}
    </figure>
  );
}

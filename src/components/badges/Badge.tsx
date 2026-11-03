/**
 * Badge — étiquette courte, tonale.
 * Utilisé pour les catégories, les statuts et les compteurs.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import './Badge.css';

export type BadgeTone =
  | 'neutral'
  | 'teal'
  | 'lavender'
  | 'success'
  | 'warning'
  | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Variante pleine, pour les états actifs. */
  solid?: boolean;
  /** Icône optionnelle. */
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', solid = false, icon, className, children, ...rest }: BadgeProps) {
  const classes = [
    'badge',
    `badge--${tone}`,
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

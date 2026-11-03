/**
 * Bouton icône — action compacte, cible tactile conservée à 44 px.
 * Utilisé pour les actions de ligne (favori, épingler, supprimer).
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import './IconButton.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Libellé accessible — obligatoire, l'icône seule n'est pas lisible. */
  label: string;
  /** Variante d'accent, pour distinguer l'état actif. */
  accent?: 'neutral' | 'teal' | 'lavender' | 'danger';
  /** État actif persisté (favori coché, filtre sélectionné). */
  active?: boolean;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, accent = 'neutral', active = false, className, children, type = 'button', ...rest },
  ref,
) {
  const classes = ['icon-btn', `icon-btn--${accent}`, active ? 'is-active' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
});

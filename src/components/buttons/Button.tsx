/**
 * Bouton — composant de base du design system.
 *
 * Trois variantes (primary, secondary, tertiary) et trois tailles. L'état
 * `loading` remplace le contenu par un indicateur tout en conservant la largeur
 * du bouton : la mise en page ne saute pas quand une action est en cours.
 */
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Affiche un indicateur et désactive l'interaction. */
  loading?: boolean;
  /** Occupe toute la largeur disponible (utile sur mobile). */
  fullWidth?: boolean;
  /** Icône affichée avant le libellé. */
  leadingIcon?: ReactNode;
  /** Icône affichée après le libellé. */
  trailingIcon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full' : '',
    loading ? 'btn--loading' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 className="btn__spinner" size={16} aria-hidden="true" />
      ) : (
        leadingIcon && (
          <span className="btn__icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )
      )}
      <span className="btn__label">{children}</span>
      {!loading && trailingIcon && (
        <span className="btn__icon" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
});

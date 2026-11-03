/**
 * Élément de navigation — lien de route, état actif explicite.
 *
 * `aria-current="page"` porte l'état actif : la couleur seule ne suffit pas
 * pour un lecteur d'écran.
 */
import { NavLink } from 'react-router-dom';
import type { NavItem } from './nav-items';
import './NavItem.css';

export interface NavItemLinkProps {
  item: NavItem;
  /** Variante compacte, pour la barre inférieure mobile. */
  compact?: boolean;
  /** Appelé après la navigation (fermeture du drawer). */
  onNavigate?: () => void;
}

export function NavItemLink({ item, compact = false, onNavigate }: NavItemLinkProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={false}
      onClick={onNavigate}
      className={({ isActive }) =>
        ['nav-item', compact ? 'nav-item--compact' : '', isActive ? 'is-active' : '']
          .filter(Boolean)
          .join(' ')
      }
      aria-current={undefined}
    >
      {({ isActive }) => (
        <>
          <span className="nav-item__icon" aria-hidden="true">
            <Icon size={compact ? 20 : 18} />
          </span>
          <span className="nav-item__text">
            <span className="nav-item__label">{item.label}</span>
            {!compact && <span className="nav-item__tagline">{item.tagline}</span>}
          </span>
          {isActive && (
            <span className="sr-only">(espace actif)</span>
          )}
        </>
      )}
    </NavLink>
  );
}

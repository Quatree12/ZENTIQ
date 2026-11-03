/**
 * Sidebar desktop — navigation fixe, 240 px.
 *
 * Masquée sous 900 px, où la barre inférieure prend le relais. Le logo ramène
 * à l'espace Today.
 */
import { Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, HOME_PATH } from '@/components/navigation';
import { NavItemLink } from '@/components/navigation/NavItem';
import { APP_TAGLINE } from '@/app/app-config';
import './Sidebar.css';

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Navigation latérale">
      <NavLink to={HOME_PATH} className="sidebar__brand">
        <span className="sidebar__mark" aria-hidden="true">
          <Sparkles size={20} />
        </span>
        <span className="sidebar__brand-text">
          <span className="sidebar__name">ZENTIQ</span>
          <span className="sidebar__tagline">{APP_TAGLINE}</span>
        </span>
      </NavLink>

      <nav className="sidebar__nav" aria-label="Navigation principale">
        {NAV_ITEMS.map((item) => (
          <NavItemLink key={item.path} item={item} />
        ))}
      </nav>

      <p className="sidebar__footer body-sm">
        Tes données restent sur cet appareil.
      </p>
    </aside>
  );
}

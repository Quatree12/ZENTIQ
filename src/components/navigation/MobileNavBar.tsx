/**
 * Barre inférieure mobile — accès direct aux cinq espaces.
 * Visible uniquement sous 900 px ; la sidebar prend le relais au-delà.
 */
import { NAV_ITEMS } from './nav-items';
import { NavItemLink } from './NavItem';
import './MobileNavBar.css';

export function MobileNavBar() {
  return (
    <nav className="mobile-nav" aria-label="Navigation principale">
      {NAV_ITEMS.filter((item) => item.inMobileBar).map((item) => (
        <NavItemLink key={item.path} item={item} compact />
      ))}
    </nav>
  );
}

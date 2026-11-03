/**
 * Drawer mobile.
 *
 * Sur petit écran, l'en-tête porte un bouton qui ouvre ce panneau. Il contient
 * la navigation complète (avec les sous-titres d'espace) et se ferme au clic
 * sur un lien, sur le fond ou avec Échap.
 */
import { Menu, X } from 'lucide-react';
import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { HOME_PATH, NAV_ITEMS } from '@/components/navigation';
import { NavItemLink } from '@/components/navigation/NavItem';
import { APP_TAGLINE } from '@/app/app-config';
import './MobileDrawer.css';

export interface MobileDrawerProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/** Bouton d'ouverture, monté dans l'en-tête mobile. */
export function MobileDrawerTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="drawer-trigger" onClick={onOpen} aria-label="Ouvrir le menu">
      <Menu size={20} aria-hidden="true" />
    </button>
  );
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  // Échap ferme le drawer ; le défilement de l'arrière-plan est bloqué.
  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Menu de navigation">
      <button
        type="button"
        className="drawer__backdrop"
        onClick={onClose}
        aria-label="Fermer le menu"
        tabIndex={-1}
      />
      <div className="drawer__panel">
        <header className="drawer__header">
          <NavLink to={HOME_PATH} className="drawer__brand" onClick={onClose}>
            <span className="drawer__name">ZENTIQ</span>
            <span className="drawer__tagline">{APP_TAGLINE}</span>
          </NavLink>
          <button type="button" className="drawer-trigger" onClick={onClose} aria-label="Fermer le menu">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <nav className="drawer__nav" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => (
            <NavItemLink key={item.path} item={item} onNavigate={onClose} />
          ))}
        </nav>

        <p className="drawer__footer body-sm">Tes données restent sur cet appareil.</p>
      </div>
    </div>
  );
}

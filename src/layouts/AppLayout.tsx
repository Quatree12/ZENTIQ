/**
 * Coquille applicative.
 *
 * Desktop : sidebar fixe + contenu centré (max 1100 px).
 * Mobile : en-tête compact avec bouton de menu + barre inférieure, contenu
 * remonté pour ne pas passer sous la barre.
 *
 * Un bandeau d'état hors ligne apparaît au-dessus du contenu dès que la
 * connexion est perdue — l'application reste pleinement utilisable.
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { MobileNavBar } from '@/components/navigation';
import { useOffline } from '@/hooks/useOffline';
import { Sidebar } from './Sidebar';
import { MobileDrawer, MobileDrawerTrigger } from './MobileDrawer';
import { APP_NAME } from '@/app/app-config';
import './AppLayout.css';

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isOffline } = useOffline();

  return (
    <div className="app-shell">
      {/* Lien d'évitement : premier élément focusable de la page */}
      <a className="skip-link" href="#contenu-principal">
        Aller au contenu
      </a>

      <Sidebar />

      <header className="app-topbar">
        <MobileDrawerTrigger onOpen={() => setDrawerOpen(true)} />
        <span className="app-topbar__name">{APP_NAME}</span>
        <span className="app-topbar__spacer" />
      </header>

      <MobileDrawer
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="app-main">
        {isOffline && (
          <div className="app-offline" role="status">
            <WifiOff size={16} aria-hidden="true" />
            <p>Tu es hors ligne — tes données restent accessibles.</p>
          </div>
        )}

        <main className="container app-content" id="contenu-principal" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <MobileNavBar />
    </div>
  );
}

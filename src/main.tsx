import '@/design-system/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/app/App';
import { applyRenderSettings, readCachedRenderSettings } from '@/services/storage.service';
import { registerServiceWorker } from '@/services/offline.service';

/**
 * Point d'entrée de ZENTIQ.
 *
 * 1. Applique les préférences visuelles mises en cache AVANT le premier rendu,
 *    pour éviter un clignotement de thème.
 * 2. Monte React.
 * 3. Enregistre le service worker (no-op en développement).
 */

// 1. Thème, densité et réduction d'animation, dès que possible.
const cached = readCachedRenderSettings();
applyRenderSettings(
  cached ?? { accentTheme: 'teal', reduceMotion: false, density: 'comfortable' },
);

const container = document.getElementById('root');

if (!container) {
  throw new Error('ZENTIQ: élément #root introuvable dans index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Le splash statique de index.html a rempli son rôle dès que React a peint.
document.getElementById('boot-splash')?.remove();

// 3. Le service worker n'est actif qu'en production (cf. offline.service.ts).
void registerServiceWorker();

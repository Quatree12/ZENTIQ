/**
 * Point d'entree de ZENTIQ.
 *
 * 1. Applique les preferences visuelles mises en cache AVANT le premier rendu,
 *    pour eviter un clignotement de theme et de taille de texte.
 * 2. Monte React.
 * 3. Enregistre le service worker (no-op en developpement).
 *
 * NOTE : la valeur de repli inclut `largeReadableText`. Sans cela, un premier
 * demarrage sur un appareil neuf appliquait un objet incomplet, et l'attribut
 * `data-large-text` n'etait jamais pose.
 */
import '@/design-system/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/app/App';
import { applyRenderSettings, readCachedRenderSettings } from '@/services/storage.service';
import { registerServiceWorker } from '@/services/offline.service';

const FALLBACK_RENDER_SETTINGS = {
  accentTheme: 'teal' as const,
  reduceMotion: false,
  density: 'comfortable' as const,
  largeReadableText: false,
};

const cached = readCachedRenderSettings();

/**
 * Fusion avec les valeurs de repli : un cache ecrit par une version anterieure
 * ne contient pas forcement `largeReadableText`. On complete plutot que de
 * rejeter, pour ne jamais perdre les preferences deja enregistrees.
 */
applyRenderSettings(cached ? { ...FALLBACK_RENDER_SETTINGS, ...cached } : FALLBACK_RENDER_SETTINGS);

const container = document.getElementById('root');

if (!container) {
  throw new Error('ZENTIQ: element #root introuvable dans index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Le splash statique de index.html a rempli son role des que React a peint.
document.getElementById('boot-splash')?.remove();

// Le service worker n'est actif qu'en production (cf. offline.service.ts).
void registerServiceWorker();

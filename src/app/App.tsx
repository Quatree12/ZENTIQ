import { APP_NAME, APP_TAGLINE, APP_VERSION } from '@/app/app-config';

/**
 * ZENTIQ — Your mind. Your momentum.
 *
 * Application PWA local-first de motivation et de développement personnel.
 * Toutes les données personnelles restent sur l'appareil (IndexedDB).
 *
 * NOTE : composant temporaire — remplacé par AppLayout + router.tsx à l'étape
 * suivante du scaffold.
 */
export default function App() {
  return (
    <main className="container stack" style={{ paddingBlock: 'var(--space-16)' }}>
      <p className="overline">
        {APP_NAME} · v{APP_VERSION}
      </p>
      <h1 className="editorial-title">{APP_TAGLINE}</h1>
      <p className="body-lg">
        Fondations en cours d'assemblage : design system, navigation, base locale et PWA.
      </p>
    </main>
  );
}

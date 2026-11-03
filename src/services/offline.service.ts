import { APP_VERSION } from '@/app/app-config';

/**
 * Service hors ligne.
 *
 * Trois responsabilités :
 *   1. Enregistrer le service worker (production uniquement).
 *   2. Informer l'application de l'état de la connexion.
 *   3. Détecter une mise à jour disponible et l'appliquer sur décision de
 *      l'utilisateur — jamais en silence.
 */

export type ConnectionState = 'online' | 'offline';

export interface ServiceWorkerState {
  supported: boolean;
  registered: boolean;
  updateReady: boolean;
  /** Version applicative en cache, si connue. */
  cachedVersion: string | null;
}

let serviceWorkerState: ServiceWorkerState = {
  supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  registered: false,
  updateReady: false,
  cachedVersion: null,
};

const swListeners = new Set<(state: ServiceWorkerState) => void>();

function setServiceWorkerState(next: Partial<ServiceWorkerState>): void {
  serviceWorkerState = { ...serviceWorkerState, ...next };
  for (const listener of swListeners) listener(serviceWorkerState);
}

/** S'abonne aux changements d'état du service worker. */
export function subscribeToServiceWorker(
  listener: (state: ServiceWorkerState) => void,
): () => void {
  swListeners.add(listener);
  listener(serviceWorkerState);
  return () => {
    swListeners.delete(listener);
  };
}

export function getServiceWorkerState(): ServiceWorkerState {
  return serviceWorkerState;
}

/** Référence du service worker en attente d'activation. */
let waitingWorker: ServiceWorker | null = null;

/**
 * Enregistre le service worker.
 *
 * En développement, la fonction ne fait rien : le SW n'est généré qu'au build,
 * et un enregistrement à chaud rendrait le rechargement imprévisible.
 */
export async function registerServiceWorker(): Promise<void> {
  if (!serviceWorkerState.supported) return;
  if (!import.meta.env.PROD) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    setServiceWorkerState({ registered: true });

    // Une mise à jour est déjà en attente d'activation.
    if (registration.waiting) {
      waitingWorker = registration.waiting;
      setServiceWorkerState({ updateReady: true });
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;

      installing.addEventListener('statechange', () => {
        // `installed` + un contrôleur existant = mise à jour prête,
        // par opposition à une première installation.
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = installing;
          setServiceWorkerState({ updateReady: true });
        }
      });
    });

    setServiceWorkerState({ cachedVersion: APP_VERSION });
  } catch {
    // Un échec d'enregistrement n'empêche pas l'application de fonctionner :
    // elle perd « installer » et le cache, pas ses données.
    setServiceWorkerState({ registered: false });
  }
}

/**
 * Active la mise à jour en attente et recharge la page.
 * Appelée uniquement sur action explicite de l'utilisateur.
 */
export function applyUpdate(): void {
  if (!waitingWorker) {
    window.location.reload();
    return;
  }
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  waitingWorker = null;
  window.location.reload();
}

/* --------------------------------------------------------------------------
   État de la connexion
   -------------------------------------------------------------------------- */

export function getConnectionState(): ConnectionState {
  if (typeof navigator === 'undefined') return 'online';
  return navigator.onLine ? 'online' : 'offline';
}

export function subscribeToConnection(
  listener: (state: ConnectionState) => void,
): () => void {
  const handleOnline = () => listener('online');
  const handleOffline = () => listener('offline');

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export function isOnline(): boolean {
  return getConnectionState() === 'online';
}

/**
 * Message affiché lorsque l'application est hors ligne.
 * Il rassure sur un point précis : les données restent accessibles.
 */
export const OFFLINE_MESSAGE =
  'Tu es hors ligne. ZENTIQ fonctionne normalement et tes données restent accessibles.';

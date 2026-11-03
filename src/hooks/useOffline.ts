/**
 * Hooks d'état de l'application : connexion et disponibilité du service worker.
 */
import { useEffect, useState } from 'react';
import {
  getConnectionState,
  getServiceWorkerState,
  subscribeToConnection,
  subscribeToServiceWorker,
  type ConnectionState,
  type ServiceWorkerState,
} from '@/services/offline.service';

export interface UseOfflineResult {
  state: ConnectionState;
  isOffline: boolean;
  isOnline: boolean;
}

/** Suit l'état de la connexion réseau. */
export function useOffline(): UseOfflineResult {
  const [state, setState] = useState<ConnectionState>(getConnectionState);

  useEffect(() => subscribeToConnection(setState), []);

  return {
    state,
    isOffline: state === 'offline',
    isOnline: state === 'online',
  };
}

export interface UseServiceWorkerResult extends ServiceWorkerState {
  /** Applique la mise à jour en attente et recharge la page. */
  applyUpdate: () => void;
}

/** Suit l'état du service worker et expose l'application d'une mise à jour. */
export function useServiceWorker(): UseServiceWorkerResult {
  const [state, setState] = useState<ServiceWorkerState>(getServiceWorkerState);

  useEffect(() => subscribeToServiceWorker(setState), []);

  return {
    ...state,
    applyUpdate: () => {
      // Import différé : évite de charger le service offline avant qu'il ne serve.
      void import('@/services/offline.service').then((module) => module.applyUpdate());
    },
  };
}

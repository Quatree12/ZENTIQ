/**
 * Store applicatif : état global de démarrage et de la base locale.
 *
 * Il porte ce qui concerne l'application entière plutôt qu'un domaine :
 * ouverture d'IndexedDB, présence de données, jauge de stockage, dernière route.
 */
import { create } from 'zustand';
import {
  estimateStorage,
  openDatabase,
  subscribeToDatabase,
  type StorageEstimate,
} from '@/database/db';
import { summarizeLocalData, type LocalDataSummary } from '@/services/export.service';
import { readLastRoute, writeLastRoute } from '@/services/storage.service';

export type BootStatus = 'pending' | 'ready' | 'error';

interface AppState {
  bootStatus: BootStatus;
  bootError: string | null;
  /** Vrai si la base contient déjà au moins une donnée personnelle. */
  hasData: boolean;
  /** Vrai une fois l'inspection des données terminée. */
  dataChecked: boolean;
  storage: StorageEstimate | null;
  summary: LocalDataSummary | null;
  lastRoute: string | null;

  boot: () => Promise<void>;
  refreshStorage: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  rememberRoute: (path: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  bootStatus: 'pending',
  bootError: null,
  hasData: false,
  dataChecked: false,
  storage: null,
  summary: null,
  lastRoute: readLastRoute(),

  /**
   * Démarre l'application : ouvre la base, puis évalue si des données existent.
   * Un échec n'est pas fatal — l'application explique ce qui se passe au lieu
   * de rester bloquée sur un écran vide.
   */
  boot: async () => {
    const result = await openDatabase();

    if (!result.ok) {
      set({ bootStatus: 'error', bootError: result.error });
      return;
    }

    // L'état de la base est répliqué dans le store pour l'UI.
    subscribeToDatabase((state) => {
      if (state.status === 'error') {
        set({ bootStatus: 'error', bootError: state.error });
      }
    });

    set({ bootStatus: 'ready', bootError: null });

    const summary = await summarizeLocalData();
    set({ summary, hasData: summary.total > 0, dataChecked: true });
    set({ lastRoute: readLastRoute() });
  },

  refreshStorage: async () => {
    const storage = await estimateStorage();
    set({ storage });
  },

  refreshSummary: async () => {
    const summary = await summarizeLocalData();
    set({ summary, hasData: summary.total > 0, dataChecked: true });
  },

  rememberRoute: (path) => {
    // La route racine n'a pas d'intérêt à être mémorisée.
    if (path && path !== '/') writeLastRoute(path);
    set({ lastRoute: path });
  },

  reset: () =>
    set({
      bootStatus: 'pending',
      bootError: null,
      hasData: false,
      dataChecked: false,
      storage: null,
      summary: null,
    }),
}));

import { appConfig } from '@/app/app-config';

/**
 * Accès au stockage local hors IndexedDB.
 *
 * IndexedDB porte les données métier ; il reste utile pour de petites valeurs
 * de rendu (dernière route, préférence de thème immédiatement applicable) qui
 * doivent être lues de façon synchrone au démarrage.
 *
 * Tout est encapsulé : le reste de l'application ne manipule jamais
 * `localStorage` directement, ce qui rend le comportement prévisible quand le
 * navigateur le refuse (navigation privée, quota, politique d'entreprise).
 */

const isAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probeKey = '__zentiq_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
};

export const storage = {
  /** Disponibilité du stockage (faux en navigation privée stricte). */
  available: isAvailable(),

  /** Lecture typée, avec valeur de repli. Ne lève jamais. */
  read<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  /** Écriture typée. Renvoie `false` si l'écriture a échoué. */
  write(key: string, value: unknown): boolean {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  /** Suppression, sans erreur si la clé n'existe pas. */
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Volontairement silencieux : un échec de nettoyage n'est pas bloquant.
    }
  },
};

/** Dernière section visitée — permet de retrouver sa place à la réouverture. */
export function readLastRoute(): string | null {
  return storage.read<string | null>(appConfig.storageKeys.lastRoute, null);
}

export function writeLastRoute(path: string): void {
  storage.write(appConfig.storageKeys.lastRoute, path);
}

/**
 * Profil de rendu mis en cache : évite un clignotement de thème au démarrage
 * avant que IndexedDB ne soit ouvert.
 */
export interface CachedRenderSettings {
  accentTheme: 'teal' | 'lavender';
  reduceMotion: boolean;
  density: 'comfortable' | 'compact';
}

export function readCachedRenderSettings(): CachedRenderSettings | null {
  return storage.read<CachedRenderSettings | null>(appConfig.storageKeys.settings, null);
}

export function writeCachedRenderSettings(settings: CachedRenderSettings): void {
  storage.write(appConfig.storageKeys.settings, settings);
}

/**
 * Applique les préférences visuelles sur l'élément racine.
 * Appelé au démarrage (avant le rendu) et à chaque changement de réglage.
 */
export function applyRenderSettings(settings: CachedRenderSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = 'digital-aura';
  root.dataset.accent = settings.accentTheme;
  root.dataset.density = settings.density;
  root.dataset.reduceMotion = String(settings.reduceMotion);
}

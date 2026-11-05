import { appConfig } from '@/app/app-config';

/**
 * Acces au stockage local hors IndexedDB.
 *
 * IndexedDB porte les donnees metier ; il reste utile pour de petites valeurs
 * de rendu (derniere route, preferences visuelles) qui doivent etre lues de
 * facon synchrone au demarrage.
 *
 * Tout est encapsule : le reste de l'application ne manipule jamais
 * `localStorage` directement, ce qui rend le comportement previsible quand le
 * navigateur le refuse (navigation privee, quota, politique d'entreprise).
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
  /** Disponibilite du stockage (faux en navigation privee stricte). */
  available: isAvailable(),

  /** Lecture typee, avec valeur de repli. Ne leve jamais. */
  read<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  /** Ecriture typee. Renvoie `false` si l'ecriture a echoue. */
  write(key: string, value: unknown): boolean {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  /** Suppression, sans erreur si la cle n'existe pas. */
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Volontairement silencieux : un echec de nettoyage n'est pas bloquant.
    }
  },
};

/** Derniere section visitee — permet de retrouver sa place a la reouverture. */
export function readLastRoute(): string | null {
  return storage.read<string | null>(appConfig.storageKeys.lastRoute, null);
}

export function writeLastRoute(path: string): void {
  storage.write(appConfig.storageKeys.lastRoute, path);
}

/**
 * Preferences de rendu mises en cache : evite un clignotement de theme au
 * demarrage, avant que IndexedDB ne soit ouvert.
 *
 * `largeReadableText` a ete AJOUTE ici (et non remplace) : la preference etait
 * persistee en base mais absente du cache de rendu, donc perdue jusqu'a
 * l'ouverture d'IndexedDB — et jamais appliquee, faute de regle CSS.
 */
export interface CachedRenderSettings {
  accentTheme: 'teal' | 'lavender';
  reduceMotion: boolean;
  density: 'comfortable' | 'compact';
  largeReadableText: boolean;
}

export function readCachedRenderSettings(): CachedRenderSettings | null {
  return storage.read<CachedRenderSettings | null>(appConfig.storageKeys.settings, null);
}

export function writeCachedRenderSettings(settings: CachedRenderSettings): void {
  storage.write(appConfig.storageKeys.settings, settings);
}

/**
 * Applique les preferences visuelles sur l'element racine.
 * Appele au demarrage (avant le rendu) et a chaque changement de reglage.
 *
 * C'est ICI que la preference « Texte plus large » devient effective :
 * l'attribut `data-large-text` declenche le bloc correspondant de themes.css.
 * La valeur est ecrite en chaine (`'true'` / `'false'`) et non en booleen :
 * un attribut absent, vide ou a `"false"` ne doit PAS activer la regle.
 */
export function applyRenderSettings(settings: CachedRenderSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = 'digital-aura';
  root.dataset.accent = settings.accentTheme;
  root.dataset.density = settings.density;
  root.dataset.reduceMotion = String(settings.reduceMotion);
  root.dataset.largeText = String(settings.largeReadableText);
}

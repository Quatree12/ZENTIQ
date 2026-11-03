/**
 * Génération d'identifiants.
 *
 * `crypto.randomUUID` est disponible dans tous les navigateurs ciblés et
 * fonctionne hors ligne. La fonction de repli existe pour les contextes non
 * sécurisés (http local, tests), pas pour un usage courant.
 */

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Repli : suffisant pour un identifiant local, pas pour de la cryptographie.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Identifiant court, pour les clés de démonstration ou les tags. */
export function createShortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

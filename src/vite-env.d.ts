/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/**
 * Déclarations d'environnement Vite.
 *
 * `import.meta.env` est typé par vite/client ; ce fichier sert de point
 * d'ancrage pour les globaux du projet et les variables propres à ZENTIQ.
 */

interface ImportMetaEnv {
  /** Version applicative injectée au build (facultatif). */
  readonly VITE_APP_VERSION?: string;
  /** Active des traces de debug locales ('true' | 'false'). */
  readonly VITE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

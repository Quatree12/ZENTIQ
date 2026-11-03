import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Configuration Vite de ZENTIQ.
 *
 * - `base` : le site est publié sur GitHub Pages à l'adresse
 *   https://quatree12.github.io/ZENTIQ/, donc dans un sous-dossier. Sans ce
 *   réglage Vite génère des chemins absolus à la racine du domaine
 *   (/assets/...) qui renvoient une 404 et laissent la page bloquée sur le
 *   splash de démarrage.
 * - `@/` pointe vers `src/` : les imports restent stables quand
 *   l'arborescence grandit.
 * - Le plugin PWA génère le service worker et le manifest de précache au
 *   build ; en dev le SW est désactivé pour que le rechargement à chaud reste
 *   prévisible.
 *
 * NOTE : on utilise `node:path` et `resolve(__dirname, 'src')` plutôt que
 * `node:url` + `import.meta.url`. Le second exigeait `@types/node` et le
 * compilateur signalait `Cannot find module 'node:url'`.
 */
export default defineConfig({
  base: '/ZENTIQ/',

  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      strategies: 'generateSW',
      filename: 'sw.js',
      manifest: false, // on livre un public/manifest.webmanifest écrit à la main
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Le fallback de navigation doit lui aussi porter le sous-dossier,
        // sinon les routes profondes tombent hors ligne / en 404.
        navigateFallback: '/ZENTIQ/index.html',
        navigateFallbackDenylist: [/^\/ZENTIQ\/offline\.html$/],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
});

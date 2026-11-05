import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Configuration Vite de ZENTIQ.
 *
 * - `base` : le site est publie sur GitHub Pages dans un sous-dossier
 *   (https://quatree12.github.io/ZENTIQ/). Sans ce reglage, Vite genere des
 *   chemins absolus a la racine du domaine (/assets/...) qui renvoient une 404.
 * - `@/` pointe vers `src/` : les imports restent stables quand
 *   l'arborescence grandit.
 * - Le plugin PWA genere le service worker et le manifest de precache au
 *   build ; en dev le SW est desactive pour que le rechargement a chaud reste
 *   previsible.
 *
 * La configuration des TESTS vit dans `vitest.config.ts` : elle n'a pas besoin
 * du plugin PWA, qui ralentirait chaque execution.
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
      manifest: false, // on livre un public/manifest.webmanifest ecrit a la main
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

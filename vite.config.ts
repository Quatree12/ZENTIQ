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
 * - Le plugin PWA genere le service worker et le manifest de precache au build.
 *
 * PHASE 4.1 — POLICES HORS LIGNE
 * ------------------------------
 * Nunito et Cormorant Garamond viennent de Google Fonts. Le precache du build
 * ne couvre que les fichiers locaux : sans regle dediee, les polices seraient
 * perdues des que l'appareil passe hors ligne, et l'interface retomberait sur
 * la pile systeme.
 *
 * Les deux regles `runtimeCaching` ci-dessous corrigent cela :
 *   - la feuille de style Google change rarement -> StaleWhileRevalidate
 *   - les fichiers de police sont immuables      -> CacheFirst, un an
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
        navigateFallback: '/ZENTIQ/index.html',
        navigateFallbackDenylist: [/^\/ZENTIQ\/offline\.html$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Configuration Vite de ZENTIQ.
 *
 * PHASE 4.1.8 — CORRECTIF « Importing a module script failed »
 * ------------------------------------------------------------
 * Cette erreur apparaissait sur une seule route a la fois — Inspire, puis une
 * autre — alors que le reste de l'application fonctionnait.
 *
 * LA CAUSE
 *   Le service worker precisait `index.html` ET les fichiers compiles. Or Vite
 *   renomme ces fichiers a chaque build (un hash dans le nom). Si le SW servait
 *   un `index.html` ancien pointant vers des fichiers qui n'existent plus, le
 *   routeur tentait de charger une route paresseuse (`lazy()`) et echouait sur
 *   un module introuvable. Les routes deja chargees continuaient de fonctionner
 *   ce qui donnait cette impression de panne isolee.
 *
 * LA CORRECTION
 *   1. `index.html` est EXCLU du precache (globIgnores). Il est desormais
 *      toujours demande au reseau, donc jamais desynchronise de ses assets.
 *   2. Une regle `NetworkFirst` avec delai court sert le HTML : en ligne, on a
 *      la version fraiche ; hors ligne, le cache prend le relais.
 *   3. Les fichiers compiles restent en precache classique — eux portent leur
 *      hash dans le nom, donc ils ne peuvent pas etre perimes.
 *
 * Le repli hors ligne est conserve : l'application reste utilisable sans
 * reseau, mais elle ne peut plus servir un HTML qui ne correspond a rien.
 *
 * PHASE 4.1 — POLICES HORS LIGNE
 *   Deux regles de cache pour Google Fonts, sinon l'interface retombe sur la
 *   pile systeme des que l'appareil passe hors ligne.
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
        // index.html est EXCLU : il doit rester synchronise avec ses assets.
        globPatterns: ['**/*.{js,css,svg,png,woff2}'],
        globIgnores: ['**/index.html'],
        // Plus de repli de navigation sur un HTML precache.
        navigateFallback: undefined,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        runtimeCaching: [
          {
            // Le document HTML : reseau d'abord, cache en secours hors ligne.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'zentiq-documents',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Feuille de style Google Fonts.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Fichiers de police : immuables, donc cache-first.
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

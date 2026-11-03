import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Configuration Vite de ZENTIQ.
 *
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
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/offline\.html$/],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
});

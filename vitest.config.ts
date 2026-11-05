import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Configuration des tests.
 *
 * Separee de `vite.config.ts` : les tests n'ont pas besoin du plugin PWA, qui
 * ralentirait chaque execution.
 *
 * `environment: 'jsdom'` : les tests couvrent desormais des CALCULS et des
 * COMPOSANTS. Sans DOM, ni `document.documentElement` ni le rendu React ne
 * fonctionnent.
 *
 * `setupFiles` charge les matchers de `@testing-library/jest-dom` et le
 * nettoyage automatique entre tests.
 */
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});

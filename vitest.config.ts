import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Configuration des tests.
 *
 * Separee de `vite.config.ts` : les tests n'ont pas besoin du plugin PWA, qui
 * ralentirait chaque execution, et cette separation evite que la configuration
 * de build et celle des tests se genent mutuellement.
 *
 * L'alias `@/` doit etre redeclare ici : Vitest ne lit pas la configuration
 * Vite du projet quand on lui donne un fichier de configuration dedie.
 *
 * `environment: 'jsdom'` et non 'node' : les tests de la phase QA verifient
 * `applyRenderSettings`, qui ecrit sur `document.documentElement`. Sans DOM, ces
 * tests ne peuvent pas s'executer.
 */
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});

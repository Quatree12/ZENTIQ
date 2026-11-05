import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Configuration des tests.
 *
 * volontairement separee de `vite.config.ts` : les tests n'ont pas besoin du
 * plugin PWA, qui ralentirait chaque execution, et cette separation evite que
 * la configuration de build et celle des tests se genent mutuellement.
 *
 * L'alias `@/` doit etre redeclare ici : Vitest ne lit pas la configuration
 * Vite du projet quand on lui donne un fichier de configuration dedie.
 */
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});

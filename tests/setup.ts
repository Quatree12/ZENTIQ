/**
 * Amorçage des tests.
 *
 * Trois choses :
 *   1. Les matchers de `@testing-library/jest-dom` pour les assertions DOM.
 *   2. Le nettoyage automatique du DOM entre chaque test.
 *   3. Deux API du navigateur absentes de jsdom mais utilisees par
 *      l'application : `matchMedia` et `scrollIntoView`.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

afterEach(() => {
  cleanup();
});

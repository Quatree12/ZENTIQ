import '@/design-system/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/app/App';

/**
 * Point d'entrée de ZENTIQ.
 *
 * 1. Monte React sur #root.
 * 2. Retire le splash défini dans index.html dès que React a peint.
 *
 * Le routeur et les providers sont branchés à l'étape suivante du scaffold.
 */

const container = document.getElementById('root');

if (!container) {
  throw new Error('ZENTIQ: élément #root introuvable dans index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

document.getElementById('boot-splash')?.remove();

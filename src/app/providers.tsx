/**
 * Providers globaux de l'application.
 *
 * Un seul endroit compose les contextes. L'ordre compte : le routeur publie les
 * notifications, donc le fournisseur de notifications est monté au-dessus.
 */
import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/components/feedback/Toast';
import { router } from './router';

export function AppProviders() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

/**
 * Variante utilisée lorsque l'appelant fournit lui-même son routeur
 * (tests d'intégration avec une mémoire de navigation dédiée).
 */
export function AppShellProviders({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

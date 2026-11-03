/**
 * ZENTIQ — Your mind. Your momentum.
 *
 * Coquille racine : compose les providers et attend l'ouverture de la base
 * locale avant d'afficher les espaces.
 *
 * Tant que `boot()` n'a pas abouti, on affiche un écran de chargement ; si
 * l'ouverture échoue, on explique le problème au lieu de laisser un écran vide.
 */
import { useEffect } from 'react';
import { AppProviders } from './providers';
import { EmptyState, LoadingState } from '@/components/feedback';
import { useAppStore } from '@/stores/app.store';

export default function App() {
  const bootStatus = useAppStore((state) => state.bootStatus);
  const bootError = useAppStore((state) => state.bootError);
  const boot = useAppStore((state) => state.boot);

  useEffect(() => {
    void boot();
  }, [boot]);

  if (bootStatus === 'pending') {
    return (
      <div className="container">
        <LoadingState label="Préparation de ton espace…" />
      </div>
    );
  }

  if (bootStatus === 'error') {
    return (
      <div className="container">
        <EmptyState
          title="Le stockage local n'a pas pu être ouvert"
          description={bootError ?? 'Une erreur inattendue est survenue au démarrage.'}
          action={{ label: 'Recharger la page', onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  return <AppProviders />;
}

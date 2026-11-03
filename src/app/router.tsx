/**
 * Routeur applicatif.
 *
 * Cinq espaces, une seule coquille (`AppLayout`). Chaque espace est chargé à la
 * demande : l'écran d'accueil ne paie pas le coût des quatre autres.
 *
 * La route racine redirige vers `Today`. Toute route inconnue affiche un état
 * « introuvable » qui propose de revenir à l'accueil — jamais une page vide.
 */
import { Suspense, lazy, useEffect } from 'react';
import {
  createBrowserRouter,
  Navigate,
  useLocation,
  type RouteObject,
} from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { HOME_PATH } from '@/components/navigation';
import { EmptyState, LoadingState } from '@/components/feedback';
import { useAppStore } from '@/stores/app.store';

/* --------------------------------------------------------------------------
   Espaces — chargement paresseux
   -------------------------------------------------------------------------- */
const TodayPage = lazy(() => import('@/pages/Today/TodayPage'));
const InspirePage = lazy(() => import('@/pages/Inspire/InspirePage'));
const GrowPage = lazy(() => import('@/pages/Grow/GrowPage'));
const JourneyPage = lazy(() => import('@/pages/Journey/JourneyPage'));
const MePage = lazy(() => import('@/pages/Me/MePage'));

/** Mémorise la dernière route consultée, pour la retrouver à la réouverture. */
export function RouteMemory() {
  const location = useLocation();
  const rememberRoute = useAppStore((state) => state.rememberRoute);

  useEffect(() => {
    rememberRoute(location.pathname);
  }, [location.pathname, rememberRoute]);

  return null;
}

/** Écran de repli pendant le chargement d'un espace. */
function RouteFallback() {
  return (
    <div className="container">
      <LoadingState label="Ouverture de l'espace…" />
    </div>
  );
}

/** Écran affiché pour une route inconnue. */
function NotFoundPage() {
  return (
    <div className="container">
      <EmptyState
        title="Cette page n'existe pas"
        description="Le lien est peut-être incomplet. Reviens à ton espace du jour pour continuer."
        action={{
          label: 'Revenir à Today',
          onClick: () => {
            window.location.assign(HOME_PATH);
          },
        }}
      />
    </div>
  );
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={HOME_PATH} replace /> },
      {
        path: 'today',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <TodayPage />
          </Suspense>
        ),
      },
      {
        path: 'inspire',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <InspirePage />
          </Suspense>
        ),
      },
      {
        path: 'grow',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <GrowPage />
          </Suspense>
        ),
      },
      {
        path: 'journey',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <JourneyPage />
          </Suspense>
        ),
      },
      {
        path: 'me',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <MePage />
          </Suspense>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

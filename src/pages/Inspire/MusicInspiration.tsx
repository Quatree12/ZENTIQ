import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState } from '@/components/feedback';
import { ContentLibrary } from './ContentLibrary';

/**
 * Inspirations musicales.
 *
 * Le modèle de données prévoit titre, interprète, moment d'écoute et lien
 * externe. La sélection de références reste à curer : cette section annonce son
 * état plutôt que d'afficher des morceaux inventés.
 */
export function MusicInspiration() {
  return (
    <ContentLibrary tab="music" label="Musique" count={0}>
      <Card compact>
        <div className="row-wrap">
          <Badge tone="lavender">Sélection à curer</Badge>
          <Badge>Phase 02</Badge>
        </div>
        <p className="body-base spacer-top-sm">
          Les références musicales (matin, focus, effort, soir) demandent une sélection éditoriale.
          Rien n'est affiché tant qu'elle n'est pas faite — pas de morceau inventé.
        </p>
      </Card>

      <EmptyState
        title="Pas encore de sélection musicale"
        description="Cette section accueillera des titres choisis pour accompagner un moment précis de ta journée."
      />
    </ContentLibrary>
  );
}

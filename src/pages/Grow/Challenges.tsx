import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState } from '@/components/feedback';

/**
 * Challenges.
 *
 * Le modèle `Challenge` existe en base (durée, statut, jours complétés) mais
 * l'interface de création et de suivi n'est pas encore construite. Cette
 * section l'annonce au lieu de simuler des challenges.
 *
 * Règle produit rappelée ici : un challenge peut être terminé ou mis de côté,
 * jamais « raté ».
 */
export function Challenges() {
  return (
    <section className="grow-section" aria-labelledby="challenges-heading">
      <header>
        <p className="overline">Challenges</p>
        <h2 className="heading-sm" id="challenges-heading">
          Aucun challenge
        </h2>
      </header>

      <Card compact>
        <div className="row-wrap">
          <Badge tone="lavender">Interface à construire</Badge>
          <Badge>Phase 03</Badge>
        </div>
        <p className="body-base spacer-top-sm">
          Le modèle de données des challenges est déjà en place (durée, statut, jours validés,
          habitude liée). La création guidée et le suivi jour par jour arrivent à la phase suivante.
        </p>
      </Card>

      <EmptyState
        title="Pas encore de challenge"
        description="Un challenge te proposera un cadre de quelques jours, à suivre sans pression : tu peux le terminer ou le mettre de côté, jamais le « rater »."
      />
    </section>
  );
}

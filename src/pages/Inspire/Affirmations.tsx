import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState } from '@/components/feedback';

/**
 * Affirmations.
 *
 * Rien n'est inventé : la banque d'affirmations n'est pas encore livrée. Cette
 * section expose un état vide utile qui dit ce qui arrive, plutôt qu'une liste
 * fabriquée.
 */
export function Affirmations() {
  return (
    <section className="content-library" aria-labelledby="library-affirmations">
      <header className="content-library__header">
        <p className="overline">Affirmations</p>
        <h2 className="heading-sm" id="library-affirmations">
          Aucun élément
        </h2>
      </header>

      <Card compact>
        <div className="row-wrap">
          <Badge tone="lavender">Contenu à livrer</Badge>
          <Badge>Phase 02</Badge>
        </div>
        <p className="body-base spacer-top-sm">
          La structure est prête : modèle de données, recherche et favoris fonctionnent déjà. Il
          manque la banque d'affirmations elle-même, prévue avec la phase de contenu éditorial.
        </p>
      </Card>

      <EmptyState
        title="Aucune affirmation pour l'instant"
        description="Dès que la banque sera livrée, tes affirmations préférées apparaîtront ici, prêtes à être relues."
      />
    </section>
  );
}

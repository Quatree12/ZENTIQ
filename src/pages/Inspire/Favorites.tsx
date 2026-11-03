import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState } from '@/components/feedback';
import './Inspire.css';

/**
 * Favoris.
 *
 * La table `favorites`, le repository et le store sont en place et
 * fonctionnels (ajout idempotent, mise à jour optimiste, nettoyage des
 * orphelins). En revanche, il n'y a rien à mettre en favori tant que la banque
 * de contenu n'est pas livrée. Cette section le dit franchement.
 */
export function Favorites() {
  return (
    <section className="content-library" aria-labelledby="library-favorites">
      <header className="content-library__header">
        <p className="overline">Favoris</p>
        <h2 className="heading-sm" id="library-favorites">
          Aucun élément
        </h2>
      </header>

      <Card compact>
        <div className="row-wrap">
          <Badge>Stockage prêt</Badge>
          <Badge tone="teal">Contenu en attente</Badge>
        </div>
        <p className="body-base spacer-top-sm">
          Le mécanisme de favori est opérationnel : table dédiée, ajout idempotent et retour
          immédiat à l'écran. Il ne manque que du contenu à marquer.
        </p>
      </Card>

      <EmptyState
        title="Aucun favori"
        description="Quand la banque de citations, d'affirmations et de musique sera livrée, tu pourras garder ici ce qui te parle."
      />
    </section>
  );
}

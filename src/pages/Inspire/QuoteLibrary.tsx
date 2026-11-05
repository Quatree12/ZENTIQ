import { useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import { Card } from '@/components/cards';
import { Input } from '@/components/inputs';
import { Badge } from '@/components/badges';
import { IconButton } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import { useToast } from '@/components/feedback/Toast';
import { useFavorites } from '@/hooks/useProfile';
import { ContentLibrary } from './ContentLibrary';
import { CategoryGroups, groupByCategory } from './CategoryGroups';
import { QUOTES, searchContent } from '@/content/library';
import { INSPIRATION_CATEGORY_LABELS } from '@/types';
import './Inspire.css';
import './CategoryGroups.css';

/**
 * Bibliotheque de citations.
 *
 * REGROUPEMENT PAR CATEGORIE
 * --------------------------
 * Les 48 citations s'affichaient en une seule liste : on ne voyait ni les
 * themes disponibles, ni ou aller pour en lire un precis.
 *
 * Desormais, `CategoryGroups` porte un menu deroulant de categories et des
 * groupes repliables. Les categories sont DERIVEES du contenu — jamais d'une
 * liste ecrite a la main : une categorie vide ne peut pas apparaitre, et une
 * nouvelle categorie ajoutee a la banque apparaitra seule.
 *
 * La recherche reste globale : elle traverse TOUTES les categories, puis le
 * resultat est regroupe a son tour. Chercher ne doit jamais etre limite par un
 * filtre qu'on aurait oublie avoir pose.
 */
export function QuoteLibrary() {
  const [query, setQuery] = useState('');
  const { notify } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const items = useMemo(() => {
    return query.trim() ? searchContent(query).quotes : QUOTES;
  }, [query]);

  const groups = useMemo(() => groupByCategory(items), [items]);

  const handleToggle = async (id: string, text: string) => {
    const wasFavorite = isFavorite('quote', id);
    await toggleFavorite('quote', id);
    notify(wasFavorite ? 'Retire des favoris.' : 'Ajoute aux favoris.', {
      tone: 'success',
      detail: text,
    });
  };

  return (
    <ContentLibrary tab="quotes" label="Citations" count={items.length}>
      <div className="inspire-filters">
        <Input
          label="Rechercher"
          placeholder="Un mot, un auteur…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune citation trouvee"
          description={
            'Rien ne correspond a « ' + query.trim() + ' ». Essaie un autre mot, ou efface la recherche.'
          }
          action={{ label: 'Effacer la recherche', onClick: () => setQuery('') }}
        />
      ) : (
        <CategoryGroups
          groups={groups}
          itemKey={(item) => item.id}
          renderItem={(item) => (
            <Card compact className="inspire-item">
              <blockquote className="inspire-item__text">{item.text}</blockquote>
              <div className="row-between">
                <span className="inspire-item__author">{item.author}</span>
                <div className="row">
                  <Badge tone="accent">{INSPIRATION_CATEGORY_LABELS[item.category]}</Badge>
                  <IconButton
                    label={
                      isFavorite('quote', item.id)
                        ? 'Retirer des favoris'
                        : 'Ajouter aux favoris'
                    }
                    accent="teal"
                    active={isFavorite('quote', item.id)}
                    onClick={() => void handleToggle(item.id, item.text)}
                  >
                    <Heart size={16} />
                  </IconButton>
                </div>
              </div>
            </Card>
          )}
        />
      )}
    </ContentLibrary>
  );
}

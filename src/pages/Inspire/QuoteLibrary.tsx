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
import { QUOTES, searchContent } from '@/content/library';
import { INSPIRATION_CATEGORY_LABELS, type InspirationCategory } from '@/types';
import './Inspire.css';

/**
 * Bibliothèque de citations.
 *
 * Source : la banque éditoriale (`@/content/library`). La recherche est locale,
 * donc elle fonctionne hors ligne. Les filtres de catégorie sont dérivés du
 * contenu réellement présent — jamais de catégories vides inventées.
 */
export function QuoteLibrary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<InspirationCategory | 'all'>('all');
  const { notify } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const categories = useMemo(
    () => Array.from(new Set(QUOTES.map((item) => item.category))),
    [],
  );

  const items = useMemo(() => {
    const base = query.trim() ? searchContent(query).quotes : QUOTES;
    return category === 'all' ? base : base.filter((item) => item.category === category);
  }, [query, category]);

  const handleToggle = async (id: string, text: string) => {
    const wasFavorite = isFavorite('quote', id);
    await toggleFavorite('quote', id);
    notify(wasFavorite ? 'Retiré des favoris.' : 'Ajouté aux favoris.', {
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
        <div className="row-wrap" role="group" aria-label="Filtrer par catégorie">
          <button
            type="button"
            className={category === 'all' ? 'filter-chip is-active' : 'filter-chip'}
            onClick={() => setCategory('all')}
          >
            Toutes
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? 'filter-chip is-active' : 'filter-chip'}
              onClick={() => setCategory(item)}
            >
              {INSPIRATION_CATEGORY_LABELS[item]}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune citation trouvée"
          description={
            query.trim()
              ? 'Rien ne correspond à « ' + query.trim() + ' ». Essaie un autre mot, ou efface la recherche.'
              : 'Aucune citation dans cette catégorie pour le moment.'
          }
          action={{
            label: 'Effacer les filtres',
            onClick: () => {
              setQuery('');
              setCategory('all');
            },
          }}
        />
      ) : (
        <ul className="inspire-list">
          {items.map((item) => (
            <li key={item.id}>
              <Card compact className="inspire-item">
                <blockquote className="inspire-item__text">{item.text}</blockquote>
                <div className="row-between">
                  <span className="inspire-item__author">{item.author}</span>
                  <div className="row">
                    <Badge tone="lavender">
                      {INSPIRATION_CATEGORY_LABELS[item.category]}
                    </Badge>
                    <IconButton
                      label={
                        isFavorite('quote', item.id)
                          ? 'Retirer des favoris'
                          : 'Ajouter aux favoris'
                      }
                      accent="lavender"
                      active={isFavorite('quote', item.id)}
                      onClick={() => void handleToggle(item.id, item.text)}
                    >
                      <Heart size={16} />
                    </IconButton>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </ContentLibrary>
  );
}

import { useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { IconButton } from '@/components/buttons';
import { Input } from '@/components/inputs';
import { EmptyState } from '@/components/feedback';
import { useToast } from '@/components/feedback/Toast';
import { useFavorites } from '@/hooks/useProfile';
import { ContentLibrary } from './ContentLibrary';
import { AFFIRMATIONS, searchContent } from '@/content/library';
import { INSPIRATION_CATEGORY_LABELS, type InspirationCategory } from '@/types';

/**
 * Affirmations — section de l'espace Inspire.
 *
 * Source : la banque éditoriale (`@/content/library`). Les affirmations sont
 * écrites à la première personne et peuvent être marquées comme favorites.
 *
 * Le filtre par catégorie est dérivé du contenu réel : aucune catégorie vide
 * n'est affichée.
 */
export function Affirmations() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<InspirationCategory | 'all'>('all');
  const { notify } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const categories = useMemo(
    () => Array.from(new Set(AFFIRMATIONS.map((item) => item.category))),
    [],
  );

  const items = useMemo(() => {
    const base = query.trim() ? searchContent(query).affirmations : AFFIRMATIONS;
    return category === 'all' ? base : base.filter((item) => item.category === category);
  }, [query, category]);

  const handleToggle = async (id: string, text: string) => {
    const wasFavorite = isFavorite('affirmation', id);
    await toggleFavorite('affirmation', id);
    notify(wasFavorite ? 'Retiré des favoris.' : 'Ajouté aux favoris.', {
      tone: 'success',
      detail: text,
    });
  };

  return (
    <ContentLibrary tab="affirmations" label="Affirmations" count={items.length}>
      <div className="inspire-filters">
        <Input
          label="Rechercher"
          placeholder="Un mot…"
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
          title="Aucune affirmation trouvée"
          description={
            query.trim()
              ? 'Rien ne correspond à « ' + query.trim() + ' ». Essaie un autre mot, ou efface la recherche.'
              : 'Aucune affirmation dans cette catégorie pour le moment.'
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
              <Card compact accent="lavender" className="inspire-item">
                <p className="inspire-item__affirmation">{item.text}</p>
                <div className="row-between">
                  <Badge tone="lavender">
                    {INSPIRATION_CATEGORY_LABELS[item.category]}
                  </Badge>
                  <IconButton
                    label={
                      isFavorite('affirmation', item.id)
                        ? 'Retirer des favoris'
                        : 'Ajouter aux favoris'
                    }
                    accent="lavender"
                    active={isFavorite('affirmation', item.id)}
                    onClick={() => void handleToggle(item.id, item.text)}
                  >
                    <Heart size={16} />
                  </IconButton>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </ContentLibrary>
  );
}

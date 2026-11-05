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
import { AFFIRMATIONS, searchContent } from '@/content/library';
import { INSPIRATION_CATEGORY_LABELS } from '@/types';
import './Inspire.css';
import './CategoryGroups.css';

/**
 * Affirmations.
 *
 * Meme regroupement par categorie que les citations : les affirmations
 * couvrent cinq themes, et une liste unique de 24 elements ne laissait pas
 * voir lesquels.
 */
export function Affirmations() {
  const [query, setQuery] = useState('');
  const { notify } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const items = useMemo(() => {
    return query.trim() ? searchContent(query).affirmations : AFFIRMATIONS;
  }, [query]);

  const groups = useMemo(() => groupByCategory(items), [items]);

  const handleToggle = async (id: string, text: string) => {
    const wasFavorite = isFavorite('affirmation', id);
    await toggleFavorite('affirmation', id);
    notify(wasFavorite ? 'Retiree des favoris.' : 'Ajoutee aux favoris.', {
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
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune affirmation trouvee"
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
                <Badge tone="accent">{INSPIRATION_CATEGORY_LABELS[item.category]}</Badge>
                <IconButton
                  label={
                    isFavorite('affirmation', item.id)
                      ? 'Retirer des favoris'
                      : 'Ajouter aux favoris'
                  }
                  accent="teal"
                  active={isFavorite('affirmation', item.id)}
                  onClick={() => void handleToggle(item.id, item.text)}
                >
                  <Heart size={16} />
                </IconButton>
              </div>
            </Card>
          )}
        />
      )}
    </ContentLibrary>
  );
}

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
 * Bibliotheque de citations.
 *
 * Source : la banque editoriale (`@/content/library`). La recherche est locale,
 * donc elle fonctionne hors ligne. Les filtres de categorie sont derives du
 * contenu reellement present — jamais de categories vides inventees.
 *
 * PHASE 4.1 — COULEURS SUIVANT L'ACCENT
 * -------------------------------------
 * Le badge de categorie et le coeur utilisent `tone="accent"` / `accent=…`
 * et non plus une couleur ficee. En accent teal, ils sont turquoise comme le
 * reste de la page ; en accent lavande, ils restent lavande. C'est ce qui
 * corrige l'incoherence signalee : un badge lavande sous une interface teal.
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
        <div className="row-wrap" role="group" aria-label="Filtrer par categorie">
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
          title="Aucune citation trouvee"
          description={
            query.trim()
              ? 'Rien ne correspond a « ' + query.trim() + ' ». Essaie un autre mot, ou efface la recherche.'
              : 'Aucune citation dans cette categorie pour le moment.'
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
                    <Badge tone="accent">
                      {INSPIRATION_CATEGORY_LABELS[item.category]}
                    </Badge>
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
            </li>
          ))}
        </ul>
      )}
    </ContentLibrary>
  );
}

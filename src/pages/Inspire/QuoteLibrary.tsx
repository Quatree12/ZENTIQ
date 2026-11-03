import { useEffect, useState } from 'react';
import { Card } from '@/components/cards';
import { Input } from '@/components/inputs';
import { Badge } from '@/components/badges';
import { ContentLibrary } from './ContentLibrary';
import { DAILY_INSPIRATION } from '@/pages/Today/daily-inspiration.data';
import type { InspirationCategory } from '@/types';
import './Inspire.css';

/**
 * Bibliothèque de citations.
 *
 * La banque complète n'existe pas encore : cette section cherche dans le jeu de
 * départ livré avec l'application (phase « Contenu & curation »). La recherche
 * est locale, donc elle fonctionne hors ligne.
 *
 * Les filtres de catégorie sont dérivés du contenu réellement présent — jamais
 * de catégories vides inventées.
 */
export interface QuoteLibraryProps {
  favoritesOnly?: boolean;
}

export function QuoteLibrary({ favoritesOnly = false }: QuoteLibraryProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<InspirationCategory | 'all'>('all');
  const [reloadKey, setReloadKey] = useState(0);

  // Les catégories proviennent du contenu chargé, pas d'une liste fixe.
  const categories = Array.from(new Set(DAILY_INSPIRATION.map((item) => item.category)));

  useEffect(() => {
    if (favoritesOnly) setReloadKey((key) => key + 1);
  }, [favoritesOnly]);

  const needle = query.trim().toLowerCase();
  const items = DAILY_INSPIRATION.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!needle) return true;
    return item.text.toLowerCase().includes(needle) || item.author.toLowerCase().includes(needle);
  });

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
              {item}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <Card compact>
          <p className="body-base">
            Aucune citation ne correspond à « {query.trim()} ». Essaie un autre mot, ou efface la
            recherche.
          </p>
        </Card>
      ) : (
        <ul className="inspire-list" key={reloadKey}>
          {items.map((item, index) => (
            <li key={`${item.text}-${index}`}>
              <Card compact className="inspire-item">
                <blockquote className="inspire-item__text">{item.text}</blockquote>
                <div className="row-between">
                  <span className="inspire-item__author">{item.author}</span>
                  <Badge tone="lavender">{item.category}</Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </ContentLibrary>
  );
}

import { useMemo, useState } from 'react';
import { Heart, Music } from 'lucide-react';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { IconButton } from '@/components/buttons';
import { Input } from '@/components/inputs';
import { EmptyState } from '@/components/feedback';
import { useToast } from '@/components/feedback/Toast';
import { useFavorites } from '@/hooks/useProfile';
import { ContentLibrary } from './ContentLibrary';
import { MUSIC, searchContent, type MusicMoment } from '@/content/library';

const MOMENT_LABELS: Record<MusicMoment, string> = {
  matin: 'Matin',
  focus: 'Focus',
  effort: 'Effort',
  soir: 'Soir',
};

const MOMENT_ORDER: MusicMoment[] = ['matin', 'focus', 'effort', 'soir'];

/**
 * Inspirations musicales — le badge de moment d'ecoute suit l'accent actif,
 * comme celui des citations. Le coeur egalement.
 */
export function MusicInspiration() {
  const [query, setQuery] = useState('');
  const [moment, setMoment] = useState<MusicMoment | 'all'>('all');
  const { notify } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const moments = useMemo(
    () => MOMENT_ORDER.filter((item) => MUSIC.some((track) => track.moment === item)),
    [],
  );

  const items = useMemo(() => {
    const base = query.trim() ? searchContent(query).music : MUSIC;
    return moment === 'all' ? base : base.filter((item) => item.moment === moment);
  }, [query, moment]);

  const handleToggle = async (id: string, title: string) => {
    const wasFavorite = isFavorite('music', id);
    await toggleFavorite('music', id);
    notify(wasFavorite ? 'Retire des favoris.' : 'Ajoute aux favoris.', {
      tone: 'success',
      detail: title,
    });
  };

  return (
    <ContentLibrary tab="music" label="Musique" count={items.length}>
      <div className="inspire-filters">
        <Input
          label="Rechercher"
          placeholder="Un titre, un interprete…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
        />
        <div className="row-wrap" role="group" aria-label="Filtrer par moment">
          <button
            type="button"
            className={moment === 'all' ? 'filter-chip is-active' : 'filter-chip'}
            onClick={() => setMoment('all')}
          >
            Tous les moments
          </button>
          {moments.map((item) => (
            <button
              key={item}
              type="button"
              className={moment === item ? 'filter-chip is-active' : 'filter-chip'}
              onClick={() => setMoment(item)}
            >
              {MOMENT_LABELS[item]}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune reference trouvee"
          description={
            query.trim()
              ? 'Rien ne correspond a « ' + query.trim() + ' ». Essaie un autre titre, ou efface la recherche.'
              : 'Aucune reference pour ce moment de la journee.'
          }
          action={{
            label: 'Effacer les filtres',
            onClick: () => {
              setQuery('');
              setMoment('all');
            },
          }}
        />
      ) : (
        <ul className="inspire-list">
          {items.map((item) => (
            <li key={item.id}>
              <Card compact className="inspire-item">
                <div className="row-between">
                  <div className="music-item__head">
                    <span className="music-item__icon" aria-hidden="true">
                      <Music size={16} />
                    </span>
                    <div className="music-item__titles">
                      <h3 className="music-item__title">{item.title}</h3>
                      <p className="music-item__artist">{item.artist}</p>
                    </div>
                  </div>
                  <IconButton
                    label={
                      isFavorite('music', item.id)
                        ? 'Retirer des favoris'
                        : 'Ajouter aux favoris'
                    }
                    accent="teal"
                    active={isFavorite('music', item.id)}
                    onClick={() => void handleToggle(item.id, item.title)}
                  >
                    <Heart size={16} />
                  </IconButton>
                </div>

                <p className="body-sm music-item__note">{item.note}</p>

                <div className="row-wrap">
                  <Badge tone="accent">{MOMENT_LABELS[item.moment]}</Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </ContentLibrary>
  );
}

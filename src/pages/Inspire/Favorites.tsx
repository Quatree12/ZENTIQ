import { useMemo } from 'react';
import { Heart, Music } from 'lucide-react';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { IconButton } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import { useToast } from '@/components/feedback/Toast';
import { useFavorites } from '@/hooks/useProfile';
import { AFFIRMATIONS, MUSIC, QUOTES } from '@/content/library';
import { INSPIRATION_CATEGORY_LABELS } from '@/types';
import './Inspire.css';

const TYPE_LABELS = {
  quote: 'Citation',
  affirmation: 'Affirmation',
  music: 'Musique',
} as const;

type FavoriteKind = keyof typeof TYPE_LABELS;

interface ResolvedFavorite {
  id: string;
  kind: FavoriteKind;
  title: string;
  subtitle: string;
  category?: string;
}

/** Favoris — les badges suivent l'accent actif. */
export function Favorites() {
  const { favoriteKeys, toggleFavorite, refresh } = useFavorites();
  const { notify } = useToast();

  const items = useMemo<ResolvedFavorite[]>(() => {
    const byKey = new Map<string, ResolvedFavorite>();

    for (const quote of QUOTES) {
      byKey.set('quote:' + quote.id, {
        id: quote.id,
        kind: 'quote',
        title: quote.text,
        subtitle: quote.author,
        category: INSPIRATION_CATEGORY_LABELS[quote.category],
      });
    }
    for (const item of AFFIRMATIONS) {
      byKey.set('affirmation:' + item.id, {
        id: item.id,
        kind: 'affirmation',
        title: item.text,
        subtitle: 'Affirmation',
        category: INSPIRATION_CATEGORY_LABELS[item.category],
      });
    }
    for (const track of MUSIC) {
      byKey.set('music:' + track.id, {
        id: track.id,
        kind: 'music',
        title: track.title,
        subtitle: track.artist,
      });
    }

    return favoriteKeys
      .map((key) => byKey.get(key))
      .filter((item): item is ResolvedFavorite => item !== undefined);
  }, [favoriteKeys]);

  const handleRemove = async (kind: FavoriteKind, id: string, title: string) => {
    await toggleFavorite(kind, id);
    await refresh();
    notify('Retire des favoris.', { tone: 'info', detail: title });
  };

  return (
    <section className="content-library" aria-labelledby="library-favorites">
      <header className="content-library__header">
        <p className="overline">Favoris</p>
        <h2 className="heading-sm" id="library-favorites">
          {items.length === 0
            ? 'Aucun element'
            : items.length + ' element' + (items.length > 1 ? 's' : '')}
        </h2>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun favori pour l'instant"
          description="Touche le coeur sur une citation, une affirmation ou un titre pour le retrouver ici."
        />
      ) : (
        <ul className="inspire-list">
          {items.map((item) => (
            <li key={item.kind + ':' + item.id}>
              <Card compact className="inspire-item">
                <div className="row-between">
                  <div className="music-item__head">
                    {item.kind === 'music' && (
                      <span className="music-item__icon" aria-hidden="true">
                        <Music size={16} />
                      </span>
                    )}
                    <div className="music-item__titles">
                      <p className="inspire-item__text">{item.title}</p>
                      <p className="body-sm">{item.subtitle}</p>
                    </div>
                  </div>
                  <IconButton
                    label="Retirer des favoris"
                    accent="teal"
                    active
                    onClick={() => void handleRemove(item.kind, item.id, item.title)}
                  >
                    <Heart size={16} />
                  </IconButton>
                </div>
                <div className="row-wrap">
                  <Badge tone="accent">{TYPE_LABELS[item.kind]}</Badge>
                  {item.category && <Badge>{item.category}</Badge>}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

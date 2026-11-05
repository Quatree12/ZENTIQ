import { useMemo } from 'react';
import { Heart, Music } from 'lucide-react';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { IconButton } from '@/components/buttons';
import { EmptyState } from '@/components/feedback';
import { useToast } from '@/components/feedback/Toast';
import { useFavorites } from '@/hooks/useProfile';
import { CategoryGroups, groupByCategory, type CategoryGroup } from './CategoryGroups';
import { AFFIRMATIONS, MUSIC, QUOTES } from '@/content/library';
import { INSPIRATION_CATEGORY_LABELS, type InspirationCategory } from '@/types';
import './Inspire.css';
import './CategoryGroups.css';

const TYPE_LABELS = {
  quote: 'Citation',
  affirmation: 'Affirmation',
  music: 'Musique',
} as const;

type FavoriteKind = keyof typeof TYPE_LABELS;

interface ResolvedFavorite {
  /** Cle composite : le type fait partie de l'identite d'un favori. */
  key: string;
  id: string;
  kind: FavoriteKind;
  title: string;
  subtitle: string;
  category: InspirationCategory;
  categoryLabel: string;
}

/**
 * Favoris — la bibliotheque personnelle.
 *
 * REGROUPEMENT PAR CATEGORIE
 * --------------------------
 * Les favoris s'affichaient en une seule liste melangeant citations,
 * affirmations et musiques. Avec quelques dizaines d'elements enregistres,
 * retrouver « cette citation sur le calme » devenait un defilement aveugle.
 *
 * Ils sont maintenant ranges par categorie, comme les citations et les
 * affirmations. Le type (citation / affirmation / musique) reste visible sur
 * chaque element : la categorie dit le THEME, le badge dit la NATURE.
 *
 * Une musique n'a pas toujours de categorie dans la banque : elle est alors
 * rangee sous « Sans theme », plutot qu'exclue de la liste — un favori ne doit
 * jamais disparaitre de sa propre bibliotheque.
 */
export function Favorites() {
  const { favoriteKeys, toggleFavorite, refresh } = useFavorites();
  const { notify } = useToast();

  const items = useMemo<ResolvedFavorite[]>(() => {
    const byKey = new Map<string, ResolvedFavorite>();

    for (const quote of QUOTES) {
      byKey.set('quote:' + quote.id, {
        key: 'quote:' + quote.id,
        id: quote.id,
        kind: 'quote',
        title: quote.text,
        subtitle: quote.author,
        category: quote.category,
        categoryLabel: INSPIRATION_CATEGORY_LABELS[quote.category],
      });
    }
    for (const item of AFFIRMATIONS) {
      byKey.set('affirmation:' + item.id, {
        key: 'affirmation:' + item.id,
        id: item.id,
        kind: 'affirmation',
        title: item.text,
        subtitle: 'Affirmation',
        category: item.category,
        categoryLabel: INSPIRATION_CATEGORY_LABELS[item.category],
      });
    }
    for (const track of MUSIC) {
      byKey.set('music:' + track.id, {
        key: 'music:' + track.id,
        id: track.id,
        kind: 'music',
        title: track.title,
        subtitle: track.artist,
        category: track.category,
        categoryLabel: INSPIRATION_CATEGORY_LABELS[track.category],
      });
    }

    return favoriteKeys
      .map((key) => byKey.get(key))
      .filter((item): item is ResolvedFavorite => item !== undefined);
  }, [favoriteKeys]);

  const groups: CategoryGroup<ResolvedFavorite>[] = useMemo(
    () => groupByCategory(items),
    [items],
  );

  const handleRemove = async (kind: FavoriteKind, id: string, title: string) => {
    await toggleFavorite(kind, id);
    await refresh();
    notify('Retire des favoris.', { tone: 'info', detail: title });
  };

  return (
    <section className="content-library" aria-labelledby="library-favorites">
      <header className="content-library__header">
        <div>
          <p className="overline">Favoris</p>
          <h2 className="heading-sm" id="library-favorites">
            {items.length === 0
              ? 'Aucun element'
              : items.length +
                ' element' +
                (items.length > 1 ? 's' : '') +
                ' dans ' +
                groups.length +
                ' theme' +
                (groups.length > 1 ? 's' : '')}
          </h2>
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun favori pour l'instant"
          description="Touche le coeur sur une citation, une affirmation ou un titre pour le retrouver ici."
        />
      ) : (
        <CategoryGroups
          groups={groups}
          itemKey={(item) => item.key}
          renderItem={(item) => (
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
                <Badge>{item.categoryLabel}</Badge>
              </div>
            </Card>
          )}
        />
      )}
    </section>
  );
}

import { useMemo, useState } from 'react';
import { BookOpen, Pin, Plus, Search, X } from 'lucide-react';
import { Button, IconButton } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback';
import { ConfirmDialog, Modal } from '@/components/modals';
import { Input, Select, Textarea } from '@/components/inputs';
import { useToast } from '@/components/feedback/Toast';
import { useJournal } from '@/hooks/useJournal';
import { appConfig } from '@/app/app-config';
import { MOOD_LABELS, MOOD_LEVELS, type JournalEntry, type MoodLevel } from '@/types';
import { formatRelativeDateKey } from '@/utils/dates';
import './JournalSearch.css';

/**
 * Journal personnel.
 *
 * RECHERCHE ET FILTRES
 * --------------------
 * La recherche est LOCALE et faite en memoire : les entrees sont deja chargees,
 * et un aller-retour IndexedDB a chaque frappe serait plus lent pour rien. Elle
 * porte sur le titre ET le contenu, sans accent ni casse — chercher « energie »
 * doit trouver « Énergie ».
 *
 * Le filtre par humeur et le filtre « epinglees » se combinent avec la
 * recherche : un filtre qui ne s'appliquerait qu'a moitie donnerait des
 * resultats incomprehensibles.

 * L'etat vide a DEUX formes distinctes, et c'est volontaire :
 *   - journal vide       -> on invite a ecrire une premiere entree
 *   - filtres sans resultat -> on propose de retirer les filtres
 * Les confondre laisserait croire que le journal est vide alors qu'il est
 * seulement filtre.
 */

/** Normalise une chaine pour la recherche : minuscules, sans accents. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Vrai si l'entree correspond a la recherche libre. */
function matchesQuery(entry: JournalEntry, needle: string): boolean {
  if (!needle) return true;
  const haystack = normalize(entry.title + ' ' + entry.content);
  return haystack.includes(needle);
}

type MoodFilter = 'all' | 'none' | MoodLevel;
type PinFilter = 'all' | 'pinned';

export function Journal() {
  const { entries, loading, saving, error, createEntry, removeEntry, togglePin, refresh } =
    useJournal();
  const { notify } = useToast();

  const [composeOpen, setComposeOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodLevel | ''>('');

  // Filtres d'affichage. Ils ne touchent jamais aux donnees.
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('all');
  const [pinFilter, setPinFilter] = useState<PinFilter>('all');

  const needle = normalize(query.trim());
  const filtersActive = needle.length > 0 || moodFilter !== 'all' || pinFilter !== 'all';

  const visible = useMemo(() => {
    return entries.filter((entry) => {
      if (!matchesQuery(entry, needle)) return false;
      if (pinFilter === 'pinned' && !entry.pinned) return false;

      if (moodFilter === 'none') return entry.mood === undefined;
      if (moodFilter !== 'all') return entry.mood === moodFilter;
      return true;
    });
  }, [entries, needle, moodFilter, pinFilter]);

  const resetFilters = () => {
    setQuery('');
    setMoodFilter('all');
    setPinFilter('all');
  };

  const handleCreate = async () => {
    const ok = await createEntry({
      title,
      content,
      mood: mood === '' ? undefined : mood,
    });

    if (ok) {
      notify('Entree enregistree.', { tone: 'success' });
      setComposeOpen(false);
      setTitle('');
      setContent('');
      setMood('');
    } else {
      notify("L'entree n'a pas pu etre enregistree.", { tone: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await removeEntry(pendingDelete);
    setPendingDelete(null);
    notify('Entree supprimee.', { tone: 'info' });
  };

  if (loading && entries.length === 0) return <LoadingState label="Lecture de ton journal…" />;
  if (error && entries.length === 0)
    return <ErrorState message={error} onRetry={() => void refresh()} />;

  return (
    <section className="journey-section" aria-labelledby="journal-heading">
      <header className="row-between">
        <div>
          <p className="overline">Journal</p>
          <h2 className="heading-sm" id="journal-heading">
            {entries.length === 0
              ? 'Aucune entree'
              : `${entries.length} entree${entries.length > 1 ? 's' : ''}`}
          </h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Plus size={16} />}
          onClick={() => setComposeOpen(true)}
        >
          Ecrire
        </Button>
      </header>

      {/* La barre de recherche n'apparait que s'il y a de quoi chercher. */}
      {entries.length > 0 && (
        <div className="journal-filters">
          <div className="journal-search">
            <Search size={16} aria-hidden="true" className="journal-search__icon" />
            <input
              type="search"
              className="journal-search__input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Chercher dans tes entrees…"
              aria-label="Chercher dans le journal"
            />
            {query.length > 0 && (
              <IconButton label="Effacer la recherche" onClick={() => setQuery('')}>
                <X size={14} />
              </IconButton>
            )}
          </div>

          <div className="row-wrap">
            <button
              type="button"
              className={pinFilter === 'pinned' ? 'journal-chip is-active' : 'journal-chip'}
              aria-pressed={pinFilter === 'pinned'}
              onClick={() => setPinFilter(pinFilter === 'pinned' ? 'all' : 'pinned')}
            >
              <Pin size={14} aria-hidden="true" /> Epinglees
            </button>
            {MOOD_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={moodFilter === level ? 'journal-chip is-active' : 'journal-chip'}
                aria-pressed={moodFilter === level}
                onClick={() => setMoodFilter(moodFilter === level ? 'all' : level)}
              >
                {MOOD_LABELS[level]}
              </button>
            ))}
          </div>

          {filtersActive && (
            <div className="row-between">
              <p className="body-sm">
                {visible.length} resultat{visible.length > 1 ? 's' : ''} sur {entries.length}.
              </p>
              <Button variant="tertiary" size="sm" onClick={resetFilters}>
                Tout afficher
              </Button>
            </div>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Ton journal est vide"
          description="Quelques lignes suffisent. Rien n'est juge ici, et personne d'autre que toi ne le lira."
          action={{ label: 'Ecrire une entree', onClick: () => setComposeOpen(true) }}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucune entree ne correspond"
          description="Essaie un autre mot, ou retire les filtres pour retrouver toutes tes entrees."
          action={{ label: 'Tout afficher', onClick: resetFilters }}
        />
      ) : (
        <ul className="journal-list">
          {visible.map((entry) => (
            <li key={entry.id}>
              <Card compact className="journal-item">
                <div className="row-between">
                  <div className="journal-item__head">
                    <span className="journal-item__date">
                      {formatRelativeDateKey(entry.date)}
                    </span>
                    {entry.title && <h3 className="journal-item__title">{entry.title}</h3>}
                  </div>
                  <div className="row">
                    {entry.mood && <Badge tone="lavender">{MOOD_LABELS[entry.mood]}</Badge>}
                    <IconButton
                      label={entry.pinned ? "Retirer l'epingle" : 'Epingler'}
                      accent="teal"
                      active={entry.pinned}
                      onClick={() => void togglePin(entry.id)}
                    >
                      <Pin size={16} />
                    </IconButton>
                  </div>
                </div>

                <p className="journal-item__content prose">{entry.content}</p>

                <div className="row-wrap">
                  <Button variant="danger" size="sm" onClick={() => setPendingDelete(entry.id)}>
                    Supprimer
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Nouvelle entree"
        description="Ce que tu ecris reste sur cet appareil."
        size="lg"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setComposeOpen(false)}>
              Fermer
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreate()}
              loading={saving}
              disabled={content.trim().length === 0}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <Input
          label="Titre (facultatif)"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Un titre court pour retrouver cette journee"
        />
        <Textarea
          label="Ton texte"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Ce qui s'est passe, ce que tu remarques, ce que tu ressens…"
          rows={8}
          counterMax={appConfig.limits.journalMaxLength}
          maxLength={appConfig.limits.journalMaxLength}
          required
        />
        <Select
          label="Humeur associee (facultatif)"
          value={String(mood)}
          onChange={(event) =>
            setMood(event.target.value === '' ? '' : (Number(event.target.value) as MoodLevel))
          }
          options={[
            { value: '', label: 'Non renseignee' },
            ...MOOD_LEVELS.map((level) => ({
              value: String(level),
              label: MOOD_LABELS[level],
            })),
          ]}
        />
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer cette entree ?"
        message="Cette action est definitive. Si tu souhaites plutot la garder sous la main, epingle-la au lieu de la supprimer."
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

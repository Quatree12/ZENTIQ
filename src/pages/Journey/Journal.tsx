import { useState } from 'react';
import { BookOpen, Pin, Plus } from 'lucide-react';
import { Button } from '@/components/buttons';
import { IconButton } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback';
import { ConfirmDialog, Modal } from '@/components/modals';
import { Input, Select, Textarea } from '@/components/inputs';
import { useToast } from '@/components/feedback/Toast';
import { useJournal } from '@/hooks/useJournal';
import { appConfig } from '@/app/app-config';
import { MOOD_LABELS, MOOD_LEVELS, type MoodLevel } from '@/types';
import { formatRelativeDateKey } from '@/utils/dates';

/**
 * Journal personnel.
 *
 * Écriture libre, épinglage et suppression. Les entrées restent strictement
 * locales : rien n'est publié ni partagé, et l'export ne les inclut que sur
 * demande explicite depuis l'espace ME.
 */
export function Journal() {
  const { entries, loading, saving, error, createEntry, removeEntry, togglePin, refresh } = useJournal();
  const { notify } = useToast();

  const [composeOpen, setComposeOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodLevel | ''>('');

  const handleCreate = async () => {
    const ok = await createEntry({
      title,
      content,
      mood: mood === '' ? undefined : mood,
    });

    if (ok) {
      notify('Entrée enregistrée.', { tone: 'success' });
      setComposeOpen(false);
      setTitle('');
      setContent('');
      setMood('');
    } else {
      notify("L'entrée n'a pas pu être enregistrée.", { tone: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await removeEntry(pendingDelete);
    setPendingDelete(null);
    notify('Entrée supprimée.', { tone: 'info' });
  };

  if (loading && entries.length === 0) return <LoadingState label="Lecture de ton journal…" />;
  if (error && entries.length === 0) return <ErrorState message={error} onRetry={() => void refresh()} />;

  return (
    <section className="journey-section" aria-labelledby="journal-heading">
      <header className="row-between">
        <div>
          <p className="overline">Journal</p>
          <h2 className="heading-sm" id="journal-heading">
            {entries.length === 0 ? 'Aucune entrée' : `${entries.length} entrée${entries.length > 1 ? 's' : ''}`}
          </h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Plus size={16} />}
          onClick={() => setComposeOpen(true)}
        >
          Écrire
        </Button>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Ton journal est vide"
          description="Quelques lignes suffisent. Rien n'est jugé ici, et personne d'autre que toi ne le lira."
          action={{ label: 'Écrire une entrée', onClick: () => setComposeOpen(true) }}
        />
      ) : (
        <ul className="journal-list">
          {entries.map((entry) => (
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
                      label={entry.pinned ? 'Retirer l\'épingle' : 'Épingler'}
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
        title="Nouvelle entrée"
        description="Ce que tu écris reste sur cet appareil."
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
          placeholder="Un titre court pour retrouver cette journée"
        />
        <Textarea
          label="Ton texte"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Ce qui s'est passé, ce que tu remarques, ce que tu ressens…"
          rows={8}
          counterMax={appConfig.limits.journalMaxLength}
          maxLength={appConfig.limits.journalMaxLength}
          required
        />
        <Select
          label="Humeur associée (facultatif)"
          value={String(mood)}
          onChange={(event) =>
            setMood(event.target.value === '' ? '' : (Number(event.target.value) as MoodLevel))
          }
          options={[
            { value: '', label: 'Non renseignée' },
            ...MOOD_LEVELS.map((level) => ({
              value: String(level),
              label: MOOD_LABELS[level],
            })),
          ]}
        />
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer cette entrée ?"
        message="Cette action est définitive. Si tu souhaites plutôt la garder sous la main, épingle-la au lieu de la supprimer."
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

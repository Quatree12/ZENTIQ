import { useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback';
import { ConfirmDialog, Modal } from '@/components/modals';
import { Input } from '@/components/inputs';
import { useToast } from '@/components/feedback/Toast';
import { useHabits } from '@/hooks/useHabits';
import { appConfig } from '@/app/app-config';
import { pluralize } from '@/utils/formatters';

/**
 * Habitudes.
 *
 * La coche du jour est l'action principale. Les libellés sont volontairement
 * neutres : une série interrompue se décrit comme telle, elle n'est jamais
 * présentée comme un échec.
 */
export function Habits() {
  const {
    habits,
    loading,
    error,
    togglingIds,
    toggleHabit,
    createHabit,
    archiveHabit,
    removeHabit,
    refresh,
  } = useHabits();
  const { notify } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [intention, setIntention] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    const ok = await createHabit({ name, intention });
    setSaving(false);

    if (ok) {
      notify('Habitude ajoutée.', { tone: 'success', detail: name });
      setCreateOpen(false);
      setName('');
      setIntention('');
    } else {
      notify("L'habitude n'a pas pu être créée.", { tone: 'error' });
    }
  };

  const handleToggle = async (habitId: string, habitName: string, wasDone: boolean) => {
    await toggleHabit(habitId);
    notify(wasDone ? `${habitName} : coche retirée.` : `${habitName} : c'est fait.`, {
      tone: 'success',
    });
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await removeHabit(pendingDelete);
    setPendingDelete(null);
    notify('Habitude supprimée, ainsi que son historique.', { tone: 'info' });
  };

  if (loading && habits.length === 0) return <LoadingState label="Lecture de tes habitudes…" />;
  if (error && habits.length === 0) return <ErrorState message={error} onRetry={() => void refresh()} />;

  return (
    <section className="grow-section" aria-labelledby="habits-heading">
      <header className="row-between">
        <div>
          <p className="overline">Habitudes</p>
          <h2 className="heading-sm" id="habits-heading">
            {habits.length === 0 ? 'Aucune habitude' : pluralize(habits.length, 'habitude')}
          </h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          Ajouter
        </Button>
      </header>

      {habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Une habitude à la fois"
          description="Choisis quelque chose de si petit que tu pourrais le faire même un jour difficile. C'est ce qui tient dans le temps."
          action={{ label: 'Créer une habitude', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <ul className="habit-list">
          {habits.map((habit) => {
            const toggling = togglingIds.includes(habit.id);
            return (
              <li key={habit.id}>
                <Card compact className="habit-item">
                  <div className="habit-item__main">
                    <button
                      type="button"
                      className={habit.doneToday ? 'habit-check is-done' : 'habit-check'}
                      onClick={() => void handleToggle(habit.id, habit.name, habit.doneToday)}
                      disabled={toggling}
                      aria-pressed={habit.doneToday}
                      aria-label={`${habit.doneToday ? 'Retirer la coche de' : 'Cocher'} ${habit.name} pour aujourd'hui`}
                    >
                      <span className="habit-check__box" aria-hidden="true" />
                    </button>

                    <div className="habit-item__text">
                      <h3 className="habit-item__name">{habit.name}</h3>
                      {habit.intention && <p className="body-sm">« {habit.intention} »</p>}
                      <div className="row-wrap">
                        <Badge tone={habit.doneToday ? 'success' : 'neutral'}>
                          {habit.doneToday ? "Fait aujourd'hui" : 'À faire'}
                        </Badge>
                        <Badge>{pluralize(habit.completedThisWeek, 'fois')} cette semaine</Badge>
                        {habit.streak > 1 && <Badge tone="teal">{habit.streak} de suite</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="row-wrap">
                    <Button variant="tertiary" size="sm" onClick={() => void archiveHabit(habit.id)}>
                      Mettre de côté
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setPendingDelete(habit.id)}>
                      Supprimer
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouvelle habitude"
        description="Petit et régulier vaut mieux que grand et rare."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreate()}
              loading={saving}
              disabled={name.trim().length === 0}
            >
              Créer
            </Button>
          </>
        }
      >
        <Input
          label="Nom de l'habitude"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex. Dix minutes de marche"
          maxLength={appConfig.limits.habitNameMaxLength}
          required
        />
        <Input
          label="Intention (facultatif)"
          value={intention}
          onChange={(event) => setIntention(event.target.value)}
          placeholder="Pour quoi tu fais cette habitude…"
        />
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer cette habitude ?"
        message="Son historique de réalisations sera également supprimé. Pour la mettre simplement en pause, utilise « Mettre de côté »."
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

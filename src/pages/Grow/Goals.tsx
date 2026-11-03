import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { ProgressBar } from '@/components/progress';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback';
import { ConfirmDialog, Modal } from '@/components/modals';
import { Input, Select, Textarea } from '@/components/inputs';
import { useToast } from '@/components/feedback/Toast';
import { useGoals } from '@/hooks/useGoals';
import { appConfig } from '@/app/app-config';
import { GOAL_HORIZON_LABELS, type GoalHorizon } from '@/types';
import { formatDateKey } from '@/utils/dates';

/**
 * Objectifs.
 *
 * Création, modification d'avancement, marquage comme atteint et suppression.
 * Chaque objectif porte une « prochaine étape » : c'est ce qui le rend
 * actionnable un jour sans élan.
 *
 * Aucune comparaison entre personnes : la progression est celle de
 * l'utilisateur, et rien d'autre.
 */
export function Goals() {
  const { goals, loading, error, createGoal, completeGoal, removeGoal, setProgress, refresh } =
    useGoals();
  const { notify } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [motivation, setMotivation] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [horizon, setHorizon] = useState<GoalHorizon>('medium');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTitle('');
    setMotivation('');
    setNextStep('');
    setHorizon('medium');
    setTargetDate('');
  };

  const handleCreate = async () => {
    setSaving(true);
    const goal = await createGoal({
      title,
      motivation,
      nextStep,
      horizon,
      targetDate: targetDate || undefined,
    });
    setSaving(false);

    if (goal) {
      notify('Objectif ajouté.', { tone: 'success', detail: goal.title });
      setCreateOpen(false);
      resetForm();
    } else {
      notify("L'objectif n'a pas pu être créé.", { tone: 'error' });
    }
  };

  const handleComplete = async (id: string) => {
    await completeGoal(id);
    notify('Objectif marqué comme atteint.', { tone: 'success' });
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await removeGoal(pendingDelete);
    setPendingDelete(null);
    notify('Objectif supprimé.', { tone: 'info' });
  };

  if (loading && goals.length === 0) return <LoadingState label="Lecture de tes objectifs…" />;
  if (error && goals.length === 0) {
    return <ErrorState message={error} onRetry={() => void refresh()} />;
  }

  return (
    <section className="grow-section" aria-labelledby="goals-heading">
      <header className="row-between">
        <div>
          <p className="overline">Objectifs</p>
          <h2 className="heading-sm" id="goals-heading">
            {goals.length === 0 ? 'Aucun objectif' : `${goals.length} en cours`}
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

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Commence par un seul objectif"
          description="Un objectif clair, même petit, donne une direction. Tu pourras en ajouter d'autres quand celui-ci aura pris."
          action={{ label: 'Créer un objectif', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <ul className="goal-list">
          {goals.map((goal) => (
            <li key={goal.id}>
              <Card compact className="goal-item">
                <div className="row-between">
                  <h3 className="goal-item__title">{goal.title}</h3>
                  <div className="row-wrap">
                    {goal.isPriority && <Badge tone="teal">Priorité</Badge>}
                    <Badge>{GOAL_HORIZON_LABELS[goal.horizon]}</Badge>
                  </div>
                </div>

                {goal.motivation && <p className="body-sm">« {goal.motivation} »</p>}

                {goal.nextStep && (
                  <p className="goal-item__next">
                    <span className="overline">Prochaine étape</span>
                    {goal.nextStep}
                  </p>
                )}

                {goal.targetDate && (
                  <p className="body-sm">
                    Objectif visé pour le {formatDateKey(goal.targetDate, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}

                <div className="goal-item__progress">
                  <ProgressBar value={goal.progress} label={`Avancement de ${goal.title}`} />
                  <span className="data-value">{goal.progress}%</span>
                </div>

                <div className="row-wrap">
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => void setProgress(goal.id, Math.min(100, goal.progress + 10))}
                    disabled={goal.progress >= 100}
                  >
                    +10 %
                  </Button>
                  <Button variant="tertiary" size="sm" onClick={() => void handleComplete(goal.id)}>
                    Marquer atteint
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setPendingDelete(goal.id)}>
                    Supprimer
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouvel objectif"
        description="Formule-le pour toi, pas pour impressionner. Le détail viendra ensuite."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreate()}
              loading={saving}
              disabled={title.trim().length === 0}
            >
              Créer
            </Button>
          </>
        }
      >
        <Input
          label="Ton objectif"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex. Reprendre la course deux fois par semaine"
          maxLength={appConfig.limits.goalTitleMaxLength}
          required
        />
        <Textarea
          label="Pourquoi c'est important"
          value={motivation}
          onChange={(event) => setMotivation(event.target.value)}
          placeholder="Ce qui te rattache à cet objectif les jours creux…"
          rows={3}
        />
        <Input
          label="Prochaine étape concrète"
          value={nextStep}
          onChange={(event) => setNextStep(event.target.value)}
          placeholder="Ex. Sortir courir 20 minutes jeudi"
        />
        <Select
          label="Horizon"
          value={horizon}
          onChange={(event) => setHorizon(event.target.value as GoalHorizon)}
          options={[
            { value: 'short', label: 'Court terme' },
            { value: 'medium', label: 'Moyen terme' },
            { value: 'long', label: 'Long terme' },
          ]}
        />
        <Input
          label="Date visée (facultatif)"
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
        />
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer cet objectif ?"
        message="Cette action est définitive et les données associées ne pourront pas être récupérées."
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

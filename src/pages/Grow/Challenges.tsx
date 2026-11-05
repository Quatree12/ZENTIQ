import { useEffect, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback';
import { ConfirmDialog, Modal } from '@/components/modals';
import { useToast } from '@/components/feedback/Toast';
import { useChallenges } from '@/hooks/useChallenges';
import { ChallengeCard } from './ChallengeCard';
import { CompletedChallengeCard } from './CompletedChallengeCard';
import { ChallengeForm } from './ChallengeForm';
import { CHALLENGE_STATUS_LABELS } from '@/types';
import { formatDateKey } from '@/utils/dates';

/**
 * CHALLENGES — section de l'espace GROW.
 *
 * UN SEUL FICHIER DE STYLE : `Challenges.css`.
 *
 * Les regles des jalons et des rythmes y ont ete rapatriees. Elles vivaient
 * dans un `ChallengeMilestones.css` separe, ajoute au depot APRES la derniere
 * publication reussie. Le service worker servait alors un manifeste de
 * prechargement qui ne connaissait pas ce fichier : son import echouait, et
 * avec lui le chargement du graphe de modules — l'application entiere tombait
 * sur « Importing a module script failed ». .
 *
 * Lecon retenue : un nouveau fichier de style doit voyager avec le fichier qui
 * l'importe dans le MEME commit que la mise en cache, ou mieux, rester dans un
 * fichier deja connu du service worker. C'est ce second choix qui est applique.
 */
export function Challenges() {
  const {
    challenges,
    summary,
    loading,
    error,
    busyIds,
    createChallenge,
    completeDay,
    uncompleteDay,
    postpone,
    setAside,
    resume,
    removeChallenge,
    refresh,
  } = useChallenges();
  const { notify } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const active = challenges.filter((item) => item.status === 'active');
  const upcoming = challenges.filter((item) => item.status === 'upcoming');
  const completed = challenges.filter((item) => item.status === 'completed');
  const setAsideList = challenges.filter((item) => item.status === 'abandoned');

  const handleCreate = async (input: Parameters<typeof createChallenge>[0]) => {
    const created = await createChallenge(input);
    if (created) setCreateOpen(false);
    return created !== null;
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await removeChallenge(pendingDelete);
    setPendingDelete(null);
    notify('Challenge supprime.', { tone: 'info' });
  };

  if (loading && challenges.length === 0) {
    return <LoadingState label="Lecture de tes challenges…" />;
  }

  if (error && challenges.length === 0) {
    return <ErrorState message={error} onRetry={() => void refresh()} />;
  }

  return (
    <section className="grow-section" aria-labelledby="challenges-heading">
      <header className="row-between">
        <div>
          <p className="overline">Challenges</p>
          <h2 className="heading-sm" id="challenges-heading">
            {summary.total === 0
              ? 'Aucun challenge'
              : summary.active > 0
                ? summary.active + ' en cours'
                : summary.total + (summary.total > 1 ? ' challenges' : ' challenge')}
          </h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          Creer
        </Button>
      </header>

      {summary.total === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Aucun challenge pour l'instant"
          description="Un challenge te donne un cadre de quelques jours : 3, 7, 14, 21 ou 30. Tu peux le terminer ou le mettre de cote, jamais le « rater »."
          action={{ label: 'Creer un challenge', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <>
          <Card compact className="challenge-summary">
            <div className="row-wrap">
              <Badge tone="teal">{summary.active} en cours</Badge>
              {summary.upcoming > 0 && <Badge>{summary.upcoming} a venir</Badge>}
              {summary.completed > 0 && <Badge tone="success">{summary.completed} termine</Badge>}
              {summary.setAside > 0 && <Badge>{summary.setAside} mis de cote</Badge>}
              {summary.averageProgress !== null && (
                <Badge tone="lavender">Progression moyenne {summary.averageProgress} %</Badge>
              )}
            </div>
          </Card>

          {active.length > 0 && (
            <ul className="challenge-list">
              {active.map((challenge) => (
                <li key={challenge.id}>
                  <ChallengeCard
                    challenge={challenge}
                    busy={busyIds.includes(challenge.id)}
                    onCompleteDay={(dayNumber) => void completeDay(challenge.id, dayNumber)}
                    onUncompleteDay={(dayNumber) => void uncompleteDay(challenge.id, dayNumber)}
                    onPostpone={(days) => void postpone(challenge.id, days)}
                    onSetAside={() => void setAside(challenge.id)}
                    onDelete={() => setPendingDelete(challenge.id)}
                  />
                </li>
              ))}
            </ul>
          )}

          {upcoming.length > 0 && (
            <div className="challenge-group">
              <p className="overline">A venir</p>
              <ul className="challenge-list">
                {upcoming.map((challenge) => (
                  <li key={challenge.id}>
                    <Card compact className="challenge-card">
                      <div className="row-between">
                        <h3 className="challenge-card__title">{challenge.title}</h3>
                        <Badge>{challenge.durationDays} jours</Badge>
                      </div>
                      <p className="body-sm">
                        Commence le{' '}
                        {formatDateKey(challenge.startDate, { day: 'numeric', month: 'long' })}.
                      </p>
                      <div className="row-wrap">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setPendingDelete(challenge.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {completed.length > 0 && (
            <div className="challenge-group">
              <p className="overline">Termines</p>
              <ul className="challenge-list">
                {completed.map((challenge) => (
                  <li key={challenge.id}>
                    <CompletedChallengeCard
                      challenge={challenge}
                      onDelete={() => setPendingDelete(challenge.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {setAsideList.length > 0 && (
            <div className="challenge-group">
              <p className="overline">Mis de cote</p>
              <ul className="challenge-list">
                {setAsideList.map((challenge) => (
                  <li key={challenge.id}>
                    <Card compact className="challenge-card">
                      <div className="row-between">
                        <h3 className="challenge-card__title">{challenge.title}</h3>
                        <Badge>{CHALLENGE_STATUS_LABELS[challenge.status]}</Badge>
                      </div>
                      <p className="body-sm">
                        {challenge.daysCompleted} journee
                        {challenge.daysCompleted > 1 ? 's' : ''} validee
                        {challenge.daysCompleted > 1 ? 's' : ''} sur {challenge.durationDays}.
                      </p>
                      <div className="row-wrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void resume(challenge.id)}
                        >
                          Reprendre
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setPendingDelete(challenge.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouveau challenge"
        description="Un cadre court, quelques jours. Tu peux le mettre de cote a tout moment, sans rien perdre."
        size="lg"
      >
        <ChallengeForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer ce challenge ?"
        message="Ses journees validees seront egalement supprimees. Pour le mettre simplement en pause, utilise « Mettre de cote »."
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

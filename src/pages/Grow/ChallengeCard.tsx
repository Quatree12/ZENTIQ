/**
 * Carte de challenge actif.
 *
 * Affiche la progression RÉELLE, dérivée des étapes cochées, et propose
 * l'action du jour. Le bouton de validation change d'état selon que l'étape du
 * jour est faite ou non — jamais selon un compteur stocké.
 *
 * Le rattrapage est possible : une journée passée non cochée reste actionnable.
 * Un challenge n'est jamais bloqué, et il n'y a pas de pénalité.
 *
 * JALONS
 * ------
 * Les jalons sont affichés SOUS la barre de progression, dans l'ordre du
 * parcours. Chacun montre son état réel : franchi (avec sa date) ou à venir.
 * Aucun jalon n'est présenté comme une récompense — c'est un repère de chemin.
 *
 * Ils sont MODIFIABLES APRÈS CRÉATION, via « Ajouter » / « Modifier ». C'était
 * un manque signalé : on pouvait choisir ses jalons à la création, puis plus
 * rien.
 *
 * REPORT
 * ------
 * « Décaler d'un jour » décale tout le challenge sans rien décocher. Le nombre
 * de jours reportés est affiché quand il est supérieur à zéro, comme une
 * souplesse utilisée, jamais comme un échec.
 */
import { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Flag,
  Flame,
  Pause,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { ProgressBar } from '@/components/progress';
import { Modal } from '@/components/modals';
import { useToast } from '@/components/feedback/Toast';
import type { Challenge } from '@/types';
import { CHALLENGE_RHYTHM_LABELS, challengeRhythm } from '@/types';
import {
  computeChallengeProgress,
  describePace,
  viewChallengeDays,
} from '@/utils/challenge-stats';
import { formatDateKey, todayKey } from '@/utils/dates';
import { ChallengeMilestoneEditor } from './ChallengeMilestoneEditor';
import './ChallengeMilestoneEditor.css';

/**
 * Nombre maximal de jours reportables, côté interface.
 * Doit rester aligné avec la borne du repository (30) : l'interface n'offre pas
 * un bouton que les données refuseraient.
 */
const MAX_POSTPONED_DAYS = 30;

export interface ChallengeCardProps {
  challenge: Challenge;
  busy: boolean;
  onCompleteDay: (dayNumber: number) => void;
  onUncompleteDay: (dayNumber: number) => void;
  onPostpone: (days: number) => void;
  onUpdateMilestones: (milestones: Array<{ title: string; throughDay: number }>) => Promise<boolean>;
  onSetAside: () => void;
  onDelete: () => void;
}

export function ChallengeCard({
  challenge,
  busy,
  onCompleteDay,
  onUncompleteDay,
  onPostpone,
  onUpdateMilestones,
  onSetAside,
  onDelete,
}: ChallengeCardProps) {
  const { notify } = useToast();
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const today = todayKey();
  const progress = computeChallengeProgress(challenge, today);
  const days = viewChallengeDays(challenge, today);
  const pace = describePace(progress);

  const rhythm = challengeRhythm(challenge);
  const milestones = challenge.milestones ?? [];
  const postponed = challenge.postponedDays ?? 0;
  const canPostpone = postponed < MAX_POSTPONED_DAYS && progress.percent !== 100;

  const todayStep =
    progress.todayStepNumber === null
      ? undefined
      : days.find((day) => day.dayNumber === progress.todayStepNumber);

  const handleStep = () => {
    if (!todayStep) return;
    if (todayStep.completedAt !== undefined) {
      onUncompleteDay(todayStep.dayNumber);
      notify('Coche retirée.', { tone: 'info' });
    } else {
      onCompleteDay(todayStep.dayNumber);
      notify('Journée validée.', {
        tone: 'success',
        detail: challenge.title + ' — jour ' + todayStep.dayNumber,
      });
    }
  };

  const handlePostpone = () => {
    onPostpone(1);
    // Le message dit ce qui se passe RÉELLEMENT : rien n'est perdu.
    notify("Challenge décalé d'un jour.", {
      tone: 'info',
      detail: 'Aucune étape décochée. La date de fin a été repoussée.',
    });
  };

  const handleSaveMilestones = async (
    next: Array<{ title: string; throughDay: number }>,
  ): Promise<boolean> => {
    const ok = await onUpdateMilestones(next);
    if (ok) setMilestonesOpen(false);
    return ok;
  };

  return (
    <Card compact className="challenge-card">
      <div className="row-between">
        <div className="challenge-card__head">
          <h3 className="challenge-card__title">{challenge.title}</h3>
          <span className="challenge-card__duration">{challenge.durationDays} jours</span>
        </div>
        <Badge tone={challenge.status === 'completed' ? 'success' : 'teal'}>
          {challenge.status === 'completed' ? 'Terminé' : 'En cours'}
        </Badge>
      </div>

      {challenge.description && <p className="body-sm">{challenge.description}</p>}
      {challenge.goal && <p className="challenge-card__goal">« {challenge.goal} »</p>}

      {/* Le rythme n'est affiché que s'il n'est pas le parcours par défaut. */}
      {rhythm !== 'once' && (
        <div className="row-wrap">
          <Badge tone="lavender">{CHALLENGE_RHYTHM_LABELS[rhythm]}</Badge>
          {postponed > 0 && (
            <Badge>
              {postponed} jour{postponed > 1 ? 's' : ''} reporté{postponed > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* Progression : compteur + barre, tous deux dérivés des étapes. */}
      <div className="challenge-card__progress">
        <div className="row-between">
          <span className="challenge-card__count data-value">
            {progress.completedDays} / {progress.totalDays} jours
          </span>
          <span className="data-value">
            {progress.percent === null ? '—' : progress.percent + ' %'}
          </span>
        </div>
        <ProgressBar value={progress.percent ?? 0} label={'Progression de ' + challenge.title} />
      </div>

      {/* --- Jalons ------------------------------------------------------- */}
      <div className="challenge-milestones-block">
        <div className="row-between">
          <p className="data-label">Jalons</p>
          <Button
            variant="tertiary"
            size="sm"
            leadingIcon={<Pencil size={14} />}
            disabled={busy}
            onClick={() => setMilestonesOpen(true)}
          >
            {milestones.length === 0 ? 'Ajouter' : 'Modifier'}
          </Button>
        </div>

        {milestones.length === 0 ? (
          <p className="body-sm">
            Aucun jalon sur ce challenge. Tu peux en poser quelques repères pour marquer le chemin.
          </p>
        ) : (
          <ol className="challenge-milestones">
            {milestones.map((milestone) => {
              const reached = milestone.reachedAt !== undefined;
              return (
                <li
                  key={milestone.index}
                  className={reached ? 'challenge-milestone is-reached' : 'challenge-milestone'}
                >
                  <span className="challenge-milestone__icon" aria-hidden="true">
                    {reached ? <CheckCircle2 size={16} /> : <Flag size={16} />}
                  </span>
                  <span className="challenge-milestone__text">
                    <span className="challenge-milestone__title">{milestone.title}</span>
                    <span className="body-sm">
                      {reached
                        ? 'Franchi le ' +
                          formatDateKey(milestone.reachedAt as string, {
                            day: 'numeric',
                            month: 'short',
                          })
                        : "Jusqu'au jour " + milestone.throughDay}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <dl className="challenge-card__meta">
        <div>
          <dt className="data-label">Jours restants</dt>
          <dd className="data-value">{progress.remainingDays}</dd>
        </div>
        <div>
          <dt className="data-label">Début</dt>
          <dd className="body-sm">
            {formatDateKey(challenge.startDate, { day: 'numeric', month: 'short' })}
          </dd>
        </div>
        <div>
          <dt className="data-label">Fin</dt>
          <dd className="body-sm">
            {formatDateKey(challenge.endDate, { day: 'numeric', month: 'short' })}
          </dd>
        </div>
      </dl>

      {/* Action du jour */}
      {todayStep && progress.percent !== 100 && (
        <div className="challenge-card__today">
          <p className="overline">Action du jour — jour {todayStep.dayNumber}</p>
          <p className="body-base">{todayStep.label}</p>
          <Button
            variant={todayStep.completedAt !== undefined ? 'secondary' : 'primary'}
            size="sm"
            loading={busy}
            leadingIcon={
              todayStep.completedAt !== undefined ? <CheckCircle2 size={16} /> : <Circle size={16} />
            }
            onClick={handleStep}
          >
            {todayStep.completedAt !== undefined ? 'Journée validée' : "Valider aujourd'hui"}
          </Button>
        </div>
      )}

      {pace && <p className="body-sm challenge-card__pace">{pace}</p>}

      {/* Liste des étapes — rattrapage possible sur les jours passés. */}
      <details className="challenge-card__days">
        <summary className="body-sm">Voir les {challenge.durationDays} étapes</summary>
        <ul className="challenge-days">
          {days.map((day) => {
            const done = day.completedAt !== undefined;
            return (
              <li key={day.dayNumber} className="challenge-day">
                <button
                  type="button"
                  className={done ? 'challenge-day__btn is-done' : 'challenge-day__btn'}
                  aria-pressed={done}
                  aria-label={
                    (done ? 'Retirer la coche du jour ' : 'Valider le jour ') +
                    day.dayNumber +
                    ' — ' +
                    day.label
                  }
                  disabled={busy}
                  onClick={() => {
                    if (done) {
                      onUncompleteDay(day.dayNumber);
                    } else {
                      onCompleteDay(day.dayNumber);
                    }
                  }}
                >
                  <span className="challenge-day__check" aria-hidden="true">
                    {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </span>
                  <span className="challenge-day__text">
                    <span className="challenge-day__label">
                      Jour {day.dayNumber}
                      {day.isToday ? " — aujourd'hui" : ''}
                    </span>
                    <span className="body-sm">{day.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </details>

      <div className="row-wrap">
        <Button
          variant="tertiary"
          size="sm"
          leadingIcon={<CalendarClock size={16} />}
          disabled={!canPostpone || busy}
          onClick={handlePostpone}
        >
          Décaler d'un jour
        </Button>
        <Button variant="tertiary" size="sm" leadingIcon={<Pause size={16} />} onClick={onSetAside}>
          Mettre de côté
        </Button>
        <Button variant="danger" size="sm" leadingIcon={<Trash2 size={16} />} onClick={onDelete}>
          Supprimer
        </Button>
      </div>

      <Modal
        open={milestonesOpen}
        onClose={() => setMilestonesOpen(false)}
        title="Jalons du challenge"
        description={
          'Repères sur le parcours de « ' +
          challenge.title +
          ' ». Les étapes, les coches et les dates ne sont pas modifiables ici.'
        }
        size="lg"
      >
        <ChallengeMilestoneEditor
          challenge={challenge}
          onSubmit={handleSaveMilestones}
          onCancel={() => setMilestonesOpen(false)}
        />
      </Modal>
    </Card>
  );
}

/** Badge de série affiché quand plusieurs jours consécutifs sont faits. */
export function ChallengeStreakBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <Badge tone="lavender">
      <Flame size={12} aria-hidden="true" /> {count} jours de suite
    </Badge>
  );
}

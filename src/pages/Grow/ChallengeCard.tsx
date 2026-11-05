/**
 * Carte de challenge actif.
 *
 * Affiche la progression REELLE, derivee des etapes cochees, et propose
 * l'action du jour. Le bouton de validation change d'etat selon que l'etape du
 * jour est faite ou non — jamais selon un compteur stocke.
 *
 * Le rattrapage est possible : une journee passee non cochee reste actionnable.
 * Un challenge n'est jamais bloque, et il n'y a pas de penalite.
 */
import { CheckCircle2, Circle, Flame, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { ProgressBar } from '@/components/progress';
import { useToast } from '@/components/feedback/Toast';
import type { Challenge } from '@/types';
import {
  computeChallengeProgress,
  describePace,
  viewChallengeDays,
} from '@/utils/challenge-stats';
import { formatDateKey, todayKey } from '@/utils/dates';

export interface ChallengeCardProps {
  challenge: Challenge;
  busy: boolean;
  onCompleteDay: (dayNumber: number) => void;
  onUncompleteDay: (dayNumber: number) => void;
  onSetAside: () => void;
  onDelete: () => void;
}

export function ChallengeCard({
  challenge,
  busy,
  onCompleteDay,
  onUncompleteDay,
  onSetAside,
  onDelete,
}: ChallengeCardProps) {
  const { notify } = useToast();
  const today = todayKey();
  const progress = computeChallengeProgress(challenge, today);
  const days = viewChallengeDays(challenge, today);
  const pace = describePace(progress);

  const todayStep =
    progress.todayStepNumber === null
      ? undefined
      : days.find((day) => day.dayNumber === progress.todayStepNumber);

  const handleStep = () => {
    if (!todayStep) return;
    if (todayStep.completedAt !== undefined) {
      onUncompleteDay(todayStep.dayNumber);
      notify('Coche retiree.', { tone: 'info' });
    } else {
      onCompleteDay(todayStep.dayNumber);
      notify('Journee validee.', {
        tone: 'success',
        detail: challenge.title + ' — jour ' + todayStep.dayNumber,
      });
    }
  };

  return (
    <Card compact className="challenge-card">
      <div className="row-between">
        <div className="challenge-card__head">
          <h3 className="challenge-card__title">{challenge.title}</h3>
          <span className="challenge-card__duration">
            {challenge.durationDays} jours
          </span>
        </div>
        <Badge tone={challenge.status === 'completed' ? 'success' : 'teal'}>
          {challenge.status === 'completed' ? 'Termine' : 'En cours'}
        </Badge>
      </div>

      {challenge.description && <p className="body-sm">{challenge.description}</p>}
      {challenge.goal && <p className="challenge-card__goal">« {challenge.goal} »</p>}

      {/* Progression : compteur + barre, tous deux derives des etapes. */}
      <div className="challenge-card__progress">
        <div className="row-between">
          <span className="challenge-card__count data-value">
            {progress.completedDays} / {progress.totalDays} jours
          </span>
          <span className="data-value">
            {progress.percent === null ? '—' : progress.percent + ' %'}
          </span>
        </div>
        <ProgressBar
          value={progress.percent ?? 0}
          label={'Progression de ' + challenge.title}
        />
      </div>

      <dl className="challenge-card__meta">
        <div>
          <dt className="data-label">Jours restants</dt>
          <dd className="data-value">{progress.remainingDays}</dd>
        </div>
        <div>
          <dt className="data-label">Debut</dt>
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
            {todayStep.completedAt !== undefined ? 'Journee validee' : "Valider aujourd'hui"}
          </Button>
        </div>
      )}

      {pace && <p className="body-sm challenge-card__pace">{pace}</p>}

      {/* Liste des etapes — rattrapage possible sur les jours passes. */}
      <details className="challenge-card__days">
        <summary className="body-sm">
          Voir les {challenge.durationDays} etapes
        </summary>
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
                      {day.isToday ? ' — aujourd\'hui' : ''}
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
        <Button variant="tertiary" size="sm" leadingIcon={<Pause size={16} />} onClick={onSetAside}>
          Mettre de cote
        </Button>
        <Button variant="danger" size="sm" leadingIcon={<Trash2 size={16} />} onClick={onDelete}>
          Supprimer
        </Button>
      </div>
    </Card>
  );
}

/** Badge de serie affiche quand plusieurs jours consecutifs sont faits. */
export function ChallengeStreakBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <Badge tone="lavender">
      <Flame size={12} aria-hidden="true" /> {count} jours de suite
    </Badge>
  );
}

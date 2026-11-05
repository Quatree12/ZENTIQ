/**
 * Carte de challenge termine.
 *
 * Le message de reussite est positif mais sobre : pas de confettis, pas de
 * score, pas de comparaison. On rappelle ce qui a ete fait, et c'est tout.
 */
import { CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { ProgressBar } from '@/components/progress';
import type { Challenge } from '@/types';
import { computeChallengeProgress, viewChallengeDays } from '@/utils/challenge-stats';
import { formatDateKey } from '@/utils/dates';

export interface CompletedChallengeCardProps {
  challenge: Challenge;
  onDelete: () => void;
}

export function CompletedChallengeCard({ challenge, onDelete }: CompletedChallengeCardProps) {
  const progress = computeChallengeProgress(challenge);
  const days = viewChallengeDays(challenge);
  const doneDays = days.filter((day) => day.completedAt !== undefined);

  return (
    <Card compact accent="teal" className="challenge-card challenge-card--done">
      <div className="row-between">
        <div className="challenge-card__head">
          <h3 className="challenge-card__title">{challenge.title}</h3>
          <span className="challenge-card__duration">{challenge.durationDays} jours</span>
        </div>
        <Badge tone="success">
          <CheckCircle2 size={12} aria-hidden="true" /> Termine
        </Badge>
      </div>

      <p className="body-base challenge-card__win">
        {challenge.title} est termine. Tu as tenu {challenge.durationDays} jours.
      </p>

      <ProgressBar value={progress.percent ?? 100} label={'Progression finale de ' + challenge.title} />

      <dl className="challenge-card__meta">
        <div>
          <dt className="data-label">Progression</dt>
          <dd className="data-value">{progress.percent === null ? '—' : progress.percent + ' %'}</dd>
        </div>
        <div>
          <dt className="data-label">Journees</dt>
          <dd className="data-value">
            {progress.completedDays} / {progress.totalDays}
          </dd>
        </div>
        <div>
          <dt className="data-label">Termine le</dt>
          <dd className="body-sm">
            {challenge.completedAt
              ? formatDateKey(challenge.completedAt.slice(0, 10), {
                  day: 'numeric',
                  month: 'long',
                })
              : formatDateKey(challenge.endDate, { day: 'numeric', month: 'long' })}
          </dd>
        </div>
      </dl>

      <details className="challenge-card__days">
        <summary className="body-sm">Voir les journees completees</summary>
        <ul className="challenge-days challenge-days--compact">
          {doneDays.map((day) => (
            <li key={day.dayNumber} className="body-sm">
              Jour {day.dayNumber} — {day.label}
            </li>
          ))}
        </ul>
      </details>

      <div className="row-wrap">
        <Button variant="danger" size="sm" leadingIcon={<Trash2 size={16} />} onClick={onDelete}>
          Supprimer
        </Button>
      </div>
    </Card>
  );
}

/**
 * Carte de challenge terminé.
 *
 * Le message de réussite est positif mais sobre : pas de confettis, pas de
 * score, pas de comparaison. On rappelle ce qui a été fait, et c'est tout.
 *
 * PHASE 4.1.8 — PÉRIODE PLUTÔT QU'UNE DATE
 * -----------------------------------------
 * La carte affichait « Terminé le 5 novembre » en prenant la date du dernier
 * jour coché. Pour un challenge de 14 jours commencé et terminé le même jour,
 * deux dates bizarres « 5 nov. » à « 5 nov. » se lisaient comme un challenge
 * d'un seul jour.
 *
 * On affiche désormais la PÉRIODE COMPLÈTE — « du 5 au 18 novembre » — qui rend
 * la durée réelle lisible d'un coup d'œil. Si le départ et la fin tombent le
 * même jour (challenge d'un jour), on affiche une seule date.
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

/** Période du challenge : « du 5 au 18 novembre », ou une date si identique. */
function describePeriod(challenge: Challenge): string {
  const start = formatDateKey(challenge.startDate, { day: 'numeric', month: 'long' });
  const end = formatDateKey(challenge.endDate, { day: 'numeric', month: 'long' });
  if (challenge.startDate === challenge.endDate) return start;
  return 'du ' + start + ' au ' + end;
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
          <CheckCircle2 size={12} aria-hidden="true" /> Terminé
        </Badge>
      </div>

      <p className="body-base challenge-card__win">
        {challenge.title} est terminé. Tu as tenu {challenge.durationDays} jours.
      </p>

      <ProgressBar
        value={progress.percent ?? 100}
        label={'Progression finale de ' + challenge.title}
      />

      <dl className="challenge-card__meta">
        <div>
          <dt className="data-label">Progression</dt>
          <dd className="data-value">
            {progress.percent === null ? '—' : progress.percent + ' %'}
          </dd>
        </div>
        <div>
          <dt className="data-label">Journées</dt>
          <dd className="data-value">
            {progress.completedDays} / {progress.totalDays}
          </dd>
        </div>
        <div>
          <dt className="data-label">Période</dt>
          <dd className="body-sm">{describePeriod(challenge)}</dd>
        </div>
      </dl>

      <details className="challenge-card__days">
        <summary className="body-sm">Voir les journées complétées</summary>
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

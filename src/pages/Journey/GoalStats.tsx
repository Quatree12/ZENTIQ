import { Flag } from 'lucide-react';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { ProgressBar } from '@/components/progress';
import { EmptyState } from '@/components/feedback';
import { GOAL_HORIZON_LABELS } from '@/types';
import type { GoalStats } from '@/utils/journey-stats';
import { daysBetween, formatDateKey, todayKey } from '@/utils/dates';

/**
 * Progression des objectifs.
 *
 * La progression individuelle est lue sur chaque objectif (elle est saisie dans
 * Grow), et la progression globale est la moyenne des objectifs actifs. Les
 * objectifs atteints sont comptes separement : les melanger gonflerait
 * artificiellement le chiffre.
 */
export function GoalStats({ stats }: { stats: GoalStats }) {
  if (stats.total === 0) {
    return (
      <section className="journey-section" aria-labelledby="goal-stats-heading">
        <header>
          <p className="overline">Objectifs</p>
          <h2 className="heading-sm" id="goal-stats-heading">
            Aucun objectif
          </h2>
        </header>
        <EmptyState
          icon={Flag}
          title="Aucun objectif enregistre"
          description="Formule un objectif dans Grow, meme petit. Sa progression apparaitra ici au fil du temps."
        />
      </section>
    );
  }

  const reference = todayKey();

  return (
    <section className="journey-section" aria-labelledby="goal-stats-heading">
      <header>
        <p className="overline">Objectifs</p>
        <h2 className="heading-sm" id="goal-stats-heading">
          {stats.active.length} en cours, {stats.completed.length} atteint
          {stats.completed.length > 1 ? 's' : ''}
        </h2>
      </header>

      <Card compact className="goal-stats__overview">
        <div className="row-between">
          <div>
            <p className="data-label">Progression globale</p>
            <p className="data-value goal-stats__big">
              {stats.overallProgress === null ? '—' : stats.overallProgress + ' %'}
            </p>
          </div>
          {stats.dueSoon.length > 0 && (
            <Badge tone="warning">{stats.dueSoon.length} echeance proche</Badge>
          )}
        </div>
        <ProgressBar
          value={stats.overallProgress ?? 0}
          label="Progression globale des objectifs"
        />
        <p className="body-sm">
          Moyenne des objectifs en cours. Elle ne compte pas les objectifs atteints.
        </p>
      </Card>

      {stats.active.length > 0 && (
        <ul className="goal-stats__list">
          {stats.active.map((goal) => (
            <li key={goal.id}>
              <Card compact className="goal-stat">
                <div className="row-between">
                  <h3 className="goal-stat__title">{goal.title}</h3>
                  {goal.isPriority && <Badge tone="teal">Priorite</Badge>}
                </div>

                <div className="goal-stat__progress">
                  <ProgressBar
                    value={goal.progress}
                    label={'Avancement de ' + goal.title}
                  />
                  <span className="data-value">{goal.progress}%</span>
                </div>

                <dl className="goal-stat__meta">
                  <div>
                    <dt className="data-label">Horizon</dt>
                    <dd className="body-sm">{GOAL_HORIZON_LABELS[goal.horizon]}</dd>
                  </div>
                  <div>
                    <dt className="data-label">Cree le</dt>
                    <dd className="body-sm">
                      {formatDateKey(goal.createdAt.slice(0, 10), {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                  {goal.targetDate && (
                    <div>
                      <dt className="data-label">Echeance</dt>
                      <dd className="body-sm">
                        {formatDateKey(goal.targetDate, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </dd>
                    </div>
                  )}
                </dl>

                {goal.targetDate && (
                  <p className="body-sm">
                    {describeDeadline(goal.targetDate, reference)}
                  </p>
                )}

                {goal.nextStep && (
                  <p className="goal-stat__next">
                    <span className="overline">Prochaine etape</span>
                    {goal.nextStep}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Libelle d'echeance — factuel, jamais alarmiste. */
function describeDeadline(target: string, reference: string): string {
  const remaining = daysBetween(reference, target);
  if (remaining < 0) {
    const late = Math.abs(remaining);
    return late === 1 ? 'Echeance depassee d\'un jour.' : 'Echeance depassee de ' + late + ' jours.';
  }
  if (remaining === 0) return "Echeance aujourd'hui.";
  if (remaining === 1) return 'Il reste un jour.';
  return 'Il reste ' + remaining + ' jours.';
}

import { Minus, Repeat, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { ProgressBar } from '@/components/progress';
import { EmptyState } from '@/components/feedback';
import type { HabitStat } from '@/utils/journey-stats';

/**
 * Statistiques d'habitudes.
 *
 * Une ligne par habitude, avec sa régularité RÉELLE sur la période choisie et
 * ses séries. Rien n'est inventé : tout vient des `HabitCompletion`.
 *
 * Quand une habitude n'était attendue aucun jour de la période, la régularité
 * vaut `null` et l'interface affiche « — » au lieu de « 0 % » : un zéro serait
 * un reproche immérité.
 */
export function HabitStats({ stats, period }: { stats: HabitStat[]; period: number }) {
  if (stats.length === 0) {
    return (
      <section className="journey-section" aria-labelledby="habit-stats-heading">
        <header>
          <p className="overline">Habitudes</p>
          <h2 className="heading-sm" id="habit-stats-heading">
            Aucune habitude suivie
          </h2>
        </header>
        <EmptyState
          icon={Repeat}
          title="Rien à mesurer pour l'instant"
          description="Crée une habitude dans Grow, puis coche-la au fil des jours. Sa régularité apparaîtra ici."
        />
      </section>
    );
  }

  return (
    <section className="journey-section" aria-labelledby="habit-stats-heading">
      <header>
        <p className="overline">Habitudes</p>
        <h2 className="heading-sm" id="habit-stats-heading">
          {stats.length === 1
            ? '1 habitude analysée sur ' + period + ' jours'
            : stats.length + ' habitudes analysées sur ' + period + ' jours'}
        </h2>
      </header>

      <ul className="habit-stats">
        {stats.map((stat) => (
          <li key={stat.habit.id}>
            <Card compact className="habit-stat">
              <div className="row-between">
                <h3 className="habit-stat__name">{stat.habit.name}</h3>
                <TrendBadge trend={stat.recentTrend} />
              </div>

              <div className="habit-stat__progress">
                <ProgressBar
                  value={stat.consistency ?? 0}
                  label={'Régularité de ' + stat.habit.name}
                  tone={stat.habit.accent === 'lavender' ? 'lavender' : 'teal'}
                />
                <span className="data-value">
                  {stat.consistency === null ? '—' : stat.consistency + ' %'}
                </span>
              </div>

              <dl className="habit-stat__grid">
                <div>
                  <dt className="data-label">Jours cochés</dt>
                  <dd className="data-value">
                    {stat.completedDays} / {stat.expectedDays}
                  </dd>
                </div>
                <div>
                  <dt className="data-label">Série actuelle</dt>
                  <dd className="data-value">
                    {stat.currentStreak === 1 ? '1 jour' : stat.currentStreak + ' jours'}
                  </dd>
                </div>
                <div>
                  <dt className="data-label">Meilleure série</dt>
                  <dd className="data-value">
                    {stat.bestStreak === 1 ? '1 jour' : stat.bestStreak + ' jours'}
                  </dd>
                </div>
                <div>
                  <dt className="data-label">7 derniers jours</dt>
                  <dd className="data-value">{stat.last7Days} / 7</dd>
                </div>
              </dl>

              {stat.habit.intention && (
                <p className="body-sm">« {stat.habit.intention} »</p>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Badge d'évolution récente — compare les 7 derniers jours aux 7 précédents. */
function TrendBadge({ trend }: { trend: HabitStat['recentTrend'] }) {
  if (trend === 'up') {
    return (
      <Badge tone="success">
        <TrendingUp size={12} aria-hidden="true" /> En hausse
      </Badge>
    );
  }
  if (trend === 'down') {
    return (
      <Badge tone="warning">
        <TrendingDown size={12} aria-hidden="true" /> Ralentit
      </Badge>
    );
  }
  return (
    <Badge>
      <Minus size={12} aria-hidden="true" /> Stable
    </Badge>
  );
}

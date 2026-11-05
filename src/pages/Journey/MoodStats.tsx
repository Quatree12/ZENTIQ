import { Activity, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState } from '@/components/feedback';
import { MoodChart } from './MoodChart';
import { describeTrend, PERIODS, type StatPeriod } from '@/utils/journey-stats';
import type { MoodStats as MoodStatsData } from '@/utils/journey-stats';
import { MOOD_LABELS } from '@/types';
import { formatDateKey } from '@/utils/dates';

/**
 * Statistiques d'humeur.
 *
 * Toutes les valeurs viennent des `MoodEntry` reellement enregistrees. Si la
 * periode ne contient aucune donnee, un etat vide explique comment commencer
 * plutot que d'afficher un graphique plat a zero.
 *
 * Le choix de periode (7 / 30 jours) est partage avec le reste de Journey : les
 * sections restent coherentes entre elles.
 *
 * NOTE : les donnees sont recues en propriete depuis `JourneyPage`, qui monte
 * le hook une seule fois. Ce composant ne lit pas la base lui-meme — cela
 * evite quatre chargements concurrents pour un meme ecran.
 */
export interface MoodStatsProps {
  stats: MoodStatsData;
  period: StatPeriod;
  onPeriodChange: (period: StatPeriod) => void;
}

export function MoodStats({ stats, period, onPeriodChange }: MoodStatsProps) {
  if (stats.entriesCount === 0) {
    return (
      <section className="journey-section" aria-labelledby="mood-stats-heading">
        <header>
          <p className="overline">Humeur</p>
          <h2 className="heading-sm" id="mood-stats-heading">
            Aucune donnee sur la periode
          </h2>
        </header>
        <EmptyState
          icon={Activity}
          title="Pas encore de check-in"
          description="Note ton humeur depuis l'ecran Today, en quelques secondes. Apres quelques jours, une tendance apparaitra ici."
        />
      </section>
    );
  }

  const TrendIcon =
    stats.trend === 'up' ? TrendingUp : stats.trend === 'down' ? TrendingDown : Minus;

  return (
    <section className="journey-section" aria-labelledby="mood-stats-heading">
      <header className="row-between">
        <div>
          <p className="overline">Humeur</p>
          <h2 className="heading-sm" id="mood-stats-heading">
            {stats.entriesCount > 1
              ? stats.entriesCount + ' journees notees'
              : '1 journee notee'}
          </h2>
        </div>
        <PeriodToggle period={period} onChange={onPeriodChange} />
      </header>

      <Card compact className="mood-stats__card">
        <div className="row-wrap">
          {stats.average !== null && (
            <Badge tone="lavender">Moyenne {stats.average.toFixed(1)} / 5</Badge>
          )}
          {stats.trend !== null && (
            <span className={'mood-trend mood-trend--' + stats.trend}>
              <TrendIcon size={14} aria-hidden="true" />
              {describeTrend(stats.trend)}
              {stats.trendDelta !== null && stats.trendDelta !== 0 && (
                <span className="mood-trend__delta">
                  {stats.trendDelta > 0 ? '+' : ''}
                  {stats.trendDelta.toFixed(1)}
                </span>
              )}
            </span>
          )}
        </div>

        <MoodChart points={stats.points} />

        <dl className="mood-stats__grid">
          <div className="mood-stat">
            <dt className="data-label">Notees</dt>
            <dd className="data-value">{stats.entriesCount}</dd>
          </div>
          <div className="mood-stat">
            <dt className="data-label">Sans entree</dt>
            <dd className="data-value">{stats.missingCount}</dd>
          </div>
          <div className="mood-stat">
            <dt className="data-label">Meilleur jour</dt>
            <dd className="data-value">
              {stats.bestDay && stats.bestDay.mood !== null
                ? MOOD_LABELS[stats.bestDay.mood]
                : '—'}
            </dd>
          </div>
        </dl>

        {stats.bestDay && (
          <p className="body-sm">
            Journee la plus lumineuse :{' '}
            {formatDateKey(stats.bestDay.date, { day: 'numeric', month: 'long' })}
          </p>
        )}
      </Card>
    </section>
  );
}

/** Selecteur de periode — 7 ou 30 jours. */
function PeriodToggle({
  period,
  onChange,
}: {
  period: StatPeriod;
  onChange: (p: StatPeriod) => void;
}) {
  return (
    <div className="row-wrap" role="group" aria-label="Periode analysee">
      {PERIODS.map((value) => (
        <button
          key={value}
          type="button"
          className={period === value ? 'filter-chip is-active' : 'filter-chip'}
          aria-pressed={period === value}
          onClick={() => onChange(value)}
        >
          {value} jours
        </button>
      ))}
    </div>
  );
}

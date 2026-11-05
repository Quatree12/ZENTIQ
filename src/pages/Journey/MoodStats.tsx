import { useMemo, useState } from 'react';
import { Activity, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState, LoadingState } from '@/components/feedback';
import { MoodChart } from './MoodChart';
import { useJourneyStats } from '@/hooks/useJourneyStats';
import { describeTrend, PERIODS, type StatPeriod } from '@/utils/journey-stats';
import { MOOD_LABELS } from '@/types';
import { formatDateKey } from '@/utils/dates';

/**
 * Statistiques d'humeur.
 *
 * Toutes les valeurs viennent des `MoodEntry` reellement enregistrees. Si la
 * periode ne contient aucune donnee, un etat vide explique comment commencer
 * plutot que d'afficher un graphique plat a zero.
 *
 * Le choix de periode (7 / 30 jours) est partage avec le reste de Journey via
 * le hook : les sections restent coherentes entre elles.
 */
export function MoodStats({ period, onPeriodChange }: { period: StatPeriod; onPeriodChange: (p: StatPeriod) => void }) {
  const { moods, loading, error } = useJourneyStats();
  void loading;
  void error;

  if (moods.points.length > 0 && moods.entriesCount === 0) {
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

  const trendIcon =
    moods.trend === 'up' ? TrendingUp : moods.trend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  return (
    <section className="journey-section" aria-labelledby="mood-stats-heading">
      <header className="row-between">
        <div>
          <p className="overline">Humeur</p>
          <h2 className="heading-sm" id="mood-stats-heading">
            {moods.entriesCount === 0
              ? 'Aucune donnee'
              : moods.entriesCount + (moods.entriesCount > 1 ? ' journees notees' : ' journee notee')}
          </h2>
        </div>
        <PeriodToggle period={period} onChange={onPeriodChange} />
      </header>

      <Card compact className="mood-stats__card">
        <div className="row-wrap">
          {moods.average !== null && (
            <Badge tone="lavender">Moyenne {moods.average.toFixed(1)} / 5</Badge>
          )}
          {moods.trend !== null && (
            <span className={'mood-trend mood-trend--' + moods.trend}>
              <TrendIcon size={14} aria-hidden="true" />
              {describeTrend(moods.trend)}
              {moods.trendDelta !== null && moods.trendDelta !== 0 && (
                <span className="mood-trend__delta">
                  {moods.trendDelta > 0 ? '+' : ''}
                  {moods.trendDelta.toFixed(1)}
                </span>
              )}
            </span>
          )}
        </div>

        <MoodChart points={moods.points} />

        <dl className="mood-stats__grid">
          <div className="mood-stat">
            <dt className="data-label">Notées</dt>
            <dd className="data-value">{moods.entriesCount}</dd>
          </div>
          <div className="mood-stat">
            <dt className="data-label">Sans entree</dt>
            <dd className="data-value">{moods.missingCount}</dd>
          </div>
          <div className="mood-stat">
            <dt className="data-label">Meilleur jour</dt>
            <dd className="data-value">
              {moods.bestDay ? MOOD_LABELS[moods.bestDay.mood ?? 3] : '—'}
            </dd>
          </div>
        </dl>

        {moods.bestDay && (
          <p className="body-sm">
            Journee la plus lumineuse : {formatDateKey(moods.bestDay.date, { day: 'numeric', month: 'long' })}
          </p>
        )}
      </Card>
    </section>
  );
}

/** Selecteur de periode — 7 ou 30 jours. */
function PeriodToggle({ period, onChange }: { period: StatPeriod; onChange: (p: StatPeriod) => void }) {
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

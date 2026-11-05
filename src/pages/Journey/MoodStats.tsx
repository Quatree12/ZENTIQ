import { Activity, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState } from '@/components/feedback';
import { MoodChart } from './MoodChart';
import { PERIODS, type StatPeriod } from '@/utils/journey-stats';
import type { MoodStats as MoodStatsData } from '@/utils/journey-stats';
import { MOOD_LABELS } from '@/types';
import { formatDateKey } from '@/utils/dates';

/**
 * Statistiques d'humeur.
 *
 * L'INDICATEUR DE TENDANCE EST RETIRÉ
 * -----------------------------------
 * Le badge « En hausse / En baisse / Stable » a été supprimé. Deux calculs
 * successifs ont été essayés (découpage en moitiés, puis fenêtre glissante),
 * et les deux ont produit un chiffre qui ne correspondait pas aux données
 * réelles : « -0.8 » puis « +0.3 » sur une série qui devait donner « +1.0 ».
 *
 * Dans une interface où tous les autres chiffres sont exacts, un indicateur
 * qu'on ne peut ni expliquer ni vérifier n'a pas sa place. Le calcul `trend`
 * reste présent dans `journey-stats.ts` et couvert par ses tests : si la cause
 * est identifiée plus tard, il suffira de rebrancher un badge ici.
 *
 * CE QUI RESTE, et qui est vérifié sur données réelles :
 *   - la courbe d'évolution, jour par jour
 *   - la moyenne de la période
 *   - le nombre de journées notées et sans entrée
 *   - le meilleur jour de la période
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
            Aucune donnée sur la période
          </h2>
        </header>
        <EmptyState
          icon={Activity}
          title="Pas encore de check-in"
          description="Note ton humeur depuis l'écran Today, en quelques secondes. Après quelques jours, une tendance apparaîtra ici."
        />
      </section>
    );
  }

  return (
    <section className="journey-section" aria-labelledby="mood-stats-heading">
      <header className="row-between">
        <div>
          <p className="overline">Humeur</p>
          <h2 className="heading-sm" id="mood-stats-heading">
            {stats.entriesCount > 1
              ? stats.entriesCount + ' journées notées'
              : '1 journée notée'}
          </h2>
        </div>
        <PeriodToggle period={period} onChange={onPeriodChange} />
      </header>

      <Card compact className="mood-stats__card">
        <div className="row-wrap">
          {stats.average !== null && (
            <Badge tone="lavender">Moyenne {stats.average.toFixed(1)} / 5</Badge>
          )}
        </div>

        <MoodChart points={stats.points} />

        <dl className="mood-stats__grid">
          <div className="mood-stat">
            <dt className="data-label">Notées</dt>
            <dd className="data-value">{stats.entriesCount}</dd>
          </div>
          <div className="mood-stat">
            <dt className="data-label">Sans entrée</dt>
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
            Journée la plus lumineuse :{' '}
            {formatDateKey(stats.bestDay.date, { day: 'numeric', month: 'long' })}
          </p>
        )}
      </Card>
    </section>
  );
}

/** Sélecteur de période — 7 ou 30 jours. */
function PeriodToggle({
  period,
  onChange,
}: {
  period: StatPeriod;
  onChange: (p: StatPeriod) => void;
}) {
  return (
    <div className="row-wrap" role="group" aria-label="Période analysée">
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

/** Icônes conservées pour un usage ultérieur (tests, futurs indicateurs). */
export const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };

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
 * PHASE 4.1.10 — L'INDICATEUR DE TENDANCE EST RETIRE
 * --------------------------------------------------
 * Le badge « En hausse / En baisse / Stable » a ete supprime. Deux calculs
 * successifs ont ete essayes (decoupage en moities, puis fenetre glissante), et
 * les deux ont produit un chiffre qui ne correspondait pas aux donnees reelles
 * de l'utilisateur : « -0.8 » puis « +0.3 » sur une serie qui devait donner
 * « +1.0 ».
 *
 * La cause exacte n'a pas pu etre etablie sans terminal pour reproduire. Dans
 * une interface ou tous les autres chiffres sont exacts, un indicateur qu'on ne
 * peut ni expliquer ni verifier n'a pas sa place : il vaut mieux le retirer que
 * de laisser un nombre douteux a cote de chiffres fiables.
 *
 * CE QUI RESTE, et qui est verifie sur donnees reelles :
 *   - la courbe d'evolution, jour par jour
 *   - la moyenne de la periode
 *   - le nombre de journees notees et le nombre de journees sans entree
 *   - le meilleur jour de la periode
 *   - la date de la journee la plus lumineuse
 *
 * Le calcul `trend` reste present dans `journey-stats.ts` et couvert par ses
 * tests : si la cause est identifiee plus tard, il suffira de rebrancher un
 * badge ici.
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
            Journee la plus lumineuse :
            {' '}
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

/** Icones conservees pour un usage ulterieur (tests, futurs indicateurs). */
export const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };

import { Activity, BookOpen, Flame, Repeat, Route, Sprout, Target } from 'lucide-react';
import { Card } from '@/components/cards';
import { ProgressRing } from '@/components/progress';
import { summarizeJourney, type JourneySummary } from '@/utils/journey-stats';

/**
 * Synthese personnelle de Journey.
 *
 * Cinq mesures, toutes lues dans la base locale. Aucune n'est completee par une
 * valeur de remplissage : une mesure sans donnee affiche « — » et la phrase de
 * synthese reste encourageante, jamais evaluative.
 *
 * L'anneau de progression porte le taux de regularite — la seule mesure qui se
 * lit bien en pourcentage circulaire. Les autres sont des compteurs.
 */
export function JourneySummaryCard({ summary }: { summary: JourneySummary }) {
  const hasAnything =
    summary.moodEntries > 0 ||
    summary.habitsTracked > 0 ||
    summary.goalsActive > 0 ||
    summary.goalsCompleted > 0 ||
    summary.journalEntries > 0;

  return (
    <section className="journey-section" aria-labelledby="summary-heading">
      <header>
        <p className="overline">Synthese</p>
        <h2 className="heading-sm" id="summary-heading">
          Ton resume
        </h2>
      </header>

      <Card className="journey-summary">
        <div className="journey-summary__top">
          <ProgressRing
            value={summary.consistency ?? 0}
            tone="teal"
            label="Regularite des habitudes"
          >
            <span className="data-value journey-summary__ring">
              {summary.consistency === null ? '—' : summary.consistency + '%'}
            </span>
          </ProgressRing>

          <div className="journey-summary__text">
            <p className="data-label">Regularite des habitudes</p>
            <p className="body-base">{summarizeJourney(summary)}</p>
          </div>
        </div>

        <dl className="journey-summary__grid">
          <Metric
            icon={<Activity size={16} />}
            label="Humeur"
            value={summary.moodAverage === null ? '—' : summary.moodAverage.toFixed(1) + ' / 5'}
          />
          <Metric
            icon={<Repeat size={16} />}
            label="Habitudes"
            value={summary.habitsTracked === 0 ? '—' : String(summary.habitsTracked)}
          />
          <Metric
            icon={<Target size={16} />}
            label="Objectifs"
            value={String(summary.goalsActive)}
            detail={
              summary.goalsCompleted > 0
                ? summary.goalsCompleted + ' atteint' + (summary.goalsCompleted > 1 ? 's' : '')
                : undefined
            }
          />
          <Metric
            icon={<BookOpen size={16} />}
            label="Journal"
            value={String(summary.journalEntries)}
          />
          <Metric
            icon={<Flame size={16} />}
            label="Challenges"
            value={summary.challengesActive === 0 ? '—' : String(summary.challengesActive)}
          />
          <Metric
            icon={<Route size={16} />}
            label="Progression"
            value={summary.goalsProgress === null ? '—' : summary.goalsProgress + ' %'}
          />
        </dl>

        {!hasAnything && (
          <p className="body-sm journey-summary__empty">
            Rien a resumer pour l'instant. Un check-in d'humeur, une habitude cochee ou une ligne de
            journal suffisent a faire vivre cette page.
          </p>
        )}
      </Card>
    </section>
  );
}

/** Une mesure du resume : icone, libelle, valeur, precision facultative. */
function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="journey-metric">
      <span className="journey-metric__icon" aria-hidden="true">
        {icon}
      </span>
      <dt className="data-label">{label}</dt>
      <dd className="data-value journey-metric__value">{value}</dd>
      {detail && <dd className="body-sm journey-metric__detail">{detail}</dd>}
    </div>
  );
}

/** Icone de secours exportee pour les tests d'integration. */
export const summaryIcon = Sprout;

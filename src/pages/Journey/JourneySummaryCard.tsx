import { Activity, BookOpen, Flame, Repeat, Route, Sprout, Target } from 'lucide-react';
import { Card } from '@/components/cards';
import { ProgressRing } from '@/components/progress';
import { summarizeJourney, type JourneySummary } from '@/utils/journey-stats';

/**
 * Synthèse personnelle de Journey.
 *
 * Six mesures, toutes lues dans la base locale. Aucune n'est complétée par une
 * valeur de remplissage : une mesure sans donnée affiche « — » et la phrase de
 * synthèse reste encourageante, jamais évaluative.
 *
 * DEUX CHIFFRES DIFFÉRENTS, DEUX LIBELLÉS DIFFÉRENTS
 * --------------------------------------------------
 * L'anneau affiche la RÉGULARITÉ des habitudes (un pourcentage) ; la mesure
 * « Habitudes » affiche leur NOMBRE. Ces deux valeurs étaient côte à côte avec
 * des libellés trop proches, ce qui les rendait confondables : lire « HABITUDES
 * 2 » juste sous un anneau à « 0 % » laissait croire à une incohérence.
 *
 * Le libellé porte désormais l'unité — « 2 suivies » — et la précision
 * « régularité 0 % » est rappelée sous la valeur.
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
        <p className="overline">Synthèse</p>
        <h2 className="heading-sm" id="summary-heading">
          Ton résumé
        </h2>
      </header>

      <Card className="journey-summary">
        <div className="journey-summary__top">
          <ProgressRing
            value={summary.consistency ?? 0}
            tone="teal"
            label="Régularité des habitudes"
          >
            <span className="data-value journey-summary__ring">
              {summary.consistency === null ? '—' : summary.consistency + '%'}
            </span>
          </ProgressRing>

          <div className="journey-summary__text">
            <p className="data-label">Régularité des habitudes</p>
            <p className="body-base">{summarizeJourney(summary)}</p>
          </div>
        </div>

        <dl className="journey-summary__grid">
          <Metric
            icon={<Activity size={16} />}
            label="Humeur"
            value={summary.moodAverage === null ? '—' : summary.moodAverage.toFixed(1) + ' / 5'}
          />

          {/* Nombre d'habitudes suivies — et non leur régularité. */}
          <Metric
            icon={<Repeat size={16} />}
            label="Habitudes"
            value={
              summary.habitsTracked === 0 ? '—' : String(summary.habitsTracked) + ' suivies'
            }
            detail={
              summary.habitsTracked > 0 && summary.consistency !== null
                ? 'régularité ' + summary.consistency + ' %'
                : undefined
            }
          />

          <Metric
            icon={<Target size={16} />}
            label="Objectifs"
            value={
              summary.goalsActive === 0
                ? '—'
                : String(summary.goalsActive) + (summary.goalsActive > 1 ? ' actifs' : ' actif')
            }
            detail={
              summary.goalsCompleted > 0
                ? summary.goalsCompleted + ' atteint' + (summary.goalsCompleted > 1 ? 's' : '')
                : undefined
            }
          />

          <Metric
            icon={<BookOpen size={16} />}
            label="Journal"
            value={
              summary.journalEntries === 0
                ? '—'
                : String(summary.journalEntries) +
                  (summary.journalEntries > 1 ? ' entrées' : ' entrée')
            }
          />

          <Metric
            icon={<Flame size={16} />}
            label="Challenges"
            value={
              summary.challengesActive === 0
                ? '—'
                : String(summary.challengesActive) + ' en cours'
            }
          />

          <Metric
            icon={<Route size={16} />}
            label="Progression"
            value={summary.goalsProgress === null ? '—' : summary.goalsProgress + ' %'}
            detail={summary.goalsProgress === null ? undefined : 'objectifs en cours'}
          />
        </dl>

        {!hasAnything && (
          <p className="body-sm journey-summary__empty">
            Rien à résumer pour l'instant. Un check-in d'humeur, une habitude cochée ou une ligne
            de journal suffisent à faire vivre cette page.
          </p>
        )}
      </Card>
    </section>
  );
}

/** Une mesure du résumé : icône, libellé, valeur, précision facultative. */
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

/** Icône de secours exportée pour les tests d'intégration. */
export const summaryIcon = Sprout;

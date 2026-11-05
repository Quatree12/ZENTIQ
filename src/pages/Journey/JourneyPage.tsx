import { PageHeader } from '@/layouts/PageHeader';
import { ErrorState, LoadingState } from '@/components/feedback';
import { useJourneyStats } from '@/hooks/useJourneyStats';
import { JourneySummaryCard } from './JourneySummaryCard';
import { MoodStats } from './MoodStats';
import { HabitStats } from './HabitStats';
import { GoalStats } from './GoalStats';
import { Trends } from './Trends';
import { MoodHistory } from './MoodHistory';
import { ProgressTimeline } from './ProgressTimeline';
import { Journal } from './Journal';
import './Journey.css';
import './JourneyStats.css';
import './Trends.css';

/**
 * JOURNEY — l'espace de suivi personnel.
 *
 * Ordre de lecture : la synthèse d'abord (où en suis-je), puis les analyses par
 * domaine (humeur, habitudes, objectifs), puis les TENDANCES, puis l'historique
 * brut (humeurs passées, timeline, journal).
 *
 * Le hook `useJourneyStats` est monté UNE fois ici, et ses données sont passées
 * en propriétés aux sections analytiques : changer la période met tout à jour
 * de façon cohérente, sans que chaque section recharge la base.
 *
 * `Trends` fait exception : il charge son propre rapport, parce qu'il analyse
 * une fenêtre différente (7 ou 30 jours, choisie dans l'écran) et croise des
 * domaines que `useJourneyStats` ne rapproche pas.
 *
 * Toutes les mesures viennent des données locales réelles. Aucune statistique
 * n'est générée pour remplir l'interface.
 */
export default function JourneyPage() {
  const { loading, error, hasAnyData, period, setPeriod, moods, habitStats, goals, summary, refresh } =
    useJourneyStats();

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Journey"
        title="Ta trajectoire"
        description="Ce que tu as traversé, écrit et coché. C'est le récit de ton avancée, pas une évaluation."
      />

      {loading && !hasAnyData ? (
        <LoadingState label="Calcul de tes statistiques…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : (
        <>
          <JourneySummaryCard summary={summary} />
          <MoodStats stats={moods} period={period} onPeriodChange={setPeriod} />
          <HabitStats stats={habitStats} period={period} />
          <GoalStats stats={goals} />
          <Trends />
          <MoodHistory />
          <ProgressTimeline />
          <Journal />
        </>
      )}
    </div>
  );
}

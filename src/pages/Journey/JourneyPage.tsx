import { PageHeader } from '@/layouts/PageHeader';
import { ErrorState, LoadingState } from '@/components/feedback';
import { useJourneyStats } from '@/hooks/useJourneyStats';
import { JourneySummaryCard } from './JourneySummaryCard';
import { MoodStats } from './MoodStats';
import { HabitStats } from './HabitStats';
import { GoalStats } from './GoalStats';
import { MoodHistory } from './MoodHistory';
import { ProgressTimeline } from './ProgressTimeline';
import { Journal } from './Journal';
import './Journey.css';
import './JourneyStats.css';

/**
 * JOURNEY — l'espace de suivi personnel.
 *
 * Ordre de lecture : la synthese d'abord (ou en suis-je), puis les analyses par
 * domaine (humeur, habitudes, objectifs), puis l'historique brut (humeurs
 * passees, timeline, journal).
 *
 * Le hook `useJourneyStats` est monte UNE fois ici, et ses donnees sont passees
 * en proprietes aux sections analytiques : changer la periode met tout a jour
 * de facon coherente, sans que chaque section recharge la base. C'est ce qui
 * evite quatre lectures IndexedDB concurrentes pour un meme ecran.
 *
 * Toutes les mesures viennent des donnees locales reelles. Aucune statistique
 * n'est generee pour remplir l'interface.
 */
export default function JourneyPage() {
  const { loading, error, hasAnyData, period, setPeriod, moods, habitStats, goals, summary, refresh } =
    useJourneyStats();

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Journey"
        title="Ta trajectoire"
        description="Ce que tu as traverse, ecrit et coche. C'est le recit de ton avancee, pas une evaluation."
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
          <MoodHistory />
          <ProgressTimeline />
          <Journal />
        </>
      )}
    </div>
  );
}

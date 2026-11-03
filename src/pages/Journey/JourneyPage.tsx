import { PageHeader } from '@/layouts/PageHeader';
import { Journal } from './Journal';
import { MoodHistory } from './MoodHistory';
import { ProgressTimeline } from './ProgressTimeline';
import './Journey.css';

/**
 * JOURNEY — l'espace de suivi personnel.
 *
 * Trois sections : le journal, l'historique d'humeur et la timeline. Aucune
 * statistique avancée pour l'instant — uniquement ce qui est réellement calculé
 * à partir des données locales.
 */
export default function JourneyPage() {
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Journey"
        title="Ta trajectoire"
        description="Ce que tu as traversé, écrit et coché. C'est le récit de ton avancée, pas une évaluation."
      />

      <MoodHistory />
      <ProgressTimeline />
      <Journal />
    </div>
  );
}

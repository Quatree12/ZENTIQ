import { PageHeader } from '@/layouts/PageHeader';
import { DailyInspiration, TodayProgress, TodayShortcuts } from './DailyInspiration';
import { MoodCheckIn } from './MoodCheckIn';
import './Today.css';

/**
 * TODAY — l'écran d'accueil.
 *
 * Quatre blocs, dans l'ordre d'usage : l'inspiration du jour, le check-in
 * d'humeur, l'état de la progression, puis les raccourcis vers les autres
 * espaces. Tout est lu en local, donc disponible hors ligne.
 */
export default function TodayPage() {
  const today = new Intl.DateTimeFormat('fr-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Today"
        title="Ton espace du jour"
        description={`${today.charAt(0).toUpperCase()}${today.slice(1)} — prends un instant pour toi, à ton rythme.`}
      />

      <DailyInspiration />
      <MoodCheckIn />
      <TodayProgress />
      <TodayShortcuts />
    </div>
  );
}

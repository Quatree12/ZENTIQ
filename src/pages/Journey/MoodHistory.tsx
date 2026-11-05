import { useEffect } from 'react';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { EmptyState, LoadingState } from '@/components/feedback';
import { MOOD_LABELS, type MoodLevel } from '@/types';
import { useMood } from '@/hooks/useMood';
import { formatRelativeDateKey, lastNDays } from '@/utils/dates';

const MOOD_TONE: Record<MoodLevel, string> = {
  1: 'var(--color-mood-1)',
  2: 'var(--color-mood-2)',
  3: 'var(--color-mood-3)',
  4: 'var(--color-mood-4)',
  5: 'var(--color-mood-5)',
};

/**
 * Historique des humeurs.
 *
 * Deux lectures : la semaine en cours, sous forme de repères, puis la liste
 * détaillée. La moyenne n'est affichée que si elle repose sur des données
 * réelles — sinon un état vide prend sa place.
 */
export function MoodHistory() {
  const { entries, average, loading, refresh } = useMood();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const week = lastNDays(7);
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));

  if (loading && entries.length === 0) return <LoadingState label="Lecture de tes humeurs…" />;

  return (
    <section className="journey-section" aria-labelledby="mood-heading">
      <header>
        <p className="overline">Humeurs</p>
        <h2 className="heading-sm" id="mood-heading">
          {entries.length === 0
            ? 'Aucune donnée'
            : `${entries.length} check-in${entries.length > 1 ? 's' : ''}`}
        </h2>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="Pas encore de check-in"
          description="Note ton humeur depuis l'écran Today. Après quelques jours, une tendance se dessine ici."
          action={{
            label: 'Aller à Today',
            onClick: () => {
              window.location.assign('/today');
            },
          }}
        />
      ) : (
        <>
          <Card compact className="mood-week">
            <div className="row-between">
              <p className="overline">Sept derniers jours</p>
              {average !== null && (
                <Badge tone="lavender">Moyenne {average.toFixed(1)} / 5</Badge>
              )}
            </div>

            <ul className="mood-week__days">
              {week.map((key) => {
                const entry = byDate.get(key);
                return (
                  <li key={key} className="mood-day">
                    <span
                      className="mood-day__dot"
                      style={entry ? { backgroundColor: MOOD_TONE[entry.mood] } : undefined}
                      aria-hidden="true"
                    />
                    <span className="mood-day__label">
                      {entry ? MOOD_LABELS[entry.mood] : '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <ul className="mood-list">
            {entries.slice(0, 14).map((entry) => (
              <li key={entry.id}>
                <Card compact className="mood-entry">
                  <div className="row-between">
                    <span className="mood-entry__date">{formatRelativeDateKey(entry.date)}</span>
                    <Badge tone="lavender">{MOOD_LABELS[entry.mood]}</Badge>
                  </div>
                  {entry.note && <p className="body-sm">{entry.note}</p>}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

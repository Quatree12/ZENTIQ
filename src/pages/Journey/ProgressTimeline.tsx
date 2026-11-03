import { useEffect, useState } from 'react';
import { Activity, BookOpen, Flag, Repeat, Smile } from 'lucide-react';
import { Card } from '@/components/cards';
import { EmptyState, LoadingState } from '@/components/feedback';
import { useJournal } from '@/hooks/useJournal';
import { formatRelativeDateKey } from '@/utils/dates';
import type { TimelinePoint } from '@/types';

/**
 * Timeline d'évolution personnelle.
 *
 * Elle agrège quatre sources réelles : check-ins d'humeur, habitudes cochées,
 * objectifs atteints et entrées de journal. Un type d'événement peut être isolé
 * pour lire une seule trajectoire.
 */

const KIND_META: Record<TimelinePoint['kind'], { label: string; icon: typeof Activity }> = {
  mood: { label: 'Humeur', icon: Smile },
  habit: { label: 'Habitude', icon: Repeat },
  goal: { label: 'Objectif', icon: Flag },
  journal: { label: 'Journal', icon: BookOpen },
  challenge: { label: 'Challenge', icon: Activity },
};

const FILTERS = ['all', 'journal', 'habit', 'mood', 'goal'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Tout',
  journal: 'Journal',
  habit: 'Habitudes',
  mood: 'Humeurs',
  goal: 'Objectifs',
};

export function ProgressTimeline() {
  const { timeline, loading, refresh } = useJournal();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible = timeline.filter((point) => filter === 'all' || point.kind === filter);

  if (loading && timeline.length === 0) return <LoadingState label="Construction de ta timeline…" />;

  return (
    <section className="journey-section" aria-labelledby="timeline-heading">
      <header>
        <p className="overline">Évolution</p>
        <h2 className="heading-sm" id="timeline-heading">
          {timeline.length === 0 ? 'Rien à afficher' : `${timeline.length} événement${timeline.length > 1 ? 's' : ''}`}
        </h2>
      </header>

      <div className="row-wrap" role="group" aria-label="Filtrer la timeline">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? 'filter-chip is-active' : 'filter-chip'}
            onClick={() => setFilter(item)}
          >
            {FILTER_LABELS[item]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Aucun événement sur ce filtre"
          description="Coche une habitude, note ton humeur ou écris dans ton journal : chaque geste apparaîtra ici."
        />
      ) : (
        <ol className="timeline">
          {visible.map((point) => {
            const meta = KIND_META[point.kind];
            const Icon = meta.icon;
            return (
              <li key={point.id} className="timeline__item">
                <span className="timeline__marker" aria-hidden="true">
                  <Icon size={14} />
                </span>
                <Card compact className="timeline__card">
                  <div className="row-between">
                    <span className="timeline__label">{point.label}</span>
                    <span className="timeline__date">{formatRelativeDateKey(point.date)}</span>
                  </div>
                  {point.detail && <p className="body-sm">{point.detail}</p>}
                  <span className="overline">{meta.label}</span>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

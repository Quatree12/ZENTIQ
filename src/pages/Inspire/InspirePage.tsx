import { useState } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { QuoteLibrary } from './QuoteLibrary';
import { Affirmations } from './Affirmations';
import { MusicInspiration } from './MusicInspiration';
import { Favorites } from './Favorites';
import './Inspire.css';

type InspireTab = 'quotes' | 'affirmations' | 'music' | 'favorites';

const TABS: { id: InspireTab; label: string }[] = [
  { id: 'quotes', label: 'Citations' },
  { id: 'affirmations', label: 'Affirmations' },
  { id: 'music', label: 'Musique' },
  { id: 'favorites', label: 'Favoris' },
];

/**
 * INSPIRE — l'espace d'inspiration.
 *
 * Quatre sections accessibles par onglets. La recherche et les filtres sont
 * locaux : ils parcourent le contenu disponible sans requête réseau.
 */
export default function InspirePage() {
  const [tab, setTab] = useState<InspireTab>('quotes');

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Inspire"
        title="De quoi nourrir ton élan"
        description="Citations, affirmations et musique. Tout est consultable hors ligne, et rien ne t'est imposé."
      />

      <div className="inspire-tabs" role="tablist" aria-label="Sections d'inspiration">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'filter-chip is-active' : 'filter-chip'}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'quotes' && <QuoteLibrary />}
      {tab === 'affirmations' && <Affirmations />}
      {tab === 'music' && <MusicInspiration />}
      {tab === 'favorites' && <Favorites />}
    </div>
  );
}

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { PageHeader } from '@/layouts/PageHeader';
import { QuoteLibrary } from './QuoteLibrary';
import { Affirmations } from './Affirmations';
import { MusicInspiration } from './MusicInspiration';
import { Favorites } from './Favorites';
import { CONTENT_COUNTS } from '@/content/library';
import './Inspire.css';

/**
 * INSPIRE — l'espace d'inspiration.
 *
 * LA BARRE D'ONGLETS EST COLLANTE, ET C'EST UN CORRECTIF
 * ------------------------------------------------------
 * Avec le regroupement par categorie, les citations occupent beaucoup plus de
 * hauteur. La barre d'onglets se retrouvait donc poussee hors de l'ecran des
 * qu'on descendait dans les groupes, et FAVORIS devenait introuvable : la
 * bibliotheque personnelle existait, mais on ne pouvait plus y acceder.
 *
 * Elle reste desormais accrochee sous l'en-tete pendant le defilement. Le
 * `top` tient compte de la hauteur du header de l'application.
 *
 * FAVORIS VIENT EN PREMIER : c'est la bibliotheque personnelle de la personne,
 * donc l'onglet qu'elle revient consulter. Les trois autres sont des sources a
 * parcourir ; celui-ci est ce qu'elle a choisi d'y garder.
 *
 * L'icone de coeur rend l'onglet identifiable sans lire le libelle.
 */
type InspireTab = 'favorites' | 'quotes' | 'affirmations' | 'music';

const TABS: { id: InspireTab; label: string; count?: number; icon?: boolean }[] = [
  { id: 'favorites', label: 'Favoris', icon: true },
  { id: 'quotes', label: 'Citations', count: CONTENT_COUNTS.quotes },
  { id: 'affirmations', label: 'Affirmations', count: CONTENT_COUNTS.affirmations },
  { id: 'music', label: 'Musique', count: CONTENT_COUNTS.music },
];

export default function InspirePage() {
  const [tab, setTab] = useState<InspireTab>('quotes');

  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Inspire"
        title="De quoi nourrir ton elan"
        description={
          CONTENT_COUNTS.quotes +
          ' citations, ' +
          CONTENT_COUNTS.affirmations +
          ' affirmations et ' +
          CONTENT_COUNTS.music +
          ' references musicales. Tout est consultable hors ligne, et rien ne t\'est impose.'
        }
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
            {item.icon && <Heart size={14} aria-hidden="true" />}
            {item.label}
            {item.count !== undefined && <span className="tab-count">{item.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'favorites' && <Favorites />}
      {tab === 'quotes' && <QuoteLibrary />}
      {tab === 'affirmations' && <Affirmations />}
      {tab === 'music' && <MusicInspiration />}
    </div>
  );
}

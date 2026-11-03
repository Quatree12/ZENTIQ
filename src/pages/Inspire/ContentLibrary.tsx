import type { ReactNode } from 'react';
import './Inspire.css';

/**
 * Cadre commun aux sections de contenu.
 *
 * Il porte le compteur et l'ancre d'accessibilité, pour que chaque section
 * annonce clairement ce qu'elle affiche.
 */
export interface ContentLibraryProps {
  tab: 'quotes' | 'affirmations' | 'music' | 'favorites';
  label: string;
  count: number;
  children: ReactNode;
}

export function ContentLibrary({ tab, label, count, children }: ContentLibraryProps) {
  const headingId = `library-${tab}`;

  return (
    <section className="content-library" aria-labelledby={headingId}>
      <header className="content-library__header">
        <div>
          <p className="overline">{label}</p>
          <h2 className="heading-sm" id={headingId}>
            {count === 0 ? 'Aucun élément' : `${count} élément${count > 1 ? 's' : ''}`}
          </h2>
        </div>
      </header>
      {children}
    </section>
  );
}

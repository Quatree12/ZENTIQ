/**
 * En-tête de page.
 *
 * Structure constante sur les cinq espaces : repère de section, titre,
 * description, actions contextuelles. Le titre est un vrai `<h1>` — un seul
 * par page, pour la navigation par titres.
 */
import type { ReactNode } from 'react';
import './PageHeader.css';

export interface PageHeaderProps {
  /** Sur-titre : nom de l'espace. */
  eyebrow: string;
  title: string;
  description?: string;
  /** Actions alignées à droite (bouton principal de la page). */
  actions?: ReactNode;
  /** Contenu additionnel sous l'en-tête (filtres, résumé). */
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__main">
        <div className="page-header__text">
          <p className="overline">{eyebrow}</p>
          <h1 className="page-header__title heading-lg">{title}</h1>
          {description && <p className="page-header__description body-base">{description}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
      {children && <div className="page-header__extra">{children}</div>}
    </header>
  );
}

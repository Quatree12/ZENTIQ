/**
 * États de retour.
 *
 * `EmptyState` — quand il n'y a rien à montrer : toujours une action proposée,
 * jamais un cul-de-sac.
 * `LoadingState` — attente, avec un libellé explicite.
 * `ErrorState` — erreur récupérable, avec une action de reprise.
 * `SuccessMessage` — confirmation d'une action réussie.
 */
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Inbox, Loader2, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/buttons';
import './States.css';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  /** Action principale — l'état vide doit toujours proposer une suite. */
  action?: { label: string; onClick: () => void };
  /** Contenu additionnel sous l'action. */
  children?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="state state--empty">
      <span className="state__icon" aria-hidden="true">
        <Icon size={26} />
      </span>
      <h3 className="state__title heading-sm">{title}</h3>
      <p className="state__description body-base">{description}</p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}

export interface LoadingStateProps {
  label?: string;
  /** Hauteur minimale pour éviter le saut de mise en page. */
  compact?: boolean;
}

export function LoadingState({ label = 'Chargement…', compact = false }: LoadingStateProps) {
  return (
    <div className={compact ? 'state state--loading state--compact' : 'state state--loading'} role="status">
      <Loader2 className="state__spinner" size={22} aria-hidden="true" />
      <p className="body-sm">{label}</p>
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  /** Action de reprise (« Réessayer »). */
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Quelque chose n\'a pas fonctionné',
  message,
  onRetry,
  retryLabel = 'Réessayer',
}: ErrorStateProps) {
  return (
    <div className="state state--error" role="alert">
      <span className="state__icon" aria-hidden="true">
        <AlertTriangle size={24} />
      </span>
      <h3 className="state__title heading-sm">{title}</h3>
      <p className="state__description body-base">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export interface SuccessMessageProps {
  message: string;
  /** Précision secondaire, si utile. */
  detail?: string;
}

export function SuccessMessage({ message, detail }: SuccessMessageProps) {
  return (
    <div className="state state--success" role="status">
      <span className="state__icon" aria-hidden="true">
        <CheckCircle2 size={20} />
      </span>
      <div>
        <p className="state__title-inline">{message}</p>
        {detail && <p className="body-sm">{detail}</p>}
      </div>
    </div>
  );
}

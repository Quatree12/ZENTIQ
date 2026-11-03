/**
 * Indicateurs de progression.
 *
 * `ProgressBar` pour une avancement linéaire, `ProgressRing` pour un
 * pourcentage circulaire. Les deux portent `role="progressbar"` avec les
 * attributs ARIA attendus — la barre est lisible par un lecteur d'écran.
 */
import type { HTMLAttributes } from 'react';
import './Progress.css';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Valeur courante (0..100). */
  value: number;
  /** Étiquette accessible ; sinon un libellé générique est utilisé. */
  label?: string;
  /** Accent visuel. */
  tone?: 'teal' | 'lavender';
  size?: 'sm' | 'md';
}

export function ProgressBar({
  value,
  label,
  tone = 'teal',
  size = 'md',
  className,
  ...rest
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div
      className={['progress-bar', `progress-bar--${tone}`, `progress-bar--${size}`, className ?? '']
        .filter(Boolean)
        .join(' ')}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progression'}
      {...rest}
    >
      <div className="progress-bar__fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  /** Valeur courante (0..100). */
  value: number;
  /** Diamètre en pixels. */
  size?: number;
  /** Épaisseur du trait. */
  thickness?: number;
  label?: string;
  tone?: 'teal' | 'lavender';
}

export function ProgressRing({
  value,
  size = 96,
  thickness = 8,
  label,
  tone = 'teal',
  className,
  children,
  ...rest
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={['progress-ring', `progress-ring--${tone}`, className ?? ''].filter(Boolean).join(' ')}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progression'}
      style={{ width: size, height: size }}
      {...rest}
    >
      <svg width={size} height={size} className="progress-ring__svg" aria-hidden="true">
        <circle
          className="progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
        />
        <circle
          className="progress-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="progress-ring__content">{children ?? <span className="data-value">{clamped}%</span>}</div>
    </div>
  );
}

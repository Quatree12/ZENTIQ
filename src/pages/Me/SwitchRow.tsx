import { useId } from 'react';

/**
 * Interrupteur accessible.
 *
 * Rendu comme `<input type="checkbox" role="switch">` : le clavier, la barre
 * d'espace et les lecteurs d'écran fonctionnent nativement, sans
 * réimplémentation fragile du composant.
 */
export interface SwitchRowProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function SwitchRow({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: SwitchRowProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className={disabled ? 'switch-row is-disabled' : 'switch-row'}>
      <div className="switch-row__text">
        <label className="switch-row__label" htmlFor={id}>
          {label}
        </label>
        {description && (
          <p className="switch-row__description body-sm" id={descriptionId}>
            {description}
          </p>
        )}
      </div>

      <label className="switch">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="switch__input sr-only"
          checked={checked}
          disabled={disabled}
          aria-describedby={description ? descriptionId : undefined}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="switch__track" aria-hidden="true">
          <span className="switch__thumb" />
        </span>
      </label>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { SwitchRow } from './SwitchRow';
import { LoadingState } from '@/components/feedback';
import { useToast } from '@/components/feedback/Toast';
import { useSettings } from '@/hooks/useProfile';
import { formatTime } from '@/utils/formatters';
import type { UserSettings } from '@/types';

/**
 * Préférences.
 *
 * Chaque changement est enregistré immédiatement : pas de bouton « Valider » à
 * oublier. Les préférences visuelles (accent, densité, animations) s'appliquent
 * en direct sur le document.
 *
 * Note honnête : « Texte plus large » est persisté dès maintenant, mais son
 * effet visuel complet relève de la phase accessibilité.
 */
export function Preferences() {
  const { settings, loading, updateSettings, refresh } = useSettings();
  const { notify } = useToast();
  const [localTime, setLocalTime] = useState('08:00');

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (settings) setLocalTime(settings.dailyReminderTime);
  }, [settings]);

  const patch = async (changes: Partial<Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateSettings(changes);
    notify('Préférence enregistrée.', { tone: 'success' });
  };

  if (loading && !settings) return <LoadingState label="Lecture de tes préférences…" compact />;
  if (!settings) return null;

  return (
    <section className="me-section" aria-labelledby="preferences-heading">
      <header>
        <p className="overline">Préférences</p>
        <h2 className="heading-sm" id="preferences-heading">
          Adapter l'application
        </h2>
      </header>

      <div className="pref-group">
        <p className="data-label">Apparence</p>

        <SwitchRow
          label="Accent lavande"
          description="Déplace l'accent principal vers la teinte lavande, plus introspective."
          checked={settings.accentTheme === 'lavender'}
          onChange={(checked) => void patch({ accentTheme: checked ? 'lavender' : 'teal' })}
        />

        <SwitchRow
          label="Affichage compact"
          description="Réduit les espacements pour afficher plus de contenu à l'écran."
          checked={settings.density === 'compact'}
          onChange={(checked) => void patch({ density: checked ? 'compact' : 'comfortable' })}
        />

        <SwitchRow
          label="Réduire les animations"
          description="Les transitions deviennent quasi instantanées. Utile si le mouvement te gêne."
          checked={settings.reduceMotion}
          onChange={(checked) => void patch({ reduceMotion: checked })}
        />
      </div>

      <div className="pref-group">
        <p className="data-label">Confort de lecture et dates</p>

        <SwitchRow
          label="Texte plus large"
          description="Augmente la taille du texte pour les longues lectures. Enregistré dès maintenant ; le rendu complet arrive avec la phase accessibilité."
          checked={settings.largeReadableText}
          onChange={(checked) => void patch({ largeReadableText: checked })}
        />

        <SwitchRow
          label="Semaine commençant le lundi"
          description="Convention suisse et française. Décoche pour commencer le dimanche."
          checked={settings.weekStartsOnMonday}
          onChange={(checked) => void patch({ weekStartsOnMonday: checked })}
        />

        <SwitchRow
          label="Heure sur 24 heures"
          description="Affiche les heures en format 24 h plutôt qu'en 12 h."
          checked={settings.use24HourClock}
          onChange={(checked) => void patch({ use24HourClock: checked })}
        />
      </div>

      <div className="pref-group">
        <p className="data-label">Rappel quotidien</p>

        <SwitchRow
          label="Activer le rappel"
          description="Un message court pour t'inviter à prendre un instant, aux jours choisis."
          checked={settings.dailyReminderEnabled}
          onChange={(checked) => void patch({ dailyReminderEnabled: checked })}
        />

        <label className="pref-field">
          <span className="pref-field__label">Heure du rappel</span>
          <input
            type="time"
            className="input pref-field__control"
            value={localTime}
            onChange={(event) => setLocalTime(event.target.value)}
            onBlur={() => void patch({ dailyReminderTime: localTime })}
            disabled={!settings.dailyReminderEnabled}
          />
          <span className="pref-field__hint body-sm">
            Affiché comme {formatTime(settings.dailyReminderTime, settings.use24HourClock)}.
          </span>
        </label>
      </div>

      <div className="pref-group">
        <p className="data-label">Sauvegarde</p>

        <SwitchRow
          label="Rappel de sauvegarde"
          description="Te suggère d'exporter tes données si tu ne l'as pas fait depuis longtemps."
          checked={settings.autoBackupReminder}
          onChange={(checked) => void patch({ autoBackupReminder: checked })}
        />
      </div>
    </section>
  );
}

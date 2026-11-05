import { useEffect, useState } from 'react';
import { SwitchRow } from './SwitchRow';
import { LoadingState } from '@/components/feedback';
import { useToast } from '@/components/feedback/Toast';
import { useSettings } from '@/hooks/useProfile';
import { formatTime } from '@/utils/formatters';
import type { UserSettings } from '@/types';

/**
 * Preferences.
 *
 * Chaque changement est enregistre immediatement : pas de bouton « Valider » a
 * oublier. Les preferences visuelles (accent, densite, texte plus large,
 * animations) s'appliquent en direct sur le document.
 *
 * PHASE 4.1.6 — LIBELLE CORRIGE
 * -----------------------------
 * Le texte d'aide de « Texte plus large » annoncait que le rendu complet
 * arriverait « avec la phase accessibilite ». C'etait vrai en phase 1, ou la
 * preference etait persistee sans effet. Ce n'est plus le cas : le reglage
 * agrandit reellement tout le texte, d'environ 20 %. Le libelle le dit
 * maintenant, et precise ce qui change.
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
    notify('Preference enregistree.', { tone: 'success' });
  };

  if (loading && !settings) return <LoadingState label="Lecture de tes preferences…" compact />;
  if (!settings) return null;

  return (
    <section className="me-section" aria-labelledby="preferences-heading">
      <header>
        <p className="overline">Preferences</p>
        <h2 className="heading-sm" id="preferences-heading">
          Adapter l'application
        </h2>
      </header>

      <div className="pref-group">
        <p className="data-label">Apparence</p>

        <SwitchRow
          label="Accent lavande"
          description="Deplace l'accent principal vers la teinte lavande, plus introspective."
          checked={settings.accentTheme === 'lavender'}
          onChange={(checked) => void patch({ accentTheme: checked ? 'lavender' : 'teal' })}
        />

        <SwitchRow
          label="Affichage compact"
          description="Reduit les espacements pour afficher plus de contenu a l'ecran."
          checked={settings.density === 'compact'}
          onChange={(checked) => void patch({ density: checked ? 'compact' : 'comfortable' })}
        />

        <SwitchRow
          label="Reduire les animations"
          description="Les transitions deviennent quasi instantanees. Utile si le mouvement te gene."
          checked={settings.reduceMotion}
          onChange={(checked) => void patch({ reduceMotion: checked })}
        />
      </div>

      <div className="pref-group">
        <p className="data-label">Confort de lecture et dates</p>

        <SwitchRow
          label="Texte plus large"
          description="Agrandit tout le texte de l'application d'environ 20 % : titres, paragraphes, boutons et navigation. L'effet est immediat."
          checked={settings.largeReadableText}
          onChange={(checked) => void patch({ largeReadableText: checked })}
        />

        <SwitchRow
          label="Semaine commencant le lundi"
          description="Convention suisse et francaise. Decoche pour commencer le dimanche."
          checked={settings.weekStartsOnMonday}
          onChange={(checked) => void patch({ weekStartsOnMonday: checked })}
        />

        <SwitchRow
          label="Heure sur 24 heures"
          description="Affiche les heures en format 24 h plutot qu'en 12 h."
          checked={settings.use24HourClock}
          onChange={(checked) => void patch({ use24HourClock: checked })}
        />
      </div>

      <div className="pref-group">
        <p className="data-label">Rappel quotidien</p>

        <SwitchRow
          label="Activer le rappel"
          description="Un message court pour t'inviter a prendre un instant, aux jours choisis."
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
            Affiche comme {formatTime(settings.dailyReminderTime, settings.use24HourClock)}.
          </span>
        </label>
      </div>

      <div className="pref-group">
        <p className="data-label">Sauvegarde</p>

        <SwitchRow
          label="Rappel de sauvegarde"
          description="Te suggere d'exporter tes donnees si tu ne l'as pas fait depuis longtemps."
          checked={settings.autoBackupReminder}
          onChange={(checked) => void patch({ autoBackupReminder: checked })}
        />
      </div>
    </section>
  );
}

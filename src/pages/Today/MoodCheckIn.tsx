import { MOOD_LABELS, MOOD_LEVELS, type MoodLevel } from '@/types';
import { Button } from '@/components/buttons';
import { Textarea } from '@/components/inputs';
import { LoadingState } from '@/components/feedback';
import { useToast } from '@/components/feedback/Toast';
import { useMood } from '@/hooks/useMood';
import { appConfig } from '@/app/app-config';
import { useEffect, useState } from 'react';
import './MoodCheckIn.css';

/**
 * Check-in d'humeur.
 *
 * Cinq niveaux, sans jugement : chaque libellé décrit un état, il ne le note
 * pas. Une note libre est proposée, jamais imposée, et l'utilisateur peut
 * corriger son ressenti à tout moment dans la journée.
 */
export function MoodCheckIn() {
  const { todayEntry, saveToday, loading, saving, refresh } = useMood();
  const { notify } = useToast();

  const [selected, setSelected] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState('');

  // Charge l'entrée du jour au premier montage.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Reflète l'entrée existante dans le formulaire.
  useEffect(() => {
    if (todayEntry) {
      setSelected(todayEntry.mood);
      setNote(todayEntry.note);
    }
  }, [todayEntry]);

  const handleSubmit = async () => {
    if (selected === null) return;
    const ok = await saveToday(selected, note);
    if (ok) {
      notify('Humeur notée pour aujourd\'hui.', { tone: 'success' });
    } else {
      notify("Le check-in n'a pas pu être enregistré.", { tone: 'error' });
    }
  };

  if (loading && !todayEntry) {
    return (
      <div className="mood-checkin">
        <LoadingState label="Lecture de ton humeur du jour…" compact />
      </div>
    );
  }

  return (
    <section className="mood-checkin" aria-labelledby="mood-checkin-title">
      <header className="mood-checkin__header">
        <p className="overline">Check-in</p>
        <h2 className="heading-sm" id="mood-checkin-title">
          {todayEntry ? 'Comment te sens-tu maintenant ?' : 'Comment te sens-tu aujourd\'hui ?'}
        </h2>
        <p className="body-sm">
          Il n'y a pas de bonne réponse. Tu peux modifier ce ressenti plus tard dans la journée.
        </p>
      </header>

      <div className="mood-scale" role="radiogroup" aria-label="Niveau d'humeur">
        {MOOD_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selected === level}
            className={selected === level ? 'mood-option is-selected' : 'mood-option'}
            data-mood={level}
            onClick={() => setSelected(level)}
          >
            <span className="mood-option__dot" aria-hidden="true" />
            <span className="mood-option__label">{MOOD_LABELS[level]}</span>
          </button>
        ))}
      </div>

      <Textarea
        label="Une note, si tu le souhaites"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ce qui a marqué ta journée, en quelques mots…"
        counterMax={appConfig.limits.moodNoteMaxLength}
        maxLength={appConfig.limits.moodNoteMaxLength}
        rows={3}
      />

      <div className="mood-checkin__actions">
        <Button
          variant="primary"
          onClick={() => void handleSubmit()}
          loading={saving}
          disabled={selected === null}
        >
          {todayEntry ? 'Mettre à jour' : 'Enregistrer'}
        </Button>
        {todayEntry && (
          <span className="body-sm">Humeur notée : {MOOD_LABELS[todayEntry.mood]}</span>
        )}
      </div>
    </section>
  );
}

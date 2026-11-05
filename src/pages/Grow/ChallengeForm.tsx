/**
 * Formulaire de creation d'un challenge.
 *
 * Les cinq durees proposees sont celles du brief (3, 7, 14, 21, 30). La
 * validation est explicite : le bouton reste desactive tant que le nom manque,
 * et les messages d'erreur disent quoi corriger, pas seulement que c'est faux.
 */
import { useId, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Input, Textarea } from '@/components/inputs';
import { useToast } from '@/components/feedback/Toast';
import type { CreateChallengeInput } from '@/database/repositories';
import { CHALLENGE_DURATIONS } from '@/types';
import { firstError, maxLength } from '@/utils/validators';
import { todayKey } from '@/utils/dates';

/** Suggestions d'etapes, pour ne pas laisser l'utilisateur devant une page blanche. */
const STEP_SUGGESTIONS: Record<number, string[]> = {
  3: ["Observer ce qui m'entoure", 'Faire une chose utile', 'Nommer ce que j\'ai appris'],
  7: [
    'Definir mon intention',
    'Faire un premier pas',
    'Tenir un deuxieme jour',
    'Remarquer ce qui change',
    'Ajuster si besoin',
    'Faire un pas de plus',
    'Relire la semaine',
  ],
  14: Array.from({ length: 14 }, (_, index) => 'Etape ' + (index + 1)),
  21: Array.from({ length: 21 }, (_, index) => 'Etape ' + (index + 1)),
  30: Array.from({ length: 30 }, (_, index) => 'Etape ' + (index + 1)),
};

export interface ChallengeFormProps {
  onSubmit: (input: CreateChallengeInput) => Promise<boolean>;
  onCancel: () => void;
}

export function ChallengeForm({ onSubmit, onCancel }: ChallengeFormProps) {
  const { notify } = useToast();
  const formId = useId();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState<number>(7);
  const [startDate, setStartDate] = useState(todayKey());
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const titleError = firstError(
    title.trim().length === 0 ? 'Donne un nom a ton challenge.' : null,
    maxLength(title, 80, 'Le nom'),
  );

  const handleSubmit = async () => {
    setTouched(true);
    if (titleError) return;

    setSaving(true);
    const ok = await onSubmit({
      title,
      description,
      goal,
      durationDays: duration,
      startDate,
      steps: STEP_SUGGESTIONS[duration],
    });
    setSaving(false);

    if (ok) {
      notify('Challenge cree.', { tone: 'success', detail: title + ' — ' + duration + ' jours' });
    } else {
      notify("Le challenge n'a pas pu etre cree.", { tone: 'error' });
    }
  };

  return (
    <form
      className="challenge-form"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <Input
        label="Nom du challenge"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Ex. 7 jours sans ecran le matin"
        error={touched ? titleError : null}
        maxLength={80}
        required
      />

      <Textarea
        label="Description (facultatif)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Ce que tu veux changer, en quelques mots…"
        rows={2}
      />

      <Input
        label="Ton objectif (facultatif)"
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
        placeholder="Pourquoi tu le fais"
        hint="Une phrase que tu pourras relire les jours difficiles."
      />

      <fieldset className="challenge-form__durations">
        <legend className="field__label">Duree</legend>
        <div className="row-wrap">
          {CHALLENGE_DURATIONS.map((value) => (
            <button
              key={value}
              type="button"
              className={duration === value ? 'filter-chip is-active' : 'filter-chip'}
              aria-pressed={duration === value}
              onClick={() => setDuration(value)}
            >
              {value} jours
            </button>
          ))}
        </div>
      </fieldset>

      <Input
        label="Premier jour"
        id={formId + '-start'}
        type="date"
        value={startDate}
        onChange={(event) => setStartDate(event.target.value)}
        hint="Tu peux commencer aujourd'hui ou plus tard."
      />

      <p className="body-sm challenge-form__note">
        <Sparkles size={14} aria-hidden="true" /> Les etapes sont pre-remplies : tu pourras les
        suivre une par une, et rattraper une journee manquee quand tu veux.
      </p>

      <div className="row-wrap">
        <Button variant="tertiary" onClick={onCancel} type="button">
          Annuler
        </Button>
        <Button variant="primary" type="submit" loading={saving} disabled={Boolean(titleError)}>
          Creer le challenge
        </Button>
      </div>
    </form>
  );
}

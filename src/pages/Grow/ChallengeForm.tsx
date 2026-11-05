/**
 * Formulaire de creation d'un challenge.
 *
 * Les cinq durees proposees sont celles du brief (3, 7, 14, 21, 30).
 *
 * PHASE 4.1.7 — CORRECTIF DU SELECTEUR DE DUREE SUR MOBILE
 * --------------------------------------------------------
 * Les boutons de duree existaient et etaient bien de type="button", donc ils
 * ne soumettaient pas le formulaire. Le probleme constate sur iPhone etait
 * ailleurs : le CLAVIER ouvert occupait la moitie basse de l'ecran, et la zone
 * des durees se trouvait dessous. Le toucher partait au clavier.
 *
 * Trois protections ajoutees :
 *   1. `onPointerDown` traite la selection AVANT tout blur du clavier.
 *      Sur Safari iOS, `onClick` arrive apres le blur et peut etre perdu.
 *   2. Les boutons portent une cible tactile explicite (48 px) et
 *      `touch-action: manipulation`, qui supprime le delai de 300 ms.
 *   3. Le conteneur defile jusqu'au bouton touche, pour qu'il reste visible
 *      une fois le clavier referme.
 *
 * Sur desktop, aucun clavier a refermer : le comportement est inchange.
 */
import { useId, useRef, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
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
  const durationsRef = useRef<HTMLFieldSetElement>(null);

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

  /**
   * Selection d'une duree.
   *
   * Appelee depuis `onPointerDown` : on referme d'abord le clavier, puis on
   * laisse le navigateur traiter le tap. Le blur explicite evite que le focus
   * reste dans le champ de saisie et rouvre le clavier.
   */
  const selectDuration = (value: number) => {
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    }
    setDuration(value);

    // Le bouton reste visible une fois le clavier referme.
    durationsRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

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

      <fieldset className="challenge-form__durations" ref={durationsRef}>
        <legend className="field__label">Duree</legend>
        <div className="challenge-form__chips">
          {CHALLENGE_DURATIONS.map((value) => {
            const isActive = duration === value;
            return (
              <button
                key={value}
                type="button"
                className={isActive ? 'duration-chip is-active' : 'duration-chip'}
                aria-pressed={isActive}
                onPointerDown={(event) => {
                  // Traite avant tout blur declenche par le clic.
                  event.preventDefault();
                  selectDuration(value);
                }}
                onClick={(event) => {
                  // Repli pour les navigateurs sans Pointer Events.
                  event.preventDefault();
                  if (typeof PointerEvent === 'undefined') selectDuration(value);
                }}
              >
                {isActive && <Check size={14} aria-hidden="true" />}
                {value} jours
              </button>
            );
          })}
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

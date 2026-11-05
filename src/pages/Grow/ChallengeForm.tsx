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
 * JALONS — trois propositions, jamais imposees
 * --------------------------------------------
 * Les jalons proposes sont CALCULES sur la duree choisie : un jalon « la
 * moitie du chemin » sur un 7 jours couvre le jour 4, sur un 30 jours couvre le
 * jour 15. L'utilisateur peut decocher ceux qu'il ne veut pas ; un challenge
 * sans jalon reste parfaitement valide.
 *
 * Les jalons ne sont pas des recompenses : chacun se franchit quand ses etapes
 * sont reellement faites, et la date est relevee sur les etapes elles-memes.
 */
import { useId, useMemo, useRef, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Input, Textarea } from '@/components/inputs';
import { useToast } from '@/components/feedback/Toast';
import type { CreateChallengeInput } from '@/database/repositories';
import { CHALLENGE_DURATIONS, CHALLENGE_RHYTHM_LABELS, type ChallengeRhythm } from '@/types';
import { firstError, maxLength } from '@/utils/validators';
import { todayKey } from '@/utils/dates';

/** Suggestions d'etapes, pour ne pas laisser l'utilisateur devant une page blanche. */
const STEP_SUGGESTIONS: Record<number, string[]> = {
  3: ["Observer ce qui m'entoure", 'Faire une chose utile', "Nommer ce que j'ai appris"],
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

/** Rythmes proposes, dans l'ordre du plus simple au plus souple. */
const RHYTHMS: ChallengeRhythm[] = ['once', 'recurring', 'milestones'];

/**
 * Jalons suggeres pour une duree donnee.
 *
 * Trois jalons : un premier tiers, la moitie du chemin, et la derniere ligne
 * droite. Les numeros sont calcules, arrondis a l'entier, et bornes a la duree —
 * un jalon au-dela du dernier jour ne serait jamais franchi.
 */
function suggestMilestones(duration: number): Array<{ title: string; throughDay: number }> {
  if (duration < 3) return [];
  const clamp = (value: number) => Math.min(Math.max(1, value), duration);
  return [
    { title: 'Premier tiers', throughDay: clamp(Math.round(duration / 3)) },
    { title: 'Moitie du chemin', throughDay: clamp(Math.round(duration / 2)) },
    { title: 'Derniere ligne droite', throughDay: clamp(duration - 1) },
  ];
}

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
  const [rhythm, setRhythm] = useState<ChallengeRhythm>('once');
  const [targetPerPeriod, setTargetPerPeriod] = useState<number>(3);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  // Jalons proposes pour la duree courante, et ceux que l'utilisateur garde.
  const suggested = useMemo(() => suggestMilestones(duration), [duration]);
  const [keptMilestones, setKeptMilestones] = useState<number[]>([0, 1, 2]);

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
    // La duree change : les jalons proposes changent aussi. On repart des trois
    // propositions, sinon les anciens index ne designeraient plus les memes jours.
    setKeptMilestones([0, 1, 2]);

    durationsRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const toggleMilestone = (index: number) => {
    setKeptMilestones((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index].sort(),
    );
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
      rhythm,
      targetPerPeriod: rhythm === 'recurring' ? targetPerPeriod : undefined,
      milestones: suggested.filter((_, index) => keptMilestones.includes(index)),
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
                  event.preventDefault();
                  selectDuration(value);
                }}
                onClick={(event) => {
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

      {/* --- Rythme ------------------------------------------------------- */}
      <fieldset className="challenge-form__rhythm">
        <legend className="field__label">Rythme</legend>
        <div className="challenge-form__chips">
          {RHYTHMS.map((value) => {
            const isActive = rhythm === value;
            return (
              <button
                key={value}
                type="button"
                className={isActive ? 'rhythm-chip is-active' : 'rhythm-chip'}
                aria-pressed={isActive}
                onPointerDown={(event) => {
                  event.preventDefault();
                  if (typeof document !== 'undefined') {
                    const active = document.activeElement;
                    if (active instanceof HTMLElement) active.blur();
                  }
                  setRhythm(value);
                }}
                onClick={(event) => {
                  event.preventDefault();
                  if (typeof PointerEvent === 'undefined') setRhythm(value);
                }}
              >
                {isActive && <Check size={14} aria-hidden="true" />}
                {CHALLENGE_RHYTHM_LABELS[value]}
              </button>
            );
          })}
        </div>
        <p className="body-sm">
          {rhythm === 'once'
            ? 'Un parcours suivi : tu avances jour apres jour.'
            : rhythm === 'recurring'
              ? 'Un nombre de fois vise par semaine. Manquer un jour ne remet rien a zero.'
              : 'Tu avances par etapes franchies, sans contrainte de calendrier.'}
        </p>

        {rhythm === 'recurring' && (
          <Input
            label="Seances visees par semaine"
            type="number"
            min={1}
            max={7}
            value={String(targetPerPeriod)}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              setTargetPerPeriod(Number.isFinite(parsed) ? Math.min(7, Math.max(1, parsed)) : 3);
            }}
            hint="Un objectif souple : c'est un cap, pas un quota."
          />
        )}
      </fieldset>

      {/* --- Jalons ------------------------------------------------------- */}
      {suggested.length > 0 && (
        <fieldset className="challenge-form__milestones">
          <legend className="field__label">Jalons</legend>
          <p className="body-sm">
            Trois reperes sur le chemin. Chacun se franchit quand les etapes qu'il couvre sont
            faites. Decoche ceux dont tu ne veux pas.
          </p>
          <ul className="milestone-picker">
            {suggested.map((milestone, index) => {
              const kept = keptMilestones.includes(index);
              return (
                <li key={milestone.title + index}>
                  <button
                    type="button"
                    className={kept ? 'milestone-chip is-active' : 'milestone-chip'}
                    aria-pressed={kept}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      if (typeof document !== 'undefined') {
                        const active = document.activeElement;
                        if (active instanceof HTMLElement) active.blur();
                      }
                      toggleMilestone(index);
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      if (typeof PointerEvent === 'undefined') toggleMilestone(index);
                    }}
                  >
                    <span className="milestone-chip__check" aria-hidden="true">
                      {kept && <Check size={14} />}
                    </span>
                    <span className="milestone-chip__text">
                      <span className="milestone-chip__title">{milestone.title}</span>
                      <span className="body-sm">jusqu'au jour {milestone.throughDay}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

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

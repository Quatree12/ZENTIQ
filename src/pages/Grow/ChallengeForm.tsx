/**
 * Formulaire de création d'un challenge.
 *
 * Les cinq durées proposées sont celles du brief (3, 7, 14, 21, 30).
 *
 * JALONS — trois propositions, jamais imposées
 * --------------------------------------------
 * Les jalons proposés sont CALCULÉS sur la durée choisie : un jalon « la
 * moitié du chemin » sur un 7 jours couvre le jour 4, sur un 30 jours couvre le
 * jour 15. L'utilisateur peut décocher ceux qu'il ne veut pas ; un challenge
 * sans jalon reste parfaitement valide.
 *
 * LES TITRES PROPOSÉS SONT EN FRANÇAIS CORRECT. Ils partent tels quels en base :
 * un accent oublié ici resterait dans les jalons de l'utilisateur pour toujours,
 * et aucun correctif d'affichage ne pourrait le rattraper. C'est exactement ce
 * qui s'est produit avec « Moitie du chemin » — la faute était dans la source,
 * pas dans le rendu.
 *
 * CHAMP « SÉANCES VISÉES » — CORRECTIF DE SAISIE
 * ----------------------------------------------
 * Le champ était piloté par un nombre, et borner à chaque frappe rendait la
 * saisie impossible : vider le champ produit la chaîne vide, `Number('')` vaut
 * 0, et le `Math.max(1, 0)` du onChange reposait aussitôt « 1 ».
 *
 * Le champ est désormais en TEXTE LIBRE pendant la frappe — seul le chiffre a
 * une signification — et les bornes (1 à 7) sont appliquées à la SORTIE du
 * champ, pas à chaque touche.
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

/** Suggestions d'étapes, pour ne pas laisser l'utilisateur devant une page blanche. */
const STEP_SUGGESTIONS: Record<number, string[]> = {
  3: ["Observer ce qui m'entoure", 'Faire une chose utile', "Nommer ce que j'ai appris"],
  7: [
    'Définir mon intention',
    'Faire un premier pas',
    'Tenir un deuxième jour',
    'Remarquer ce qui change',
    'Ajuster si besoin',
    'Faire un pas de plus',
    'Relire la semaine',
  ],
  14: Array.from({ length: 14 }, (_, index) => 'Étape ' + (index + 1)),
  21: Array.from({ length: 21 }, (_, index) => 'Étape ' + (index + 1)),
  30: Array.from({ length: 30 }, (_, index) => 'Étape ' + (index + 1)),
};

/** Rythmes proposés, dans l'ordre du plus simple au plus souple. */
const RHYTHMS: ChallengeRhythm[] = ['once', 'recurring', 'milestones'];

/** Bornes du nombre de séances visées par semaine. */
const MIN_PER_WEEK = 1;
const MAX_PER_WEEK = 7;

/**
 * Jalons suggérés pour une durée donnée.
 *
 * Trois jalons : un premier tiers, la moitié du chemin, et la dernière ligne
 * droite. Les numéros sont calculés, arrondis à l'entier, et bornés à la durée.
 */
function suggestMilestones(duration: number): Array<{ title: string; throughDay: number }> {
  if (duration < 3) return [];
  const clamp = (value: number) => Math.min(Math.max(1, value), duration);
  return [
    { title: 'Premier tiers', throughDay: clamp(Math.round(duration / 3)) },
    { title: 'Moitié du chemin', throughDay: clamp(Math.round(duration / 2)) },
    { title: 'Dernière ligne droite', throughDay: clamp(duration - 1) },
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
  /**
   * Saisie BRUTE du nombre de séances, gardée en texte.
   * Le champ peut donc être vide pendant la frappe : c'est ce qui rend la
   * saisie possible. La conversion et les bornes se font à la sortie du champ.
   */
  const [perWeekInput, setPerWeekInput] = useState('3');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const suggested = useMemo(() => suggestMilestones(duration), [duration]);
  const [keptMilestones, setKeptMilestones] = useState<number[]>([0, 1, 2]);

  const titleError = firstError(
    title.trim().length === 0 ? 'Donne un nom à ton challenge.' : null,
    maxLength(title, 80, 'Le nom'),
  );

  /** Nombre de séances effectif, borné. Utilisé à la soumission. */
  const perWeek = clampPerWeek(perWeekInput);

  /**
   * Applique les bornes quand l'utilisateur quitte le champ.
   * On réécrit la valeur affichée pour qu'elle corresponde à ce qui sera
   * réellement enregistré — sinon le champ pourrait montrer « 12 » alors que
   * c'est 7 qui part en base.
   */
  const commitPerWeek = () => {
    setPerWeekInput(String(clampPerWeek(perWeekInput)));
  };

  const selectDuration = (value: number) => {
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    }
    setDuration(value);
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
      targetPerPeriod: rhythm === 'recurring' ? perWeek : undefined,
      milestones: suggested.filter((_, index) => keptMilestones.includes(index)),
    });
    setSaving(false);

    if (ok) {
      notify('Challenge créé.', { tone: 'success', detail: title + ' — ' + duration + ' jours' });
    } else {
      notify("Le challenge n'a pas pu être créé.", { tone: 'error' });
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
        placeholder="Ex. 7 jours sans écran le matin"
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
        <legend className="field__label">Durée</legend>
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
            ? 'Un parcours suivi : tu avances jour après jour.'
            : rhythm === 'recurring'
              ? 'Un nombre de fois visé par semaine. Manquer un jour ne remet rien à zéro.'
              : 'Tu avances par étapes franchies, sans contrainte de calendrier.'}
        </p>

        {rhythm === 'recurring' && (
          <Input
            label="Séances visées par semaine"
            /* `text` et non `number` : un champ numérique vide est difficile à
               saisir sur mobile, et le navigateur y impose ses propres bornes.
               On filtre nous-mêmes les caractères non numériques. */
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={perWeekInput}
            onChange={(event) => {
              // On ne garde que les chiffres : ni signe, ni séparateur, ni
              // lettre. Le champ peut rester vide pendant la frappe.
              const digits = event.target.value.replace(/[^0-9]/g, '').slice(0, 2);
              setPerWeekInput(digits);
            }}
            onBlur={commitPerWeek}
            hint={
              'De ' +
              MIN_PER_WEEK +
              ' à ' +
              MAX_PER_WEEK +
              ' par semaine. Un objectif souple : c\'est un cap, pas un quota.'
            }
          />
        )}
      </fieldset>

      {suggested.length > 0 && (
        <fieldset className="challenge-form__milestones">
          <legend className="field__label">Jalons</legend>
          <p className="body-sm">
            Trois repères sur le chemin. Chacun se franchit quand les étapes qu'il couvre sont
            faites. Décoche ceux dont tu ne veux pas.
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
        <Sparkles size={14} aria-hidden="true" /> Les étapes sont pré-remplies : tu pourras les
        suivre une par une, et rattraper une journée manquée quand tu veux.
      </p>

      <div className="row-wrap">
        <Button variant="tertiary" onClick={onCancel} type="button">
          Annuler
        </Button>
        <Button variant="primary" type="submit" loading={saving} disabled={Boolean(titleError)}>
          Créer le challenge
        </Button>
      </div>
    </form>
  );
}

/**
 * Convertit la saisie en nombre de séances borné.
 *
 * Un champ vide retombe sur la valeur par défaut (3) plutôt que sur 0 : un
 * utilisateur qui efface sans retaper ne doit pas se retrouver avec un objectif
 * nul enregistré à son insu.
 */
function clampPerWeek(input: string): number {
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || input.trim() === '') return 3;
  return Math.min(MAX_PER_WEEK, Math.max(MIN_PER_WEEK, parsed));
}

import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Quote as QuoteIcon, Sparkles, Sun, Target } from 'lucide-react';
import { Card, EditorialCard } from '@/components/cards';
import { Badge } from '@/components/badges';
import { IconButton } from '@/components/buttons';
import { ProgressRing } from '@/components/progress';
import { useToast } from '@/components/feedback/Toast';
import { useFavorites } from '@/hooks/useProfile';
import { useMood } from '@/hooks/useMood';
import { useGoals } from '@/hooks/useGoals';
import { useHabits } from '@/hooks/useHabits';
import {
  affirmationOfTheDay,
  quoteOfTheDay,
} from '@/content/library';
import { INSPIRATION_CATEGORY_LABELS, MOOD_LABELS } from '@/types';
import { todayKey, formatRelativeDateKey } from '@/utils/dates';
import { useNavigate } from 'react-router-dom';

/**
 * Inspiration du jour, check-in d'humeur, progression et raccourcis.
 *
 * L'inspiration est DÉTERMINISTE : elle dépend de la date, pas du hasard. Deux
 * ouvertures le même jour donnent la même citation, et elle change à minuit.
 * C'est ce qui rend le « mot du jour » crédible.
 */
export function DailyInspiration() {
  const today = todayKey();
  const { notify } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const quote = useMemo(() => quoteOfTheDay(today), [today]);
  const affirmation = useMemo(() => affirmationOfTheDay(today), [today]);

  const quoteKey = 'quote:' + quote.id;
  const quoteIsFavorite = isFavorite('quote', quote.id);

  const handleToggle = async () => {
    await toggleFavorite('quote', quote.id);
    notify(quoteIsFavorite ? 'Retirée des favoris.' : 'Ajoutée aux favoris.', {
      tone: 'success',
    });
  };

  return (
    <section className="today-inspiration" aria-labelledby="today-inspiration-heading">
      <EditorialCard
        eyebrow="Inspiration du jour"
        text={quote.text}
        attribution={quote.author}
        footer={
          <div className="row-between">
            <Badge tone="accent">{INSPIRATION_CATEGORY_LABELS[quote.category]}</Badge>
            <IconButton
              label={quoteIsFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              accent="teal"
              active={quoteIsFavorite}
              onClick={() => void handleToggle()}
            >
              <QuoteIcon size={16} />
            </IconButton>
          </div>
        }
      />

      <Card compact className="today-affirmation">
        <p className="overline">Affirmation du jour</p>
        <p className="today-affirmation__text">{affirmation.text}</p>
        <div className="row-wrap">
          <Badge>{INSPIRATION_CATEGORY_LABELS[affirmation.category]}</Badge>
        </div>
      </Card>
      {/* La clé `quoteKey` sert au futur bloc de favoris partagés. */}
      <span className="sr-only" aria-hidden="true">
        {quoteKey}
      </span>
    </section>
  );
}

/**
 * Check-in d'humeur du jour.
 *
 * Un seul geste : choisir un niveau. Une note libre reste possible, mais rien
 * n'est obligatoire — l'écran ne doit jamais ressembler à un formulaire.
 */
export function MoodCheckIn() {
  const { mood, isCheckedIn, setMood, saving } = useMood();
  const { notify } = useToast();
  const [note, setNote] = useState('');

  const handleSelect = async (level: 1 | 2 | 3 | 4 | 5) => {
    const ok = await setMood({ mood: level, note });
    if (ok) {
      notify('Humeur enregistrée.', { tone: 'success', detail: MOOD_LABELS[level] });
    } else {
      notify("L'humeur n'a pas pu être enregistrée.", { tone: 'error' });
    }
  };

  return (
    <Card compact className="today-mood" aria-labelledby="today-mood-heading">
      <div className="row-between">
        <div>
          <p className="overline">Humeur du jour</p>
          <h2 className="heading-sm" id="today-mood-heading">
            {isCheckedIn ? 'Déjà notée aujourd\'hui' : 'Comment te sens-tu ?'}
          </h2>
        </div>
        {mood && <Badge tone="accent">{MOOD_LABELS[mood.mood]}</Badge>}
      </div>

      <div className="mood-scale" role="group" aria-label="Choisir ton humeur">
        {([1, 2, 3, 4, 5] as const).map((level) => {
          const active = mood?.mood === level;
          return (
            <button
              key={level}
              type="button"
              className={active ? 'mood-chip is-active' : 'mood-chip'}
              aria-pressed={active}
              onClick={() => void handleSelect(level)}
              disabled={saving}
            >
              <span className="mood-chip__dot" aria-hidden="true" />
              <span className="mood-chip__label">{MOOD_LABELS[level]}</span>
            </button>
          );
        })}
      </div>

      <p className="body-sm">
        {isCheckedIn
          ? 'Tu peux ajuster ton ressenti à tout moment. Aucun jugement ici.'
          : 'Un seul geste suffit. Rien n\'est obligatoire.'}
      </p>
    </Card>
  );
}

/**
 * Progression personnelle du jour.
 *
 * Tous les chiffres viennent des données réelles : aucune valeur n'est
 * générée pour remplir la carte.
 */
export function TodayProgress() {
  const { goals } = useGoals();
  const { habits } = useHabits();

  const goalsDone = goals.filter((goal) => goal.status === 'completed').length;
  const goalsActive = goals.filter((goal) => goal.status === 'active').length;
  const habitsDone = habits.filter((habit) => habit.doneToday).length;

  const ringValue = habits.length > 0 ? Math.round((habitsDone / habits.length) * 100) : 0;

  return (
    <Card compact className="today-progress" aria-labelledby="today-progress-heading">
      <p className="overline">Progression</p>
      <h2 className="heading-sm" id="today-progress-heading">
        Où tu en es
      </h2>

      <div className="today-progress__body">
        <ProgressRing value={ringValue} label="Habitudes cochées aujourd'hui" />
        <dl className="today-progress__stats">
          <div>
            <dt className="data-label">Habitudes</dt>
            <dd className="data-value">
              {habitsDone} / {habits.length}
            </dd>
          </div>
          <div>
            <dt className="data-label">Objectifs</dt>
            <dd className="data-value">
              {goalsActive} actifs · {goalsDone} atteints
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}

/** Raccourcis vers les autres espaces. */
export function TodayShortcuts() {
  const navigate = useNavigate();

  return (
    <section className="today-shortcuts" aria-labelledby="today-shortcuts-heading">
      <p className="overline" id="today-shortcuts-heading">
        Raccourcis
      </p>
      <ul className="today-shortcuts__list">
        <li>
          <button type="button" className="shortcut" onClick={() => navigate('/inspire')}>
            <span className="shortcut__icon" aria-hidden="true">
              <BookOpen size={18} />
            </span>
            <span className="shortcut__text">
              <span className="shortcut__label">Inspire</span>
              <span className="body-sm">Citations et affirmations</span>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </li>
        <li>
          <button type="button" className="shortcut" onClick={() => navigate('/grow')}>
            <span className="shortcut__icon" aria-hidden="true">
              <Target size={18} />
            </span>
            <span className="shortcut__text">
              <span className="shortcut__label">Grow</span>
              <span className="body-sm">Objectifs et habitudes</span>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </li>
        <li>
          <button type="button" className="shortcut" onClick={() => navigate('/journey')}>
            <span className="shortcut__icon" aria-hidden="true">
              <Sun size={18} />
            </span>
            <span className="shortcut__text">
              <span className="shortcut__label">Journey</span>
              <span className="body-sm">Journal et humeurs</span>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </li>
      </ul>
    </section>
  );
}

/** Ré-export : `TodayPage` importe les trois blocs d'ici. */
export { Sparkles, formatRelativeDateKey };

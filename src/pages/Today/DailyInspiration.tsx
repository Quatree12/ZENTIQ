import { Card, EditorialCard } from '@/components/cards';
import { Button } from '@/components/buttons';
import { Badge } from '@/components/badges';
import { IconButton } from '@/components/buttons';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Sprout } from 'lucide-react';
import { useToast } from '@/components/feedback/Toast';
import { useProfile, useFavorites } from '@/hooks/useProfile';
import { affirmationOfTheDay, quoteOfTheDay } from '@/content/library';
import { INSPIRATION_CATEGORY_LABELS } from '@/types';
import { todayKey } from '@/utils/dates';
import { useTodaySummary } from './useTodaySummary';
import './Today.css';

/**
 * Inspiration du jour : une citation et une affirmation, choisies de façon
 * stable pour la date. La citation peut être mise en favori depuis l'accueil.
 */
export function DailyInspiration() {
  const dayKey = todayKey();
  const quote = quoteOfTheDay(dayKey);
  const affirmation = affirmationOfTheDay(dayKey);
  const { notify } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleToggle = async () => {
    const wasFavorite = isFavorite('quote', quote.id);
    await toggleFavorite('quote', quote.id);
    notify(wasFavorite ? 'Retiré des favoris.' : 'Ajouté aux favoris.', {
      tone: 'success',
      detail: quote.text,
    });
  };

  return (
    <div className="stack">
      <EditorialCard
        eyebrow="Inspiration du jour"
        text={quote.text}
        attribution={quote.author}
        footer={
          <>
            <Badge tone="lavender">{INSPIRATION_CATEGORY_LABELS[quote.category]}</Badge>
            <IconButton
              label={
                isFavorite('quote', quote.id)
                  ? 'Retirer des favoris'
                  : 'Ajouter aux favoris'
              }
              accent="lavender"
              active={isFavorite('quote', quote.id)}
              onClick={() => void handleToggle()}
            >
              <Heart size={16} />
            </IconButton>
          </>
        }
      />

      {/* L'affirmation du jour accompagne la citation, en retrait visuel. */}
      <Card compact accent="teal">
        <p className="overline">Affirmation du jour</p>
        <p className="inspire-item__affirmation">{affirmation.text}</p>
      </Card>
    </div>
  );
}

/**
 * Raccourcis vers les espaces voisins.
 * Chacun mène réellement quelque part : aucun bouton décoratif.
 */
export function TodayShortcuts() {
  const navigate = useNavigate();

  return (
    <div className="grid-2">
      <Card accent="lavender" className="today-shortcut">
        <span className="today-shortcut__icon" aria-hidden="true">
          <Compass size={18} />
        </span>
        <h3 className="heading-sm">Piocher de l'inspiration</h3>
        <p className="body-sm">
          Citations, affirmations et références musicales à parcourir quand tu cherches un élan.
        </p>
        <Button
          variant="tertiary"
          trailingIcon={<ArrowRight size={16} />}
          onClick={() => navigate('/inspire')}
        >
          Ouvrir Inspire
        </Button>
      </Card>

      <Card accent="teal" className="today-shortcut">
        <span className="today-shortcut__icon" aria-hidden="true">
          <Sprout size={18} />
        </span>
        <h3 className="heading-sm">Avancer sur un objectif</h3>
        <p className="body-sm">
          Tes objectifs, tes habitudes du jour et leur progression, réunis au même endroit.
        </p>
        <Button
          variant="tertiary"
          trailingIcon={<ArrowRight size={16} />}
          onClick={() => navigate('/grow')}
        >
          Ouvrir Grow
        </Button>
      </Card>
    </div>
  );
}

/**
 * Progression personnelle du jour.
 *
 * Le résumé s'adapte à ce qui existe : coches d'habitudes, humeur du jour,
 * objectifs en cours. Aucune valeur n'est affichée si elle n'a pas de source.
 */
export function TodayProgress() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { goalsCount, habitsDone, habitsTotal, hasMood, loading } = useTodaySummary();

  const firstName = profile?.firstName.trim();

  return (
    <Card compact className="today-progress">
      <div className="row-between">
        <div>
          <p className="overline">Ta journée</p>
          <h2 className="heading-sm">
            {firstName ? firstName + ', voici où tu en es.' : 'Voici où tu en es.'}
          </h2>
        </div>
      </div>

      <dl className="today-progress__stats">
        <div className="today-stat">
          <dt className="data-label">Habitudes</dt>
          <dd className="data-value">
            {loading ? '—' : habitsDone + ' / ' + habitsTotal}
          </dd>
        </div>
        <div className="today-stat">
          <dt className="data-label">Objectifs actifs</dt>
          <dd className="data-value">{loading ? '—' : goalsCount}</dd>
        </div>
        <div className="today-stat">
          <dt className="data-label">Humeur du jour</dt>
          <dd className="data-value">{loading ? '—' : hasMood ? 'Notée' : 'À noter'}</dd>
        </div>
      </dl>

      <Button variant="secondary" size="sm" onClick={() => navigate('/journey')}>
        Voir mon évolution
      </Button>
    </Card>
  );
}

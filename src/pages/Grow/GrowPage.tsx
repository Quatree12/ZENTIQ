import { PageHeader } from '@/layouts/PageHeader';
import { Goals } from './Goals';
import { Habits } from './Habits';
import { Challenges } from './Challenges';
import './Grow.css';

/**
 * GROW — l'espace de développement personnel.
 *
 * Trois sections empilées : objectifs, habitudes, challenges. L'ordre suit le
 * niveau d'engagement demandé — un objectif donne la direction, une habitude la
 * rend quotidienne, un challenge la met à l'épreuve sur quelques jours.
 */
export default function GrowPage() {
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Grow"
        title="Avancer à ton rythme"
        description="Objectifs, habitudes et challenges. Rien n'est mesuré contre quelqu'un d'autre — seulement contre hier."
      />

      <Goals />
      <Habits />
      <Challenges />
    </div>
  );
}

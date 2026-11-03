import { PageHeader } from '@/layouts/PageHeader';
import { Profile } from './Profile';
import { Preferences } from './Preferences';
import { Notifications } from './Notifications';
import { Privacy } from './Privacy';
import './Me.css';

/**
 * ME — l'espace personnel.
 *
 * Quatre sections : profil, préférences, notifications et confidentialité. Tout
 * y est réellement actionnable — chaque réglage est persisté, chaque bouton a un
 * effet observable.
 */
export default function MePage() {
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Me"
        title="Ton espace, tes règles"
        description="Profil, préférences et gestion de tes données locales. Tu peux tout ajuster, et tout emporter."
      />

      <Profile />
      <Preferences />
      <Notifications />
      <Privacy />
    </div>
  );
}

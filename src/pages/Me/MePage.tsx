import { PageHeader } from '@/layouts/PageHeader';
import { Profile } from './Profile';
import { Preferences } from './Preferences';
import { BackupReminder } from './BackupReminder';
import { Notifications } from './Notifications';
import { Privacy } from './Privacy';
import { DevKitPanel } from './MeKit';
import './Me.css';
import './UIKit.css';
import './DevKit.css';

/**
 * ME — l'espace personnel.
 *
 * Cinq sections : profil, preferences, notifications, confidentialite, et la
 * bibliotheque de composants (repliee, outil de developpement).
 *
 * `BackupReminder` s'insere entre les preferences et les notifications : il ne
 * s'affiche que lorsque la derniere sauvegarde date, donc sa place n'est pas
 * fixe dans la lecture — quand il est la, il se voit.
 */
export default function MePage() {
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Me"
        title="Ton espace, tes reglages"
        description="Profil, preferences et gestion de tes donnees locales. Tu peux tout ajuster, et tout emporter."
      />

      <Profile />
      <Preferences />
      <BackupReminder />
      <Notifications />
      <Privacy />
      <DevKitPanel />
    </div>
  );
}

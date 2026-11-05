import { PageHeader } from '@/layouts/PageHeader';
import { Profile } from './Profile';
import { Preferences } from './Preferences';
import { BackupReminder } from './BackupReminder';
import { Notifications } from './Notifications';
import { ExportPicker } from './ExportPicker';
import { Privacy } from './Privacy';
import { DevKitPanel } from './MeKit';
import './Me.css';
import './UIKit.css';
import './DevKit.css';
import './ExportPicker.css';

/**
 * ME — l'espace personnel.
 *
 * Six sections : profil, préférences, notifications, export sélectif,
 * confidentialité, et la bibliothèque de composants (repliée, outil de
 * développement).
 *
 * `BackupReminder` s'insère entre les préférences et les notifications : il ne
 * s'affiche que lorsque la dernière sauvegarde date, donc sa place n'est pas
 * fixe dans la lecture — quand il est là, il se voit.
 *
 * `ExportPicker` précède `Privacy` : on choisit d'abord ce qu'on emporte, puis
 * on trouve les actions de fond (exporter, importer, effacer).
 */
export default function MePage() {
  return (
    <div className="section-stack">
      <PageHeader
        eyebrow="Me"
        title="Ton espace, tes réglages"
        description="Profil, préférences et gestion de tes données locales. Tu peux tout ajuster, et tout emporter."
      />

      <Profile />
      <Preferences />
      <BackupReminder />
      <Notifications />
      <ExportPicker />
      <Privacy />
      <DevKitPanel />
    </div>
  );
}

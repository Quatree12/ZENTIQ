import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { useToast } from '@/components/feedback/Toast';
import {
  cancelScheduledReminder,
  describeReminderDays,
  describeReminderStatus,
  getPermissionState,
  notifyNow,
  requestPermission,
  scheduleDailyReminder,
  supportsScheduledNotifications,
} from '@/services/notification.service';
import { useSettings } from '@/hooks/useProfile';

/**
 * Notifications.
 *
 * CE QUE CET ECRAN DIT, ET CE QU'IL NE DIT PAS
 * --------------------------------------------
 * ZENTIQ n'envoie pas de push : il n'y a pas de serveur. Un rappel est local.
 * Deux comportements existent selon la plateforme, et l'ecran les distingue
 * explicitement :
 *
 *   - notification planifiee par le systeme (Android/Chrome) : le rappel
 *     arrive meme application fermee ;
 *   - minuteur en page (iOS, navigateurs sans notification planifiee) : le
 *     rappel n'arrive que lorsque ZENTIQ est ouvert.
 *
 * Annoncer le premier quand c'est le second qui s'applique serait la seule
 * vraie malhonnetete de cet ecran.
 */
export function Notifications() {
  const { settings, refresh } = useSettings();
  const { notify } = useToast();
  const [permission, setPermission] = useState(getPermissionState);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleRequest = async () => {
    const result = await requestPermission();
    setPermission(result);

    if (result === 'granted') {
      notify('Notifications autorisees.', { tone: 'success' });
      // Le rappel est programme des l'autorisation obtenue, sinon il faudrait
      // recharger la page pour qu'il prenne effet.
      if (settings) scheduleDailyReminder(settings);
    } else if (result === 'denied') {
      notify('Notifications bloquees par le navigateur.', { tone: 'warning' });
    }
  };

  const handleTest = () => {
    const shown = notifyNow('ZENTIQ', "Un petit pas aujourd'hui suffit.");
    if (!shown) notify("Le message n'a pas pu etre affiche.", { tone: 'warning' });
  };

  const handleReschedule = () => {
    if (!settings) return;
    if (!settings.dailyReminderEnabled) {
      cancelScheduledReminder();
      notify('Rappel desactive.', { tone: 'info' });
      return;
    }
    scheduleDailyReminder(settings);
    notify('Rappel replanifie pour ' + settings.dailyReminderTime + '.', { tone: 'success' });
  };

  const status = settings ? describeReminderStatus(settings) : 'Chargement des preferences…';
  const scheduled = supportsScheduledNotifications();

  return (
    <section className="me-section" aria-labelledby="notifications-heading">
      <header>
        <p className="overline">Notifications</p>
        <h2 className="heading-sm" id="notifications-heading">
          Rappels locaux
        </h2>
      </header>

      <Card compact className="me-card">
        <div className="row-wrap">
          <Badge
            tone={
              permission === 'granted'
                ? 'success'
                : permission === 'unsupported'
                  ? 'neutral'
                  : 'warning'
            }
          >
            {permission === 'granted'
              ? 'Autorisees'
              : permission === 'denied'
                ? 'Bloquees'
                : permission === 'unsupported'
                  ? 'Non prises en charge'
                  : 'A autoriser'}
          </Badge>

          {permission === 'granted' && settings && settings.dailyReminderEnabled && (
            <Badge tone={scheduled ? 'teal' : 'lavender'}>
              {scheduled ? 'En arriere-plan' : "A l'ouverture"}
            </Badge>
          )}
        </div>

        <p className="body-base">{status}</p>

        {settings && settings.dailyReminderEnabled && settings.dailyReminderDays.length > 0 && (
          <p className="body-sm">
            Jours choisis : {describeReminderDays(settings.dailyReminderDays).toLowerCase()}.
          </p>
        )}

        <p className="body-sm">
          {scheduled
            ? "Sur cet appareil, le rappel peut s'afficher meme si ZENTIQ est ferme : le systeme le planifie."
            : "Sur cet appareil, un rappel ne peut s'afficher que lorsque ZENTIQ est ouvert. C'est une limite du navigateur, pas un manque de l'application."}
        </p>

        <div className="row-wrap">
          {permission !== 'granted' && permission !== 'unsupported' && (
            <Button
              variant="primary"
              size="sm"
              leadingIcon={<BellRing size={16} />}
              onClick={() => void handleRequest()}
            >
              Autoriser les notifications
            </Button>
          )}
          {permission === 'granted' && (
            <>
              <Button variant="secondary" size="sm" onClick={handleTest}>
                Tester un rappel
              </Button>
              <Button variant="tertiary" size="sm" onClick={handleReschedule}>
                Replanifier
              </Button>
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

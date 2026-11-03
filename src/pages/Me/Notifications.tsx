import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import {
  describeReminderStatus,
  getPermissionState,
  notifyNow,
  requestPermission,
} from '@/services/notification.service';
import { useSettings } from '@/hooks/useProfile';
import { useToast } from '@/components/feedback/Toast';

/**
 * Notifications.
 *
 * Cadre honnête : ZENTIQ n'envoie pas de push (il n'y a pas de serveur). Les
 * rappels sont locaux et s'affichent lorsque l'application est ouverte. Cet
 * écran permet de vérifier l'autorisation et de tester un message, plutôt que
 * de promettre des notifications à heure fixe qui n'arriveraient pas.
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
      notify('Notifications autorisées.', { tone: 'success' });
    } else if (result === 'denied') {
      notify('Notifications bloquées par le navigateur.', { tone: 'warning' });
    }
  };

  const handleTest = () => {
    const shown = notifyNow('ZENTIQ', "Un petit pas aujourd'hui suffit.");
    if (!shown) notify("Le message n'a pas pu être affiché.", { tone: 'warning' });
  };

  const status = settings ? describeReminderStatus(settings) : 'Chargement des préférences…';

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
              ? 'Autorisées'
              : permission === 'denied'
                ? 'Bloquées'
                : permission === 'unsupported'
                  ? 'Non prises en charge'
                  : 'À autoriser'}
          </Badge>
        </div>

        <p className="body-base">{status}</p>

        <p className="body-sm">
          ZENTIQ n'envoie aucun message depuis un serveur : il n'y en a pas. Un rappel ne peut donc
          se déclencher que lorsque l'application est ouverte.
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
            <Button variant="secondary" size="sm" onClick={handleTest}>
              Tester un rappel
            </Button>
          )}
        </div>
      </Card>
    </section>
  );
}

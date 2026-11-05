import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Card } from '@/components/cards';
import { useToast } from '@/components/feedback/Toast';
import { useSettings } from '@/hooks/useProfile';
import { useBackupStore } from '@/stores/backup.store';
import { useAppStore } from '@/stores/app.store';
import { downloadBackup } from '@/services/export.service';
import { pluralize } from '@/utils/formatters';

/**
 * Rappel de sauvegarde.
 *
 * IL N'APPARAIT QUE S'IL A QUELQUE CHOSE A DIRE.
 *
 * Deux conditions : le reglage `autoBackupReminder` est actif, et la derniere
 * sauvegarde date de plus de quatorze jours — ou n'a jamais ete faite. Sur une
 * base vide, il ne s'affiche pas non plus : proposer de sauvegarder rien
 * n'aurait aucun sens.
 *
 * Le bloc n'est jamais permanent. Un rappel qu'on voit tous les jours cesse
 * d'etre un rappel et devient du bruit.
 */
export function BackupReminder() {
  const { settings, refresh: refreshSettings } = useSettings();
  const reminder = useBackupStore((state) => state.reminder);
  const refreshReminder = useBackupStore((state) => state.refresh);
  const refreshSummary = useAppStore((state) => state.refreshSummary);
  const { notify } = useToast();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  // On reevalue a chaque changement de reglages : desactiver le rappel doit le
  // faire disparaitre immediatement, sans recharger la page.
  useEffect(() => {
    void refreshReminder(settings ?? null);
  }, [refreshReminder, settings]);

  if (!reminder || !reminder.shouldSuggest || !reminder.message) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      const counts = await downloadBackup({ includeJournal: true });
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      notify('Sauvegarde telechargee.', {
        tone: 'success',
        detail: pluralize(total, 'element'),
      });
      await refreshSummary();
      // La sauvegarde vient d'etre faite : le rappel n'a plus lieu d'etre.
      await refreshReminder(settings ?? null);
    } catch {
      notify("La sauvegarde n'a pas pu etre creee.", { tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card compact className="me-card">
      <p className="data-label">Sauvegarde suggeree</p>
      <p className="body-base">{reminder.message}</p>
      <div className="row-wrap">
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<Download size={16} />}
          onClick={() => void handleExport()}
          loading={exporting}
        >
          Exporter maintenant
        </Button>
      </div>
    </Card>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Card } from '@/components/cards';
import { Badge } from '@/components/badges';
import { Modal } from '@/components/modals';
import { useToast } from '@/components/feedback/Toast';
import { useAppStore } from '@/stores/app.store';
import { downloadBackup } from '@/services/export.service';
import {
  eraseAllData,
  previewBackup,
  readBackupFile,
  restoreBackup,
  type BackupPreview,
} from '@/services/import.service';
import { CURRENT_SCHEMA_VERSION } from '@/database/schema';
import { formatBytes, formatDateTime, pluralize } from '@/utils/formatters';

/**
 * Confidentialité et gestion des données locales.
 *
 * Aucune synchronisation cloud n'existe : cet écran le dit clairement, puis
 * donne à l'utilisateur les moyens de garder la main — exporter une sauvegarde,
 * en restaurer une, ou tout effacer.
 *
 * L'effacement demande la saisie d'un mot explicite, en plus de la confirmation.
 */
export function Privacy() {
  const { notify } = useToast();
  const summary = useAppStore((state) => state.summary);
  const storage = useAppStore((state) => state.storage);
  const refreshSummary = useAppStore((state) => state.refreshSummary);
  const refreshStorage = useAppStore((state) => state.refreshStorage);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [eraseOpen, setEraseOpen] = useState(false);
  const [eraseInput, setEraseInput] = useState('');

  const ERASE_WORD = 'EFFACER';

  useEffect(() => {
    void refreshSummary();
    void refreshStorage();
  }, [refreshSummary, refreshStorage]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const counts = await downloadBackup({ includeJournal: true });
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      notify('Sauvegarde téléchargée.', {
        tone: 'success',
        detail: pluralize(total, 'élément'),
      });
    } catch {
      notify("La sauvegarde n'a pas pu être créée.", { tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleFileChosen = async (file: File) => {
    const document = await readBackupFile(file);
    if (!document) {
      notify("Ce fichier n'est pas une sauvegarde ZENTIQ valide.", { tone: 'error' });
      return;
    }
    setPendingFile(file);
    setPreview(previewBackup(document, CURRENT_SCHEMA_VERSION));
  };

  const handleRestore = async () => {
    if (!pendingFile) return;
    const document = await readBackupFile(pendingFile);
    if (!document) return;

    const result = await restoreBackup(document, importMode, CURRENT_SCHEMA_VERSION);

    if (result.ok) {
      notify('Sauvegarde restaurée.', {
        tone: 'success',
        detail: 'Recharge la page pour voir tes données.',
      });
      setPreview(null);
      setPendingFile(null);
      await refreshSummary();
    } else {
      notify(result.error ?? "L'import a échoué.", { tone: 'error' });
    }
  };

  const handleErase = async () => {
    if (eraseInput.trim() !== ERASE_WORD) {
      notify(`Saisis ${ERASE_WORD} pour confirmer.`, { tone: 'warning' });
      return;
    }
    await eraseAllData();
    setEraseOpen(false);
    setEraseInput('');
    notify('Toutes les données locales ont été effacées.', { tone: 'info' });
    window.location.reload();
  };

  return (
    <section className="me-section" aria-labelledby="privacy-heading">
      <header>
        <p className="overline">Confidentialité</p>
        <h2 className="heading-sm" id="privacy-heading">
          Tes données, sur ton appareil
        </h2>
      </header>

      <Card compact className="me-card">
        <div className="row-wrap">
          <Badge tone="teal">Local uniquement</Badge>
          <Badge>Aucun compte</Badge>
          <Badge>Aucun envoi réseau</Badge>
        </div>
        <p className="body-base spacer-top-sm">
          ZENTIQ enregistre tes données dans le stockage local de ton navigateur (IndexedDB) et ne
          les envoie nulle part. La synchronisation cloud n'est pas implémentée à ce stade : ce
          n'est pas une option désactivée, c'est une fonctionnalité qui n'existe pas encore.
        </p>

        {storage?.supported && storage.usageBytes > 0 && (
          <p className="body-sm">
            Espace utilisé : {formatBytes(storage.usageBytes)} sur environ{' '}
            {formatBytes(storage.quotaBytes)} disponibles.
          </p>
        )}
      </Card>

      <Card compact className="me-card">
        <p className="data-label">Ce que contient cet appareil</p>
        {summary ? (
          <p className="body-base">
            {pluralize(summary.total, 'élément')} enregistrés localement — profil, réglages,
            humeurs, objectifs, habitudes, journal et favoris confondus.
          </p>
        ) : (
          <p className="body-sm">Lecture de tes données…</p>
        )}

        <div className="row-wrap">
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<Download size={16} />}
            onClick={() => void handleExport()}
            loading={exporting}
          >
            Exporter mes données
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Upload size={16} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Importer une sauvegarde
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFileChosen(file);
            event.target.value = '';
          }}
        />
      </Card>

      <Card compact className="me-card">
        <p className="data-label">Zone sensible</p>
        <p className="body-sm">
          Effacer supprime définitivement toutes les données locales. Sans sauvegarde exportée au
          préalable, elles ne pourront pas être récupérées.
        </p>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Trash2 size={16} />}
          onClick={() => setEraseOpen(true)}
        >
          Effacer toutes mes données
        </Button>
      </Card>

      <Modal
        open={preview !== null}
        onClose={() => {
          setPreview(null);
          setPendingFile(null);
        }}
        title="Restaurer cette sauvegarde ?"
        description="Vérifie le contenu du fichier avant de continuer."
        footer={
          <>
            <Button
              variant="tertiary"
              onClick={() => {
                setPreview(null);
                setPendingFile(null);
              }}
            >
              Annuler
            </Button>
            <Button variant="primary" onClick={() => void handleRestore()}>
              Restaurer
            </Button>
          </>
        }
      >
        {preview && (
          <>
            <p className="body-base">
              Sauvegarde du {formatDateTime(preview.exportedAt)} —{' '}
              {pluralize(preview.total, 'élément')}.
            </p>
            {preview.tooRecent && (
              <p className="body-sm">
                Ce fichier vient d'une version plus récente de ZENTIQ. Mets l'application à jour
                avant de le restaurer.
              </p>
            )}

            <div className="row-wrap" role="radiogroup" aria-label="Mode d'import">
              <button
                type="button"
                role="radio"
                aria-checked={importMode === 'replace'}
                className={importMode === 'replace' ? 'filter-chip is-active' : 'filter-chip'}
                onClick={() => setImportMode('replace')}
              >
                Remplacer
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={importMode === 'merge'}
                className={importMode === 'merge' ? 'filter-chip is-active' : 'filter-chip'}
                onClick={() => setImportMode('merge')}
              >
                Fusionner
              </button>
            </div>

            <p className="body-sm">
              {importMode === 'replace'
                ? 'Les tables concernées seront vidées puis remplacées par le contenu du fichier.'
                : 'Les éléments du fichier seront ajoutés ; ceux qui portent le même identifiant seront mis à jour.'}
            </p>
          </>
        )}
      </Modal>

      <Modal
        open={eraseOpen}
        onClose={() => setEraseOpen(false)}
        title="Effacer toutes les données"
        description="Cette action est définitive et sans retour."
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setEraseOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={() => void handleErase()}>
              Effacer définitivement
            </Button>
          </>
        }
      >
        <p className="body-base">
          Saisis <strong>{ERASE_WORD}</strong> pour confirmer. Profil, réglages, humeurs, objectifs,
          habitudes, journal et favoris seront supprimés de cet appareil.
        </p>
        <input
          type="text"
          className="input"
          value={eraseInput}
          onChange={(event) => setEraseInput(event.target.value)}
          placeholder={ERASE_WORD}
          aria-label={`Saisis ${ERASE_WORD} pour confirmer`}
        />
      </Modal>
    </section>
  );
}

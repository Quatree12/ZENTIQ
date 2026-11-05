import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/buttons';
import { Badge } from '@/components/badges';
import { useToast } from '@/components/feedback/Toast';
import {
  TABLE_DESCRIPTORS,
  downloadBackup,
  estimateExport,
} from '@/services/export.service';
import { useAppStore } from '@/stores/app.store';
import type { TableName } from '@/database/schema';
import { pluralize } from '@/utils/formatters';

/**
 * Choix des tables à exporter.
 *
 * POURQUOI CET ÉCRAN EXISTE
 * -------------------------
 * L'export emportait TOUT, sans possibilité de choisir. Or le journal est
 * intime : quelqu'un qui exporte pour changer de téléphone peut très bien ne pas
 * vouloir que ses textes personnels dorment dans un dossier de téléchargements.
 *
 * CE QUI EST COCHÉ PAR DÉFAUT
 * ---------------------------
 * Tout. Le comportement historique est préservé : qui ne touche à rien obtient
 * la sauvegarde complète. Mais les deux tables marquées « personnel » — humeurs
 * et journal — portent un repère visuel, pour que le choix soit conscient.
 *
 * Le compteur se met à jour à chaque coche : on voit ce qu'on emporte AVANT de
 * télécharger, pas après.
 */
export function ExportPicker() {
  const { notify } = useToast();
  const summary = useAppStore((state) => state.summary);
  const refreshSummary = useAppStore((state) => state.refreshSummary);

  const [selected, setSelected] = useState<TableName[]>(() =>
    TABLE_DESCRIPTORS.map((item) => item.table),
  );
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  // Les compteurs suivent la sélection : une lecture de comptage, jamais un
  // chargement d'enregistrements.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const estimate = await estimateExport(selected);
      if (cancelled) return;
      setCounts(estimate.counts);
      setTotal(estimate.total);
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const allSelected = selected.length === TABLE_DESCRIPTORS.length;
  const noneSelected = selected.length === 0;

  const toggle = (table: TableName) => {
    setSelected((current) =>
      current.includes(table)
        ? current.filter((item) => item !== table)
        : [...current, table],
    );
  };

  const sensitiveTables = useMemo(
    () => TABLE_DESCRIPTORS.filter((item) => item.sensitive).map((item) => item.table),
    [],
  );

  const hiddenSensitive = sensitiveTables.some((table) => !selected.includes(table));

  const handleExport = async () => {
    if (noneSelected) {
      notify("Aucune table sélectionnée : il n'y a rien à exporter.", { tone: 'warning' });
      return;
    }

    setExporting(true);
    try {
      const result = await downloadBackup({ tables: selected });
      const exported = Object.values(result).reduce((sum, count) => sum + count, 0);
      notify('Sauvegarde téléchargée.', {
        tone: 'success',
        detail:
          pluralize(exported, 'élément') +
          (allSelected ? ' — sauvegarde complète.' : ' — export partiel.'),
      });
      await refreshSummary();
    } catch {
      notify("La sauvegarde n'a pas pu être créée.", { tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="me-section" aria-labelledby="export-picker-heading">
      <header>
        <p className="overline">Export sélectif</p>
        <h2 className="heading-sm" id="export-picker-heading">
          Choisir ce que tu emportes
        </h2>
      </header>

      <p className="body-sm">
        Décoche ce que tu préfères laisser sur cet appareil. Un export partiel ne compte pas comme
        une sauvegarde complète : le rappel de sauvegarde continuera de te le signaler.
      </p>

      <div className="row-wrap">
        <Button
          variant="tertiary"
          size="sm"
          type="button"
          onClick={() => setSelected(TABLE_DESCRIPTORS.map((item) => item.table))}
          disabled={allSelected}
        >
          Tout sélectionner
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          type="button"
          onClick={() => setSelected([])}
          disabled={noneSelected}
        >
          Tout décocher
        </Button>
      </div>

      <ul className="export-picker__list">
        {TABLE_DESCRIPTORS.map((item) => {
          const checked = selected.includes(item.table);
          const count = counts[item.table] ?? 0;

          return (
            <li key={item.table}>
              <label className={checked ? 'export-picker__row is-selected' : 'export-picker__row'}>
                <input type="checkbox" checked={checked} onChange={() => toggle(item.table)} />
                <span className="export-picker__text">
                  <span className="export-picker__label">
                    {item.label}
                    {item.sensitive && <Badge tone="lavender">Personnel</Badge>}
                  </span>
                  <span className="body-sm">{item.description}</span>
                </span>
                <span className="export-picker__count data-value">{count}</span>
              </label>
            </li>
          );
        })}
      </ul>

      {!allSelected && !noneSelected && (
        <p className="body-sm">
          {selected.length} table{selected.length > 1 ? 's' : ''} sur {TABLE_DESCRIPTORS.length}
          {hiddenSensitive && ' — tu laisses une ou plusieurs tables personnelles de côté'}.
        </p>
      )}

      <div className="row-wrap">
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<Download size={16} />}
          onClick={() => void handleExport()}
          loading={exporting}
          disabled={noneSelected}
        >
          Exporter {total === null ? '' : pluralize(total, 'élément')}
        </Button>
      </div>

      {summary && allSelected && (
        <p className="body-sm">Sauvegarde complète : tous tes éléments partent dans le fichier.</p>
      )}
    </section>
  );
}

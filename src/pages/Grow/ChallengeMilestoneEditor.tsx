import { useEffect, useId, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/buttons';
import { Input } from '@/components/inputs';
import { useToast } from '@/components/feedback/Toast';
import type { Challenge, ChallengeMilestone } from '@/types';

/**
 * Édition des jalons d'un challenge existant.
 *
 * CE QUE CET ÉCRAN PERMET, ET CE QU'IL NE PERMET PAS
 * -------------------------------------------------
 * Il modifie trois choses : le TITRE d'un jalon, le JOUR qu'il couvre, et la
 * LISTE elle-même (ajout, suppression). C'est tout.
 *
 * Il ne touche JAMAIS aux étapes du challenge, ni aux coches, ni aux dates de
 * début et de fin, ni au rythme. Ce sont des choix qui appartiennent à la
 * création, ou à des actions dédiées (`postpone`, `setAside`).
 *
 * LA DATE DE FRANCHISSEMENT N'EST PAS ÉDITABLE, et c'est volontaire : elle est
 * relevée sur les étapes réellement cochées. La laisser saisir à la main
 * reviendrait à autoriser un jalon « atteint » sans progression — exactement
 * ce que les trois invariants du repository interdisent.
 *
 * Le composant travaille sur une copie locale. Rien n'est écrit avant
 * « Enregistrer » : on peut tout modifier puis renoncer.
 */

export interface ChallengeMilestoneEditorProps {
  challenge: Challenge;
  onSubmit: (milestones: Array<{ title: string; throughDay: number }>) => Promise<boolean>;
  onCancel: () => void;
}

/** Titre suggéré pour un jalon créé à la main. */
function defaultTitle(position: number): string {
  return 'Jalon ' + position;
}

/**
 * Jalons proposés quand le challenge n'en a aucun.
 *
 * Répartition classique : premier tiers, moitié, dernière ligne droite. Les
 * jours sont bornés à la durée réelle, sinon un jalon au-delà du dernier jour
 * ne serait jamais franchi.
 */
function suggestFor(durationDays: number): Array<{ title: string; throughDay: number }> {
  if (durationDays < 3) return [];
  const clamp = (value: number) => Math.min(Math.max(1, value), durationDays);
  return [
    { title: 'Premier tiers', throughDay: clamp(Math.round(durationDays / 3)) },
    { title: 'Moitié du chemin', throughDay: clamp(Math.round(durationDays / 2)) },
    { title: 'Dernière ligne droite', throughDay: clamp(durationDays - 1) },
  ];
}

interface DraftRow {
  /** Clé locale stable : évite que React réutilise le mauvais champ. */
  key: string;
  title: string;
  /** Le jour est gardé en TEXTE : le champ doit rester vide pendant la frappe. */
  throughDay: string;
  /** Date de franchissement existante, affichée mais non modifiable. */
  reachedAt?: string;
}

let rowCounter = 0;
function nextKey(): string {
  rowCounter += 1;
  return 'milestone-' + rowCounter;
}

/** Convertit les jalons du challenge en brouillons éditables. */
function toDrafts(milestones: ChallengeMilestone[] | undefined): DraftRow[] {
  if (!milestones || milestones.length === 0) return [];
  return milestones.map((milestone) => ({
    key: nextKey(),
    title: milestone.title,
    throughDay: String(milestone.throughDay),
    reachedAt: milestone.reachedAt,
  }));
}

export function ChallengeMilestoneEditor({
  challenge,
  onSubmit,
  onCancel,
}: ChallengeMilestoneEditorProps) {
  const { notify } = useToast();
  const formId = useId();
  const [rows, setRows] = useState<DraftRow[]>(() => toDrafts(challenge.milestones));
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  // Le challenge peut changer sous nos pieds (coche faite ailleurs) : on ne
  // réinitialise pas les brouillons, on rafraîchit seulement les dates.
  useEffect(() => {
    setRows((current) =>
      current.map((row, index) => {
        const source = challenge.milestones?.[index];
        return source ? { ...row, reachedAt: source.reachedAt } : row;
      }),
    );
  }, [challenge.milestones]);

  const addRow = () => {
    setRows((current) => {
      const used = current.map((row) => Number.parseInt(row.throughDay, 10)).filter(Number.isFinite);
      // On propose le jour suivant le plus grand déjà pris, borné à la durée.
      const nextDay = Math.min(
        challenge.durationDays,
        used.length > 0 ? Math.max(...used) + 1 : Math.round(challenge.durationDays / 2),
      );
      return [
        ...current,
        { key: nextKey(), title: defaultTitle(current.length + 1), throughDay: String(nextDay) },
      ];
    });
  };

  const addSuggestions = () => {
    setRows(suggestFor(challenge.durationDays).map((item) => ({
      key: nextKey(),
      title: item.title,
      throughDay: String(item.throughDay),
    })));
  };

  const removeRow = (key: string) => {
    setRows((current) => current.filter((row) => row.key !== key));
  };

  const patchRow = (key: string, changes: Partial<DraftRow>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  };

  /**
   * Valide les brouillons et renvoie les jalons prêts pour le repository.
   *
   * Une ligne sans titre est IGNORÉE plutôt que refusée : mieux vaut enregistrer
   * les jalons valides que bloquer sur une ligne à moitié remplie. Une ligne
   * sans jour lisible est ramenée à 1.
   */
  const buildPayload = (): Array<{ title: string; throughDay: number }> => {
    return rows
      .map((row) => {
        const parsed = Number.parseInt(row.throughDay, 10);
        const day = Number.isFinite(parsed) ? parsed : 1;
        return { title: row.title.trim(), throughDay: day };
      })
      .filter((item) => item.title.length > 0);
  };

  const handleSubmit = async () => {
    setTouched(true);
    setSaving(true);
    const ok = await onSubmit(buildPayload());
    setSaving(false);

    if (ok) {
      notify('Jalons enregistrés.', { tone: 'success' });
    } else {
      notify("Les jalons n'ont pas pu être enregistrés.", { tone: 'error' });
    }
  };

  const hasContent = rows.length > 0;

  return (
    <form
      className="milestone-editor"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <p className="body-sm">
        Un jalon se franchit quand les étapes qu'il couvre sont toutes cochées. La date de
        franchissement se calcule toute seule — elle ne se saisit pas.
      </p>

      {!hasContent && (
        <div className="milestone-editor__empty">
          <p className="body-base">Ce challenge n'a pas de jalon.</p>
          <div className="row-wrap">
            <Button variant="secondary" size="sm" type="button" onClick={addSuggestions}>
              Proposer trois jalons
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              type="button"
              leadingIcon={<Plus size={16} />}
              onClick={addRow}
            >
              Ajouter à la main
            </Button>
          </div>
        </div>
      )}

      {hasContent && (
        <ul className="milestone-editor__list">
          {rows.map((row, index) => (
            <li key={row.key} className="milestone-editor__row">
              <div className="milestone-editor__fields">
                <Input
                  label={'Jalon ' + (index + 1)}
                  value={row.title}
                  onChange={(event) => patchRow(row.key, { title: event.target.value })}
                  placeholder="Ex. Première semaine tenue"
                  maxLength={60}
                />

                <Input
                  label="Jusqu'au jour"
                  id={formId + '-day-' + row.key}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={row.throughDay}
                  onChange={(event) =>
                    patchRow(row.key, {
                      throughDay: event.target.value.replace(/[^0-9]/g, '').slice(0, 3),
                    })
                  }
                  onBlur={() => {
                    const parsed = Number.parseInt(row.throughDay, 10);
                    const bounded = Number.isFinite(parsed)
                      ? Math.min(Math.max(1, parsed), challenge.durationDays)
                      : 1;
                    patchRow(row.key, { throughDay: String(bounded) });
                  }}
                  hint={'De 1 à ' + challenge.durationDays}
                />
              </div>

              <div className="milestone-editor__actions">
                {row.reachedAt !== undefined && (
                  <span className="milestone-editor__reached body-sm">
                    <Check size={12} aria-hidden="true" /> Déjà franchi
                  </span>
                )}
                <IconButton
                  label={'Supprimer le jalon ' + (index + 1)}
                  accent="danger"
                  type="button"
                  onClick={() => removeRow(row.key)}
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {touched && rows.length > 0 && buildPayload().length === 0 && (
        <p className="body-sm" role="alert">
          Aucun jalon n'a de titre : tout sera supprimé si tu enregistres.
        </p>
      )}

      <div className="row-wrap">
        {hasContent && (
          <Button
            variant="tertiary"
            size="sm"
            type="button"
            leadingIcon={<Plus size={16} />}
            onClick={addRow}
            disabled={rows.length >= 10}
          >
            Ajouter un jalon
          </Button>
        )}
        <Button variant="tertiary" size="sm" type="button" onClick={onCancel}>
          Annuler
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={saving}>
          Enregistrer
        </Button>
      </div>

      {rows.length >= 10 && (
        <p className="body-sm">Dix jalons suffisent : au-delà, ils perdent leur rôle de repère.</p>
      )}
    </form>
  );
}

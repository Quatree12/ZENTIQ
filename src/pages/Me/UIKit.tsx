/**
 * Ecran de demonstration du design system.
 *
 * POURQUOI CET ECRAN
 * ------------------
 * La phase 02 demandait un UI kit : des composants ET un endroit pour les voir.
 * Les composants existaient, disperses dans les cinq espaces, mais aucun ecran
 * ne les rassemblait. Impossible donc de juger la coherence du design system
 * d'un seul regard — ou de voir un etat qu'on ne croise pas dans l'usage
 * courant : le bouton desactive, le champ en erreur, le badge plein.
 *
 * Ce n'est PAS une page utilisateur : elle vit dans ME, derriere un repli, et
 * n'apparait nulle part dans la navigation principale.
 */
import { useState } from 'react';
import { Heart, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/buttons';
import { Card, EditorialCard } from '@/components/cards';
import { Badge } from '@/components/badges';
import { Input, Select, Textarea } from '@/components/inputs';
import { ProgressBar, ProgressRing } from '@/components/progress';
import { EmptyState, ErrorState, LoadingState, SuccessMessage } from '@/components/feedback';
import { Modal, ConfirmDialog } from '@/components/modals';
import { useToast } from '@/components/feedback/Toast';

/** Couleurs officielles, affichees pour verification visuelle. */
const PALETTE = [
  { name: 'Deep Space', value: '#0D1015', role: 'Fond principal' },
  { name: 'Night Surface', value: '#1C2430', role: 'Cartes et panneaux' },
  { name: 'Slate Blue', value: '#34445A', role: 'Bordures' },
  { name: 'Digital Teal', value: '#72C8C1', role: 'Actions, progression' },
  { name: 'Lavender Mind', value: '#A99ACB', role: 'Inspiration, emotions' },
  { name: 'Soft Mist', value: '#E0F0ED', role: 'Texte principal' },
];

/** Echelle typographique complete, du titre au libelle. */
const TYPOGRAPHY = [
  { className: 'heading-xl', label: 'heading-xl', role: 'Titre principal' },
  { className: 'heading-lg', label: 'heading-lg', role: 'Titre de section' },
  { className: 'heading-md', label: 'heading-md', role: 'Sous-titre' },
  { className: 'heading-sm', label: 'heading-sm', role: 'Titre de carte' },
  { className: 'body-lg', label: 'body-lg', role: 'Lecture longue' },
  { className: 'body-base', label: 'body-base', role: 'Texte courant' },
  { className: 'body-sm', label: 'body-sm', role: 'Texte secondaire' },
  { className: 'overline', label: 'overline', role: 'Libelle de section' },
  { className: 'data-value', label: 'data-value', role: 'Donnee chiffree' },
  { className: 'stat-value', label: 'stat-value', role: 'Statistique' },
  { className: 'editorial-quote', label: 'editorial-quote', role: 'Citation (Montserrat)' },
];

export function UIKit() {
  const { notify } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress, setProgress] = useState(70);

  return (
    <section className="me-section" aria-labelledby="uikit-heading">
      <header>
        <p className="overline">Design system</p>
        <h2 className="heading-sm" id="uikit-heading">
          Bibliotheque de composants
        </h2>
        <p className="body-sm">
          Tous les composants, dans tous leurs etats. Cet ecran sert a juger la coherence
          visuelle et a reperer ce qui se comporte mal a 320 px.
        </p>
      </header>

      <div className="pref-group">
        <p className="data-label">Palette officielle</p>
        <ul className="uikit-swatches">
          {PALETTE.map((colour) => (
            <li key={colour.value} className="uikit-swatch">
              <span
                className="uikit-swatch__chip"
                style={{ backgroundColor: colour.value }}
                aria-hidden="true"
              />
              <span className="uikit-swatch__name">{colour.name}</span>
              <span className="uikit-swatch__hex data-value">{colour.value}</span>
              <span className="body-sm">{colour.role}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pref-group">
        <p className="data-label">Echelle typographique</p>
        {TYPOGRAPHY.map((item) => (
          <div key={item.className} className="uikit-type-row">
            <span className="uikit-type-row__meta data-label">{item.label}</span>
            <span className={item.className}>ZENTIQ — {item.role}</span>
          </div>
        ))}
      </div>

      <div className="pref-group">
        <p className="data-label">Boutons</p>
        <div className="row-wrap">
          <Button variant="primary">Primaire</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="tertiary">Tertiaire</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="row-wrap">
          <Button variant="primary" size="sm">Petit</Button>
          <Button variant="primary" size="md">Moyen</Button>
          <Button variant="primary" size="lg">Grand</Button>
        </div>
        <div className="row-wrap">
          <Button variant="primary" loading>Enregistrement</Button>
          <Button variant="primary" disabled>Desactive</Button>
          <Button variant="secondary" leadingIcon={<Plus size={16} />}>Avec icone</Button>
        </div>
        <div className="row-wrap">
          <IconButton label="Favori" accent="teal" active><Heart size={16} /></IconButton>
          <IconButton label="Favori inactif" accent="lavender"><Heart size={16} /></IconButton>
          <IconButton label="Supprimer" accent="danger"><Trash2 size={16} /></IconButton>
        </div>
      </div>

      <div className="pref-group">
        <p className="data-label">Cartes</p>
        <Card compact>
          <h3 className="heading-sm">Carte standard</h3>
          <p className="body-sm">
            Surface Night Surface, bordure Slate Blue, radius 22 px. C&apos;est la brique de base.
          </p>
        </Card>
        <Card compact accent="teal">
          <h3 className="heading-sm">Carte accent teal</h3>
          <p className="body-sm">Contour teal, pour mettre en avant sans crier.</p>
        </Card>
        <Card compact accent="lavender">
          <h3 className="heading-sm">Carte accent lavande</h3>
          <p className="body-sm">Contour lavande, pour l&apos;inspiration et la reflexion.</p>
        </Card>
        <Card compact interactive onClick={() => notify('Carte cliquable.', { tone: 'info' })}>
          <h3 className="heading-sm">Carte interactive</h3>
          <p className="body-sm">Rendue comme un bouton : focusable et activable au clavier.</p>
        </Card>
        <EditorialCard
          eyebrow="Inspiration du jour"
          text="Ce que tu as appris en chemin compte autant que le resultat."
          attribution="ZENTIQ"
          footer={<Badge tone="accent">Motivation</Badge>}
        />
      </div>

      <div className="pref-group">
        <p className="data-label">Badges</p>
        <div className="row-wrap">
          <Badge>Neutre</Badge>
          <Badge tone="accent">Accent</Badge>
          <Badge tone="inspiration">Inspiration</Badge>
          <Badge tone="success">Succes</Badge>
          <Badge tone="warning">Attention</Badge>
          <Badge tone="danger">Erreur</Badge>
          <Badge tone="accent" solid>Plein</Badge>
        </div>
      </div>

      <div className="pref-group">
        <p className="data-label">Champs</p>
        <Input label="Champ simple" placeholder="Ecris quelque chose…" />
        <Input label="Avec aide" hint="Ce message accompagne la saisie." />
        <Input label="En erreur" error="Ce champ est requis." />
        <Input label="Desactive" disabled value="Non modifiable" />
        <Textarea label="Zone de texte" placeholder="Plusieurs lignes…" rows={2} />
        <Select
          label="Liste"
          options={[
            { value: 'a', label: 'Premiere option' },
            { value: 'b', label: 'Deuxieme option' },
          ]}
        />
      </div>

      <div className="pref-group">
        <p className="data-label">Progression</p>
        <ProgressBar value={progress} label="Avancement" />
        <ProgressBar value={progress} tone="lavender" label="Avancement lavande" size="sm" />
        <div className="row-wrap">
          <ProgressRing value={progress} />
          <ProgressRing value={progress} tone="lavender" />
          <ProgressRing value={0}>{<span>—</span>}</ProgressRing>
        </div>
        <div className="row-wrap">
          <Button variant="secondary" size="sm" onClick={() => setProgress(0)}>0 %</Button>
          <Button variant="secondary" size="sm" onClick={() => setProgress(43)}>43 %</Button>
          <Button variant="secondary" size="sm" onClick={() => setProgress(100)}>100 %</Button>
        </div>
      </div>

      <div className="pref-group">
        <p className="data-label">Etats</p>
        <LoadingState label="Chargement en cours…" compact />
        <SuccessMessage message="Modification enregistree." detail="Le 5 novembre a 05h00." />
      </div>

      <EmptyState
        icon={Sparkles}
        title="Etat vide"
        description="Toujours une explication, et une action quand il y en a une."
        action={{
          label: 'Action proposee',
          onClick: () => notify('Action declenchee.', { tone: 'success' }),
        }}
      />

      <ErrorState
        message="Message d'erreur : ce qui s'est passe, et quoi faire."
        onRetry={() => notify('Nouvelle tentative.', { tone: 'info' })}
      />

      <div className="pref-group">
        <p className="data-label">Notifications</p>
        <div className="row-wrap">
          <Button variant="secondary" size="sm" onClick={() => notify('Message informatif.', { tone: 'info' })}>
            Info
          </Button>
          <Button variant="secondary" size="sm" onClick={() => notify('Action reussie.', { tone: 'success' })}>
            Succes
          </Button>
          <Button variant="secondary" size="sm" onClick={() => notify('Attention requise.', { tone: 'warning' })}>
            Attention
          </Button>
          <Button variant="secondary" size="sm" onClick={() => notify("Quelque chose a echoue.", { tone: 'error' })}>
            Erreur
          </Button>
        </div>
        <p className="body-sm">
          Une seule notification a la fois : un message identique prolonge le precedent au lieu de
          s&apos;empiler.
        </p>
      </div>

      <div className="pref-group">
        <p className="data-label">Modales</p>
        <div className="row-wrap">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
            Ouvrir une modale
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
            Ouvrir une confirmation
          </Button>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Titre de la modale"
        description="Le focus reste dans la boite, et Echap la referme."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>Valider</Button>
          </>
        }
      >
        <Input label="Un champ dans la modale" placeholder="Saisie…" />
        <p className="body-sm">Sur mobile, la modale remonte du bas et occupe toute la largeur.</p>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmer une action"
        message="Le bouton nomme l'action, jamais un « OK » generique."
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={() => {
          setConfirmOpen(false);
          notify('Action confirmee.', { tone: 'info' });
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}

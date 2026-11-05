/**
 * Repli « Bibliotheque de composants » dans l'espace ME.
 *
 * L'ecran est un outil de developpement, pas une fonctionnalite utilisateur :
 * il est replie par defaut et n'apparait nulle part dans la navigation.
 */
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { UIKit } from './UIKit';

/**
 * Repli accessible : bouton natif, etat `aria-expanded`, contenu monte
 * uniquement quand il est ouvert.
 */
export function DevKitPanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className="me-section" aria-labelledby="devkit-heading">
      <header>
        <p className="overline">Developpement</p>
        <h2 className="heading-sm" id="devkit-heading">
          Bibliotheque de composants
        </h2>
      </header>

      <button
        type="button"
        className="devkit-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronRight
          size={16}
          aria-hidden="true"
          className={open ? 'devkit-toggle__icon is-open' : 'devkit-toggle__icon'}
        />
        <span>{open ? 'Masquer la bibliotheque' : 'Afficher la bibliotheque'}</span>
      </button>

      <p className="body-sm">
        Tous les composants du design system, dans tous leurs etats. Sert a verifier la
        coherence visuelle et le rendu a 320 px.
      </p>

      {open && <UIKit />}
    </section>
  );
}

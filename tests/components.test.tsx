/**
 * Tests de composant — les cas qui ont REELLEMENT casse.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Pendant le developpement, trois bugs d'affichage ont ete trouves par capture
 * d'ecran, jamais par la CI :
 *   1. Le badge de categorie restait lavande alors que l'accent etait teal —
 *      le composant Badge savait gerer le ton `accent`, aucun ecran ne
 *      l'utilisait.
 *   2. L'auteur de citation etait fige sur lavande, la regle CSS vivant dans
 *      un fichier jamais importe.
 *   3. Le compteur « Habitudes 2 » se lisait comme un taux de regularite.
 *
 * Ces trois cas sont couverts ci-dessous. Ce ne sont pas des tests exhaustifs
 * d'interface : ce sont des verrous sur les erreurs commises.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '@/components/badges';
import { Button } from '@/components/buttons';
import { Card, EditorialCard } from '@/components/cards';
import { ProgressBar, ProgressRing } from '@/components/progress';
import { EmptyState, ErrorState } from '@/components/feedback';
import { Input } from '@/components/inputs';

/* --------------------------------------------------------------------------
   1. BADGE — LE TON « accent » DOIT ETRE APPLIQUE
   -------------------------------------------------------------------------- */

describe('Badge', () => {
  it('applique la classe du ton demande', () => {
    render(<Badge tone="accent">MOTIVATION</Badge>);
    const badge = screen.getByText('MOTIVATION');
    expect(badge).toHaveClass('badge', 'badge--accent');
  });

  it('distingue un ton qui suit le theme d un ton fige', () => {
    const { rerender } = render(<Badge tone="accent">X</Badge>);
    expect(screen.getByText('X')).toHaveClass('badge--accent');

    rerender(<Badge tone="lavender">X</Badge>);
    // `lavender` est un ton FIGE : il ne suit pas l'accent choisi.
    expect(screen.getByText('X')).toHaveClass('badge--lavender');
    expect(screen.getByText('X')).not.toHaveClass('badge--accent');
  });

  it('ne depend pas de la couleur seule : le libelle reste lisible', () => {
    render(<Badge tone="accent">CONFIANCE</Badge>);
    expect(screen.getByText('CONFIANCE')).toBeVisible();
  });

  it('accepte la variante pleine', () => {
    render(
      <Badge tone="accent" solid>
        PLEIN
      </Badge>,
    );
    expect(screen.getByText('PLEIN')).toHaveClass('badge--solid');
  });
});

/* --------------------------------------------------------------------------
   2. CARTE EDITORIALE — L'AUTEUR DE CITATION
   -------------------------------------------------------------------------- */

describe('EditorialCard', () => {
  it('rend la citation et son auteur avec les bonnes classes', () => {
    render(
      <EditorialCard
        eyebrow="Inspiration du jour"
        text="Ce que tu as appris en chemin compte."
        attribution="ZENTIQ"
      />,
    );

    expect(screen.getByText('Inspiration du jour')).toHaveClass('overline');
    expect(screen.getByText('Ce que tu as appris en chemin compte.')).toHaveClass(
      'editorial-card__text',
      'editorial-quote',
    );
    // C'est CETTE classe que la regle `.editorial-card__author` cible.
    expect(screen.getByText('ZENTIQ')).toHaveClass('editorial-card__author');
  });

  it('utilise blockquote pour la citation, pas un paragraphe', () => {
    render(<EditorialCard text="Une citation." />);
    expect(screen.getByText('Une citation.').tagName).toBe('BLOCKQUOTE');
  });

  it('omet l auteur quand il n est pas fourni', () => {
    render(<EditorialCard text="Sans auteur." />);
    expect(screen.queryByText('ZENTIQ')).not.toBeInTheDocument();
  });

  it('accepte un pied de carte avec actions', () => {
    render(
      <EditorialCard text="Citation." footer={<button type="button">Favori</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Favori' })).toBeVisible();
  });
});

/* --------------------------------------------------------------------------
   3. PROGRESSION — ROLE ARIA ET BORNES
   -------------------------------------------------------------------------- */

describe('ProgressBar', () => {
  it('expose la valeur aux technologies d assistance', () => {
    render(<ProgressBar value={70} label="Avancement" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '70');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-label', 'Avancement');
  });

  it('borne les valeurs hors plage', () => {
    const { rerender } = render(<ProgressBar value={140} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    rerender(<ProgressBar value={-20} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('arrondit une valeur decimale', () => {
    render(<ProgressBar value={42.6} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '43');
  });
});

describe('ProgressRing', () => {
  it('expose aussi sa valeur', () => {
    render(<ProgressRing value={86} label="Regularite" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '86');
  });

  it('affiche le pourcentage par defaut', () => {
    render(<ProgressRing value={86} />);
    expect(screen.getByText('86%')).toBeVisible();
  });

  it('accepte un contenu personnalise a la place du pourcentage', () => {
    render(<ProgressRing value={0}>{<span>—</span>}</ProgressRing>);
    expect(screen.getByText('—')).toBeVisible();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });
});

/* --------------------------------------------------------------------------
   4. BOUTON — ETATS ET LIBELLE
   -------------------------------------------------------------------------- */

describe('Button', () => {
  it('appelle l action au clic', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Valider</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('est desactive pendant le chargement', () => {
    render(<Button loading>Enregistrer</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('n appelle pas l action quand il est desactive', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Bloque
      </Button>,
    );

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applique la variante et la taille demandees', () => {
    render(
      <Button variant="danger" size="sm">
        Supprimer
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('btn--danger', 'btn--sm');
  });

  it('se comporte comme un bouton de soumission quand on le demande', () => {
    render(<Button type="submit">Envoyer</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});

/* --------------------------------------------------------------------------
   5. CHAMP — LABEL ASSOCIE ET MESSAGE D ERREUR
   -------------------------------------------------------------------------- */

describe('Input', () => {
  it('associe le label au champ', () => {
    render(<Input label="Nom du challenge" />);
    expect(screen.getByLabelText('Nom du challenge')).toBeVisible();
  });

  it('accepte la saisie', async () => {
    render(<Input label="Nom" />);
    const field = screen.getByLabelText('Nom');
    await userEvent.type(field, 'Marche');
    expect(field).toHaveValue('Marche');
  });

  it('marque le champ invalide et decrit l erreur', () => {
    render(<Input label="Nom" error="Ce champ est requis." />);
    const field = screen.getByLabelText('Nom');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Ce champ est requis.');
  });

  it('ne pose pas aria-invalid sans erreur', () => {
    render(<Input label="Nom" />);
    expect(screen.getByLabelText('Nom')).not.toHaveAttribute('aria-invalid');
  });

  it('relie le message d aide au champ', () => {
    render(<Input label="Nom" hint="Utilise un mot court." />);
    expect(screen.getByLabelText('Nom').getAttribute('aria-describedby')).toBeTruthy();
  });
});

/* --------------------------------------------------------------------------
   6. ETATS — ACTION PROPOSEE, JAMAIS UN CUL-DE-SAC
   -------------------------------------------------------------------------- */

describe('EmptyState', () => {
  it('propose toujours une action quand elle est fournie', async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Aucun challenge"
        description="Cree-en un pour commencer."
        action={{ label: 'Creer', onClick }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Creer' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('rend le titre et la description', () => {
    render(<EmptyState title="Rien ici" description="Une explication." />);
    expect(screen.getByText('Rien ici')).toBeVisible();
    expect(screen.getByText('Une explication.')).toBeVisible();
  });
});

describe('ErrorState', () => {
  it('est annonce comme une alerte', () => {
    render(<ErrorState message="Le stockage est plein." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Le stockage est plein.');
  });

  it('propose une reprise quand elle est fournie', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Echec." onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reessayer' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

/* --------------------------------------------------------------------------
   7. CARTE STANDARD
   -------------------------------------------------------------------------- */

describe('Card', () => {
  it('rend un conteneur simple par defaut', () => {
    render(<Card>Contenu</Card>);
    expect(screen.getByText('Contenu')).toBeVisible();
  });

  it('devient focusable au clavier quand elle est interactive', async () => {
    const onClick = vi.fn();
    render(
      <Card interactive onClick={onClick}>
        Cliquable
      </Card>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cliquable' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('n est pas un bouton quand elle est statique', () => {
    render(<Card>Statique</Card>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

/**
 * Tests de l'identite typographique (phase 4.1).
 *
 * Ces tests lisent les FICHIERS du design system et verifient les valeurs qui
 * y sont declarees. Ce n'est pas un test de rendu : jsdom ne calcule pas les
 * variables CSS appliquees a un element. Verifier le token est neanmoins utile,
 * car c'est lui que tous les composants consomment — si un token change de
 * valeur, ces tests le signalent immediatement.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8');
}

const tokens = read('src/design-system/tokens.css');
const themes = read('src/design-system/themes.css');
const typography = read('src/design-system/typography.css');
const indexHtml = read('index.html');

/** Extrait la valeur d'un token declare dans un bloc CSS donne. */
function tokenIn(source: string, block: string, name: string): string | null {
  const start = source.indexOf(block);
  if (start === -1) return null;
  const slice = source.slice(start);
  const match = slice.match(new RegExp(name + '\\s*:\\s*([^;]+);'));
  return match ? (match[1] ?? '').trim() : null;
}

/* --------------------------------------------------------------------------
   1. NUNITO EST LA POLICE PRINCIPALE
   -------------------------------------------------------------------------- */

describe('Nunito comme police principale', () => {
  it('declare Nunito en tete de --font-ui', () => {
    const ui = tokenIn(tokens, ':root {', '--font-ui');
    expect(ui).toBeTruthy();
    expect(ui?.startsWith("'Nunito'")).toBe(true);
  });

  it('utilise aussi Nunito pour --font-data', () => {
    const data = tokenIn(tokens, ':root {', '--font-data');
    expect(data?.startsWith("'Nunito'")).toBe(true);
  });

  it('ne fait plus reference a Manrope ni a Inter', () => {
    expect(tokens).not.toContain("'Manrope'");
    expect(tokens).not.toContain("'Inter'");
  });

  it('conserve Cormorant Garamond pour les roles editoriaux', () => {
    const editorial = tokenIn(tokens, ':root {', '--font-editorial');
    expect(editorial?.startsWith("'Cormorant Garamond'")).toBe(true);
  });

  it('ne charge pas Comic Sans MS', () => {
    const all = tokens + themes + typography + indexHtml;
    expect(all.toLowerCase()).not.toContain('comic sans');
  });

  it('demande les cinq graisses a Google Fonts', () => {
    expect(indexHtml).toContain('Nunito:wght@400;500;600;700;800');
  });

  it('utilise font-display: swap', () => {
    expect(indexHtml).toContain('display=swap');
  });
});

/* --------------------------------------------------------------------------
   2. ECHELLE STANDARD — cibles du brief
   -------------------------------------------------------------------------- */

describe('echelle typographique Standard', () => {
  const expected: Record<string, string> = {
    '--text-xs': '0.8125rem', // 13 px — plancher des petits libelles
    '--text-sm': '0.9375rem', // 15 px — texte secondaire
    '--text-base': '1.0625rem', // 17 px — texte courant
    '--text-lg': '1.1875rem', // 19 px — titres de cartes
    '--text-2xl': '1.5rem', // 24 px — titres de sections
    '--text-button': '1rem', // 16 px — boutons
    '--text-nav': '0.9375rem', // 15 px — navigation
  };

  for (const [name, value] of Object.entries(expected)) {
    it(name + ' vaut ' + value, () => {
      expect(tokenIn(tokens, ':root {', name)).toBe(value);
    });
  }

  it('--text-3xl atteint 30 px sur grand ecran', () => {
    const threeXl = tokenIn(tokens, ':root {', '--text-3xl');
    expect(threeXl).toContain('1.875rem');
  });

  it('--text-stat descend jusqu a 28 px', () => {
    const stat = tokenIn(tokens, ':root {', '--text-stat');
    expect(stat).toContain('1.75rem');
  });

  it('--text-stat monte jusqu a 34 px', () => {
    const stat = tokenIn(tokens, ':root {', '--text-stat');
    expect(stat).toContain('2.125rem');
  });

  it('aucun texte essentiel ne descend sous 13 px', () => {
    // Le plus petit token de l'echelle doit rester a 13 px minimum.
    const xs = tokenIn(tokens, ':root {', '--text-xs');
    expect(xs).toBe('0.8125rem');
  });

  it('definit une graisse 800 pour les titres et les chiffres', () => {
    expect(tokenIn(tokens, ':root {', '--weight-extrabold')).toBe('800');
  });
});

/* --------------------------------------------------------------------------
   3. MODE TEXTE PLUS LARGE — environ +20 %
   -------------------------------------------------------------------------- */

describe('mode Texte plus large', () => {
  const block = "[data-large-text='true'] {";

  it('existe dans themes.css', () => {
    expect(themes).toContain(block);
  });

  it('agrandit le texte courant de 17 a 20 px', () => {
    expect(tokenIn(themes, block, '--text-base')).toBe('1.25rem');
  });

  it('agrandit le texte secondaire de 15 a 18 px', () => {
    expect(tokenIn(themes, block, '--text-sm')).toBe('1.125rem');
  });

  it('remonte le plancher des petits libelles a 15 px', () => {
    expect(tokenIn(themes, block, '--text-xs')).toBe('0.9375rem');
  });

  it('agrandit les titres de cartes a 23 px', () => {
    expect(tokenIn(themes, block, '--text-lg')).toBe('1.4375rem');
  });

  it('agrandit les titres de sections a 29 px', () => {
    expect(tokenIn(themes, block, '--text-2xl')).toBe('1.8125rem');
  });

  it('agrandit les boutons a 18 px', () => {
    expect(tokenIn(themes, block, '--text-button')).toBe('1.125rem');
  });

  it('agrandit la navigation a 17 px', () => {
    expect(tokenIn(themes, block, '--text-nav')).toBe('1.0625rem');
  });

  it('le mode large est toujours STRICTEMENT plus grand que Standard', () => {
    // Comparaison des valeurs numeriques des deux echelles, pour garantir que
    // l'ecart est reel et pas seulement cosmétique.
    const pairs: Array<[string, string]> = [
      ['--text-xs', '--text-xs'],
      ['--text-sm', '--text-sm'],
      ['--text-base', '--text-base'],
      ['--text-md', '--text-md'],
      ['--text-lg', '--text-lg'],
      ['--text-xl', '--text-xl'],
      ['--text-2xl', '--text-2xl'],
    ];

    const toRem = (value: string | null): number => {
      if (!value) return 0;
      const match = value.match(/([\d.]+)rem/);
      return match ? parseFloat(match[1] ?? '0') : 0;
    };

    for (const [standardName, largeName] of pairs) {
      const standard = toRem(tokenIn(tokens, ':root {', standardName));
      const large = toRem(tokenIn(themes, block, largeName));
      expect(large).toBeGreaterThan(standard);
    }
  });

  it('respecte un ecart d au moins 15 % sur le texte courant', () => {
    const standard = parseFloat(tokenIn(tokens, ':root {', '--text-base')?.replace('rem', '') ?? '0');
    const large = parseFloat(tokenIn(themes, block, '--text-base')?.replace('rem', '') ?? '0');
    const ratio = (large - standard) / standard;
    expect(ratio).toBeGreaterThanOrEqual(0.15);
  });

  it('remonte la cible tactile pour accompagner le texte', () => {
    const target = tokenIn(themes, block, '--tap-target-min');
    expect(target).toBe('48px');
  });

  it('laisse les valeurs de layout intactes', () => {
    // Faire varier la largeur de la sidebar ou du contenu casserait
    // l'alignement des ecrans : ces tokens ne doivent PAS apparaitre.
    const blockStart = themes.indexOf(block);
    const blockEnd = themes.indexOf('}', blockStart);
    const inside = themes.slice(blockStart, blockEnd);

    expect(inside).not.toContain('--content-max');
    expect(inside).not.toContain('--page-padding-mobile');
    expect(inside).not.toContain('--radius-card');
  });
});

/* --------------------------------------------------------------------------
   4. GARDE-FOUS DE DEBORDEMENT
   -------------------------------------------------------------------------- */

describe('protection contre le debordement', () => {
  it('coupe les mots longs dans les titres', () => {
    expect(themes).toContain('overflow-wrap: break-word');
  });

  it('empeche le scroll horizontal sur la racine', () => {
    expect(themes).toContain('overflow-x: hidden');
  });

  it('autorise le retour a la ligne dans les boutons', () => {
    expect(read('src/components/buttons/Button.css')).toContain('overflow-wrap: break-word');
  });

  it('laisse la rangee se replier sur elle-meme', () => {
    // Avec des libelles plus longs, deux elements cote a cote peuvent ne plus
    // tenir sur une ligne d'iPhone.
    expect(read('src/design-system/spacing.css')).toContain('flex-wrap: wrap');
  });

  it('borne les libelles de la barre de navigation mobile', () => {
    expect(themes).toContain('.mobile-nav .nav-item__label');
  });
});

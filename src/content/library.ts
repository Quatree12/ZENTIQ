/**
 * Banque de contenu éditorial de ZENTIQ.
 *
 * RÔLE DE CE FICHIER
 * ------------------
 * C'est la source de vérité du contenu inspirant livré avec l'application :
 * citations, affirmations et références musicales. Il vit dans le code, et non
 * dans la base utilisateur : c'est du contenu produit par ZENTIQ, pas des
 * données de la personne qui l'utilise. Une mise à jour de ce fichier se
 * déploie avec l'application, sans migration ni écrasement du contenu local.
 *
 * TON ÉDITORIAL
 * -------------
 * Plusieurs contraintes ont guidé chaque ligne :
 *   - jamais culpabilisant : aucun « tu dois », aucun reproche ;
 *   - jamais de comparaison entre personnes ;
 *   - le repos et la pause sont présentés comme légitimes, pas comme un échec ;
 *   - formulations courtes, lisibles d'un coup d'œil.
 *
 * Les références musicales sont des suggestions d'écoute : seuls le titre et
 * l'interprète sont cités. Aucun extrait de paroles n'est reproduit.
 */

import type { InspirationCategory } from '@/types';

/* ==========================================================================
   1. CITATIONS
   ========================================================================== */

export interface QuoteItem {
  id: string;
  text: string;
  author: string;
  category: InspirationCategory;
}

export const QUOTES: QuoteItem[] = [
  /* --- Motivation ------------------------------------------------------- */
  { id: 'q-motivation-1', text: "Tu n'as pas besoin de tout savoir pour commencer. Il suffit d'un pas.", author: 'ZENTIQ', category: 'motivation' },
  { id: 'q-motivation-2', text: 'Commence petit. Petit, répété, devient grand.', author: 'ZENTIQ', category: 'motivation' },
  { id: 'q-motivation-3', text: "L'élan ne précède pas l'action. Il en découle.", author: 'ZENTIQ', category: 'motivation' },
  { id: 'q-motivation-4', text: 'Fais la première minute. Le reste suivra plus facilement que tu ne le crois.', author: 'ZENTIQ', category: 'motivation' },
  { id: 'q-motivation-5', text: "Ce que tu remets à demain n'est pas perdu. Il t'attend simplement.", author: 'ZENTIQ', category: 'motivation' },
  { id: 'q-motivation-6', text: "L'action imparfaite vaut mieux que l'intention parfaite.", author: 'ZENTIQ', category: 'motivation' },

  /* --- Calme ------------------------------------------------------------ */
  { id: 'q-calme-1', text: "Le calme n'est pas l'absence de mouvement, c'est un endroit où se poser.", author: 'ZENTIQ', category: 'calme' },
  { id: 'q-calme-2', text: 'Respire. Rien ne doit être réglé dans la minute.', author: 'ZENTIQ', category: 'calme' },
  { id: 'q-calme-3', text: "Une pause n'est pas un retard. C'est une partie du trajet.", author: 'ZENTIQ', category: 'calme' },
  { id: 'q-calme-4', text: 'Ton corps sait se reposer. Laisse-le faire son travail.', author: 'ZENTIQ', category: 'calme' },
  { id: 'q-calme-5', text: 'Il y a des jours où le plus courageux est de ralentir.', author: 'ZENTIQ', category: 'calme' },
  { id: 'q-calme-6', text: 'Le silence comble mieux que le bruit certaines fatigues.', author: 'ZENTIQ', category: 'calme' },

  /* --- Confiance -------------------------------------------------------- */
  { id: 'q-confiance-1', text: 'Ce que tu répètes devient ce que tu es. Choisis tes répétitions avec soin.', author: 'ZENTIQ', category: 'confiance' },
  { id: 'q-confiance-2', text: 'Tu as déjà traversé des choses que tu croyais ne pas pouvoir traverser.', author: 'ZENTIQ', category: 'confiance' },
  { id: 'q-confiance-3', text: "Ton rythme n'a pas besoin d'être celui de quelqu'un d'autre.", author: 'ZENTIQ', category: 'confiance' },
  { id: 'q-confiance-4', text: "Parle-toi comme tu parlerais à quelqu'un que tu aimes.", author: 'ZENTIQ', category: 'confiance' },
  { id: 'q-confiance-5', text: 'Ce que tu as appris en chemin compte autant que le résultat.', author: 'ZENTIQ', category: 'confiance' },
  { id: 'q-confiance-6', text: "Tu es autorisé à changer d'avis. Ça s'appelle apprendre.", author: 'ZENTIQ', category: 'confiance' },

  /* --- Résilience ------------------------------------------------------- */
  { id: 'q-resilience-1', text: "Revenir après une pause n'est pas repartir de zéro.", author: 'ZENTIQ', category: 'resilience' },
  { id: 'q-resilience-2', text: 'Ta motivation ne disparaît pas. Parfois elle a juste besoin de silence.', author: 'ZENTIQ', category: 'resilience' },
  { id: 'q-resilience-3', text: 'Un jour difficile ne dit rien de la suite.', author: 'ZENTIQ', category: 'resilience' },
  { id: 'q-resilience-4', text: "Rater une fois, c'est une information, pas un verdict.", author: 'ZENTIQ', category: 'resilience' },
  { id: 'q-resilience-5', text: "Tu n'as pas à être productif pour mériter du repos.", author: 'ZENTIQ', category: 'resilience' },
  { id: 'q-resilience-6', text: "Ce qui compte n'est pas de ne jamais tomber, mais la manière dont tu te relèves.", author: 'ZENTIQ', category: 'resilience' },

  /* --- Clarté ----------------------------------------------------------- */
  { id: 'q-clarte-1', text: 'Fais confiance à la lenteur. Elle construit ce que la vitesse disperse.', author: 'ZENTIQ', category: 'clarte' },
  { id: 'q-clarte-2', text: "Une seule chose à la fois. Le reste attendra, et c'est très bien.", author: 'ZENTIQ', category: 'clarte' },
  { id: 'q-clarte-3', text: "Ce qui n'est pas urgent peut être aujourd'hui. Ça peut aussi être demain.", author: 'ZENTIQ', category: 'clarte' },
  { id: 'q-clarte-4', text: 'Demande-toi ce qui compte, pas ce qui presse.', author: 'ZENTIQ', category: 'clarte' },
  { id: 'q-clarte-5', text: 'Écrire une chose la rend plus petite et plus faisable.', author: 'ZENTIQ', category: 'clarte' },
  { id: 'q-clarte-6', text: "Choisir, c'est aussi renoncer. C'est normal, et c'est fécond.", author: 'ZENTIQ', category: 'clarte' },

  /* --- Gratitude -------------------------------------------------------- */
  { id: 'q-gratitude-1', text: "Nomme une chose qui a bien marché aujourd'hui. Même minuscule.", author: 'ZENTIQ', category: 'gratitude' },
  { id: 'q-gratitude-2', text: 'La gratitude ne nie pas les difficultés. Elle les rend moins seules.', author: 'ZENTIQ', category: 'gratitude' },
  { id: 'q-gratitude-3', text: "Ce que tu as construit mérite d'être remarqué par toi, d'abord.", author: 'ZENTIQ', category: 'gratitude' },
  { id: 'q-gratitude-4', text: "Remercier une personne aujourd'hui coûte trente secondes.", author: 'ZENTIQ', category: 'gratitude' },
  { id: 'q-gratitude-5', text: 'Les meilleurs jours ne sont pas les plus spectaculaires.', author: 'ZENTIQ', category: 'gratitude' },
  { id: 'q-gratitude-6', text: 'Regarde le chemin parcouru, pas seulement celui qui reste.', author: 'ZENTIQ', category: 'gratitude' },

  /* --- Courage ---------------------------------------------------------- */
  { id: 'q-courage-1', text: "Le courage, souvent, c'est juste continuer un peu.", author: 'ZENTIQ', category: 'courage' },
  { id: 'q-courage-2', text: "Demander de l'aide est une force, pas un aveu.", author: 'ZENTIQ', category: 'courage' },
  { id: 'q-courage-3', text: "Dire non à une chose, c'est dire oui à une autre.", author: 'ZENTIQ', category: 'courage' },
  { id: 'q-courage-4', text: "Tu peux avancer même sans certitude. C'est ainsi que tout commence.", author: 'ZENTIQ', category: 'courage' },
  { id: 'q-courage-5', text: 'Nommer ce qui fait peur lui retire une partie de son pouvoir.', author: 'ZENTIQ', category: 'courage' },
  { id: 'q-courage-6', text: "Il n'est jamais trop tard pour changer une habitude de vie.", author: 'ZENTIQ', category: 'courage' },

  /* --- Focus ------------------------------------------------------------ */
  { id: 'q-focus-1', text: "Ferme une porte. La clarté vient souvent de ce qu'on décide d'ignorer.", author: 'ZENTIQ', category: 'focus' },
  { id: 'q-focus-2', text: 'Vingt minutes sans interruption valent mieux que trois heures morcelées.', author: 'ZENTIQ', category: 'focus' },
  { id: 'q-focus-3', text: "Prépare ton environnement : c'est plus facile que de préparer ta volonté.", author: 'ZENTIQ', category: 'focus' },
  { id: 'q-focus-4', text: 'Écris la prochaine action, pas le projet entier.', author: 'ZENTIQ', category: 'focus' },
  { id: 'q-focus-5', text: "La concentration n'est pas un talent, c'est une habitude de mise en place.", author: 'ZENTIQ', category: 'focus' },
  { id: 'q-focus-6', text: "Termine une chose avant d'en ouvrir une autre.", author: 'ZENTIQ', category: 'focus' },
];

/* ==========================================================================
   2. AFFIRMATIONS
   ==========================================================================
   À la première personne, au présent. Une affirmation est dite par la personne
   qui la lit : elle doit pouvoir la prononcer sans se sentir en porte-à-faux.
   ========================================================================== */

export interface AffirmationItem {
  id: string;
  text: string;
  category: InspirationCategory;
}

export const AFFIRMATIONS: AffirmationItem[] = [
  { id: 'a-confiance-1', text: "J'apprends à mon rythme, et ce rythme me convient.", category: 'confiance' },
  { id: 'a-confiance-2', text: "Ce que je fais aujourd'hui compte, même si personne ne le voit.", category: 'confiance' },
  { id: 'a-confiance-3', text: 'Je peux être imparfait et avancer quand même.', category: 'confiance' },
  { id: 'a-confiance-4', text: "Je mérite la même bienveillance que celle que j'offre aux autres.", category: 'confiance' },
  { id: 'a-confiance-5', text: "Je n'ai rien à prouver pour avoir le droit de prendre ma place.", category: 'confiance' },

  { id: 'a-calme-1', text: 'Je respire, et le reste peut attendre.', category: 'calme' },
  { id: 'a-calme-2', text: 'Je choisis la lenteur quand elle me fait du bien.', category: 'calme' },
  { id: 'a-calme-3', text: 'Mon repos fait partie de mon travail.', category: 'calme' },
  { id: 'a-calme-4', text: "Je n'ai pas à répondre immédiatement à tout.", category: 'calme' },
  { id: 'a-calme-5', text: 'Je peux poser ce que je porte, un moment.', category: 'calme' },

  { id: 'a-resilience-1', text: "Après une pause, je reprends là où je suis, pas là où j'étais.", category: 'resilience' },
  { id: 'a-resilience-2', text: "Un jour creux ne défait pas ce que j'ai construit.", category: 'resilience' },
  { id: 'a-resilience-3', text: 'Je peux recommencer autant de fois que nécessaire.', category: 'resilience' },
  { id: 'a-resilience-4', text: 'Mes difficultés ne me définissent pas.', category: 'resilience' },
  { id: 'a-resilience-5', text: 'Je suis en mouvement, même quand je ne le vois pas.', category: 'resilience' },

  { id: 'a-clarte-1', text: "Je fais une chose à la fois, et c'est suffisant.", category: 'clarte' },
  { id: 'a-clarte-2', text: 'Je sais reconnaître ce qui peut attendre.', category: 'clarte' },
  { id: 'a-clarte-3', text: 'Je peux dire non sans me justifier longuement.', category: 'clarte' },
  { id: 'a-clarte-4', text: 'Je choisis ce qui compte, pas ce qui fait du bruit.', category: 'clarte' },
  { id: 'a-clarte-5', text: "Écrire m'aide à voir plus clair.", category: 'clarte' },

  { id: 'a-gratitude-1', text: "Je remarque ce qui va bien, même quand c'est discret.", category: 'gratitude' },
  { id: 'a-gratitude-2', text: 'Je remercie le chemin déjà parcouru.', category: 'gratitude' },
  { id: 'a-gratitude-3', text: "J'accueille aujourd'hui comme il vient.", category: 'gratitude' },
  { id: 'a-gratitude-4', text: "J'ai des raisons d'être fier, et j'ai le droit de les nommer.", category: 'gratitude' },
];

/* ==========================================================================
   3. INSPIRATIONS MUSICALES
   ==========================================================================
   Suggestions d'écoute, par moment de la journée. Seuls le titre et
   l'interprète sont cités — aucun extrait de paroles, aucun lien imposé.
   ========================================================================== */

export type MusicMoment = 'matin' | 'focus' | 'effort' | 'soir';

export interface MusicItem {
  id: string;
  title: string;
  artist: string;
  note: string;
  category: InspirationCategory;
  moment: MusicMoment;
}

export const MUSIC: MusicItem[] = [
  { id: 'm-matin-1', title: 'Clair de Lune', artist: 'Claude Debussy', note: "Pour ouvrir la journée sans brusquerie. À écouter avant d'allumer le téléphone.", category: 'calme', moment: 'matin' },
  { id: 'm-matin-2', title: 'Gymnopédie No. 1', artist: 'Erik Satie', note: 'Une respiration avant de commencer. Trois minutes qui ralentissent tout.', category: 'calme', moment: 'matin' },
  { id: 'm-matin-3', title: 'Nuvole Bianche', artist: 'Ludovico Einaudi', note: 'Pour un réveil progressif, quand la journée demande de la douceur.', category: 'clarte', moment: 'matin' },
  { id: 'm-matin-4', title: 'Here Comes the Sun', artist: 'The Beatles', note: "Un classique qui remet les choses à l'endroit.", category: 'gratitude', moment: 'matin' },
  { id: 'm-matin-5', title: 'Feeling Good', artist: 'Nina Simone', note: "Une voix qui redonne de l'élan dès le réveil.", category: 'confiance', moment: 'matin' },
  { id: 'm-matin-6', title: 'Sunrise', artist: 'Norah Jones', note: 'Douceur et lumière, pour un matin sans précipitation.', category: 'calme', moment: 'matin' },

  { id: 'm-focus-1', title: 'Experience', artist: 'Ludovico Einaudi', note: 'Pour un travail qui demande de la continuité.', category: 'focus', moment: 'focus' },
  { id: 'm-focus-2', title: 'Time', artist: 'Hans Zimmer', note: 'Pour entrer dans une tâche longue et y rester.', category: 'focus', moment: 'focus' },
  { id: 'm-focus-3', title: 'Weightless', artist: 'Marconi Union', note: "Conçu pour apaiser. Utile quand l'attention part dans tous les sens.", category: 'calme', moment: 'focus' },
  { id: 'm-focus-4', title: "Comptine d'un autre été", artist: 'Yann Tiersen', note: 'Répétitif sans être monotone : idéal pour tenir une heure.', category: 'focus', moment: 'focus' },
  { id: 'm-focus-5', title: 'Avril 14th', artist: 'Aphex Twin', note: 'Court, net, sans distraction. Pour relancer une session.', category: 'focus', moment: 'focus' },
  { id: 'm-focus-6', title: 'Spiegel im Spiegel', artist: 'Arvo Pärt', note: "Un fond sonore qui ne capte pas l'attention. C'est tout son mérite.", category: 'clarte', moment: 'focus' },

  { id: 'm-effort-1', title: 'Eye of the Tiger', artist: 'Survivor', note: "Pour l'effort physique et les derniers kilomètres.", category: 'motivation', moment: 'effort' },
  { id: 'm-effort-2', title: "Don't Stop Me Now", artist: 'Queen', note: "Quand il faut finir par orgueil, c'est-à-dire pour soi.", category: 'courage', moment: 'effort' },
  { id: 'm-effort-3', title: 'Stronger', artist: 'Kanye West', note: 'Un tempo qui porte. À garder pour les passages durs.', category: 'resilience', moment: 'effort' },
  { id: 'm-effort-4', title: 'Titanium', artist: 'David Guetta feat. Sia', note: 'Pour tenir la dernière série.', category: 'resilience', moment: 'effort' },
  { id: 'm-effort-5', title: 'Hall of Fame', artist: 'The Script feat. will.i.am', note: 'Dirigée vers soi-même, pas vers une comparaison.', category: 'motivation', moment: 'effort' },
  { id: 'm-effort-6', title: 'Till I Collapse', artist: 'Eminem', note: 'Pour les entraînements où la tête doit suivre le corps.', category: 'courage', moment: 'effort' },

  { id: 'm-soir-1', title: 'Blue in Green', artist: 'Miles Davis', note: 'Pour refermer la journée sans la commenter.', category: 'calme', moment: 'soir' },
  { id: 'm-soir-2', title: 'The Nearness of You', artist: 'Norah Jones', note: 'Douceur pour la fin de soirée, lumière baissée.', category: 'gratitude', moment: 'soir' },
  { id: 'm-soir-3', title: 'Rêverie', artist: 'Claude Debussy', note: 'Pour laisser les pensées ralentir avant le sommeil.', category: 'calme', moment: 'soir' },
  { id: 'm-soir-4', title: 'Holocene', artist: 'Bon Iver', note: 'Un morceau qui prend son temps, pour un soir qui prend le sien.', category: 'clarte', moment: 'soir' },
  { id: 'm-soir-5', title: 'Moon River', artist: 'Audrey Hepburn', note: 'Pour une soirée tranquille, sans rien à accomplir.', category: 'calme', moment: 'soir' },
  { id: 'm-soir-6', title: 'Goodnight', artist: 'Norah Jones', note: "Le titre le dit : c'est le moment d'arrêter.", category: 'calme', moment: 'soir' },
];

/* ==========================================================================
   4. INSPIRATION DU JOUR
   ========================================================================== */

/** Hash déterministe (FNV-1a 32 bits) — même entrée, même sortie. */
function stableHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Citation du jour, stable pour la date passée en argument. */
export function quoteOfTheDay(dateKey: string): QuoteItem {
  const index = stableHash(dateKey) % QUOTES.length;
  return QUOTES[index] ?? (QUOTES[0] as QuoteItem);
}

/** Affirmation du jour, stable pour la date passée en argument. */
export function affirmationOfTheDay(dateKey: string): AffirmationItem {
  const index = stableHash('affirmation-' + dateKey) % AFFIRMATIONS.length;
  return AFFIRMATIONS[index] ?? (AFFIRMATIONS[0] as AffirmationItem);
}

/* ==========================================================================
   5. ACCÈS & RECHERCHE
   ========================================================================== */

export const CONTENT_COUNTS = {
  quotes: QUOTES.length,
  affirmations: AFFIRMATIONS.length,
  music: MUSIC.length,
} as const;

/** Citations d'une catégorie donnée. */
export function quotesByCategory(category: InspirationCategory): QuoteItem[] {
  return QUOTES.filter((item) => item.category === category);
}

/** Affirmations d'une catégorie donnée. */
export function affirmationsByCategory(category: InspirationCategory): AffirmationItem[] {
  return AFFIRMATIONS.filter((item) => item.category === category);
}

/** Références musicales d'un moment donné. */
export function musicByMoment(moment: MusicMoment): MusicItem[] {
  return MUSIC.filter((item) => item.moment === moment);
}

/**
 * Recherche plein texte, insensible à la casse et aux accents.
 * Volontairement simple : le volume de contenu reste faible, et une recherche
 * locale immédiate vaut mieux qu'un index coûteux à maintenir.
 */
export function searchContent(query: string): {
  quotes: QuoteItem[];
  affirmations: AffirmationItem[];
  music: MusicItem[];
} {
  const needle = normalize(query);
  if (!needle) {
    return { quotes: QUOTES, affirmations: AFFIRMATIONS, music: MUSIC };
  }

  const matches = (haystack: string) => normalize(haystack).includes(needle);

  return {
    quotes: QUOTES.filter((item) => matches(item.text) || matches(item.author)),
    affirmations: AFFIRMATIONS.filter((item) => matches(item.text)),
    music: MUSIC.filter((item) => matches(item.title) || matches(item.artist) || matches(item.note)),
  };
}

/** Normalise pour la recherche : minuscules, sans accents. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Toutes les catégories réellement représentées dans la banque. */
export const AVAILABLE_CATEGORIES: InspirationCategory[] = Array.from(
  new Set([
    ...QUOTES.map((item) => item.category),
    ...AFFIRMATIONS.map((item) => item.category),
    ...MUSIC.map((item) => item.category),
  ]),
);

/** Les moments d'écoute réellement représentés. */
export const AVAILABLE_MOMENTS: MusicMoment[] = Array.from(
  new Set(MUSIC.map((item) => item.moment)),
);

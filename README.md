# ZENTIQ

> **Your mind. Your momentum.**

Application PWA **local-first** de motivation et de developpement personnel.
Citations, affirmations, inspirations musicales, suivi d'humeur, objectifs,
habitudes, challenges, journal personnel et progression — le tout fonctionnant
**hors ligne**.

---

## Etat actuel

Le projet est **fonctionnel et deploye** sur
[quatree12.github.io/ZENTIQ](https://quatree12.github.io/ZENTIQ/).

Les sept phases de construction sont achevees : fondations, UI kit, cinq
ecrans, base locale, fonctionnalites, PWA, et QA.

**Ce qui fonctionne, verifie sur donnees reelles :**

- les cinq espaces (Today, Inspire, Grow, Journey, Me)
- 96 contenus editoriaux (48 citations, 24 affirmations, 24 musiques)
- recherche locale, filtres, favoris
- humeur quotidienne, objectifs, habitudes, journal
- statistiques de Journey (moyenne, courbe, regularite, progres des objectifs)
- challenges avec leur cycle complet (creation, validation, rattrapage, fin)
- persistance IndexedDB, export et import JSON
- PWA installable, fonctionnant hors ligne
- 60 tests automatises en integration continue

**Ce qui reste a faire :**

- `package-lock.json` — necessite un `npm install` depuis un terminal
- les avertissements de depreciation du workflow (actions GitHub sous Node 20)
- les fonctionnalites produit avancees : challenges personnalises, analytique de
tendances, notifications a heure fixe

---

## Stack

| Domaine | Choix |
| --- | --- |
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Routing | React Router (SPA) |
| State | Zustand |
| Stockage local | IndexedDB via Dexie 4 |
| Styles | CSS natif + variables CSS |
| Icones | Lucide |
| Tests | Vitest + Testing Library |
| Offline / install | Service Worker + Web App Manifest |

---

## Demarrage

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + build de production
npm run preview    # sert le build (necessaire pour tester le service worker)
npm run typecheck  # tsc --noEmit
npm run test       # tests Vitest
```

> Le **service worker** n'est actif qu'en production. Pour le tester : `npm run build && npm run preview`.

---

## Structure

```
ZENTIQ/
├── public/                 assets statiques, manifest, offline.html
├── src/
│   ├── app/                bootstrap, router, providers, config
│   ├── design-system/      tokens, typographie, spacing, reset, themes
│   ├── components/         design system de composants (buttons, cards, ...)
│   ├── content/            banque editoriale (citations, affirmations, musique)
│   ├── layouts/            AppLayout, Sidebar, MobileDrawer, PageHeader
│   ├── pages/              Today / Inspire / Grow / Journey / Me
│   ├── database/           Dexie + schema + migrations + repositories
│   ├── stores/             Zustand
│   ├── services/           storage, export, import, notifications, offline
│   ├── hooks/              hooks metier
│   ├── types/              modeles types
│   └── utils/              dates, formatters, validators, calculs statistiques
├── tests/                  composants / statistiques / challenges / typographie
├── index.html
├── vite.config.ts
└── tsconfig.json
```

Detail de l'architecture, du modele de donnees et des decisions techniques :
**[`ARCHITECTURE.md`](./ARCHITECTURE.md)**.

---

## Identite visuelle

Direction artistique **DIGITAL AURA x LAVENDER MIND** — dark-only, premium
digital wellness.

| Token | Hex | Role |
| --- | --- | --- |
| Deep Space | `#0D1015` | Fond principal |
| Night Surface | `#1C2430` | Cartes & panneaux |
| Slate Blue | `#34445A` | Bordures & surfaces secondaires |
| Digital Teal | `#72C8C1` | Actions, progression, validation |
| Lavender Mind | `#A99ACB` | Inspiration, reflexion, emotions |
| Soft Mist | `#E0F0ED` | Texte principal |

Toutes les couleurs vivent dans `src/design-system/tokens.css`.
**Aucun hexadecimal arbitraire dans un composant.**

Typographie : **Nunito** (interface) · **Montserrat** (citations et titres editoriaux).

---

## Vie privee

Les donnees personnelles sont stockees **localement, sur l'appareil de
l'utilisateur** (IndexedDB). Aucune synchronisation cloud n'est implementee, et
aucune donnee n'est transmise a un serveur. Export et import JSON disponibles
depuis l'espace ME.

---

## Licence

Proprietaire — tous droits reserves. Voir [`LICENSE`](./LICENSE).

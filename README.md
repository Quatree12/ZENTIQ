# ZENTIQ

> **Your mind. Your momentum.**

Application PWA **local-first** de motivation et de développement personnel.
Citations, affirmations, inspirations musicales, suivi d'humeur, objectifs, habitudes,
challenges, journal personnel et progression — le tout fonctionnant **hors ligne**.

---

## Statut de cette phase

**Phase 01 — Fondations, architecture & design system.**

Cette phase livre la **base technique et visuelle** du produit : configuration, design system,
composants UI, navigation, structure de pages, IndexedDB, PWA.

**Les cinq espaces (`Today`, `Inspire`, `Grow`, `Journey`, `Me`) sont des squelettes
fonctionnels** : leur structure, leur routing et leurs états sont en place et branchés sur la
base locale, mais leurs fonctionnalités métier complètes arrivent dans les phases suivantes.
Le fichier [`ARCHITECTURE.md`](./ARCHITECTURE.md) liste précisément ce qui est fait et ce qui
ne l'est pas.

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
| Offline / install | Service Worker + Web App Manifest |

Aucune dépendance superflue. Pas de framework CSS, pas de librairie de composants :
le design system est interne et centralisé.

---

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + build de production
npm run preview    # sert le build (nécessaire pour tester le service worker)
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
│   ├── design-system/      tokens, typographie, spacing, reset, index
│   ├── components/         design system de composants (buttons, cards, ...)
│   ├── layouts/            AppLayout, Sidebar, MobileDrawer, PageHeader
│   ├── pages/              Today / Inspire / Grow / Journey / Me
│   ├── database/           Dexie + schéma + migrations + repositories
│   ├── stores/             Zustand
│   ├── services/           storage, export, import, notifications, offline
│   ├── hooks/              hooks métier
│   ├── types/              modèles typés
│   └── utils/              dates, formatters, validators
├── tests/                  components / database / integration
├── index.html
├── vite.config.ts
└── tsconfig.json
```

Détail de l'architecture, du modèle de données et des décisions techniques :
**[`ARCHITECTURE.md`](./ARCHITECTURE.md)**.

---

## Identité visuelle

Direction artistique **DIGITAL AURA × LAVENDER MIND** — dark-only, premium digital wellness.

| Token | Hex | Rôle |
| --- | --- | --- |
| Deep Space | `#0D1015` | Fond principal |
| Night Surface | `#1C2430` | Cartes & panneaux |
| Slate Blue | `#34445A` | Bordures & surfaces secondaires |
| Digital Teal | `#72C8C1` | Actions, progression, validation |
| Lavender Mind | `#A99ACB` | Inspiration, réflexion, émotions |
| Soft Mist | `#E0F0ED` | Texte principal |

Toutes les couleurs vivent dans `src/design-system/tokens.css`.
**Aucun hexadécimal arbitraire dans un composant** — tout passe par une variable du design system.

Typographie : **Manrope** (interface) · **Inter** (données) · **Cormorant Garamond** (titres éditoriaux).

---

## Vie privée

Les données personnelles sont stockées **localement, sur l'appareil de l'utilisateur**
(IndexedDB). Aucune synchronisation cloud n'est implémentée dans cette phase, et aucune donnée
n'est transmise à un serveur. Export / import JSON disponibles depuis l'espace `ME`.

---

## Licence

Propriétaire — tous droits réservés.

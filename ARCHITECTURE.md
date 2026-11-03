# ZENTIQ — Architecture (Phase 01)

Ce document est la **référence** des phases suivantes : il décrit ce qui existe, pourquoi,
et ce qui reste à construire.

---

## 1. Principes directeurs

1. **Local-first.** IndexedDB est la source de vérité. L'UI lit la base, jamais un cache réseau.
2. **Offline-first.** Aucune fonctionnalité essentielle ne dépend du réseau. Le réseau n'est
   nécessaire que pour installer/mettre à jour l'application.
3. **Modulaire.** Chaque dossier a une responsabilité unique et claire. Pas de version
   concurrente d'un même composant.
4. **Typé.** `strict` + `noUncheckedIndexedAccess`. Les modèles vivent dans `types/`, les
   schémas Dexie dans `database/schema.ts`.
5. **Design system centralisé.** `tokens.css` est la seule source de couleurs, d'espacements,
   de radius et de transitions. Les composants consomment des variables, jamais des hex.

---

## 2. Flux de données

```
  Composant (pages/…)
        │  lit via
        ▼
  hooks/use*.ts            ← point d'entrée recommandé pour l'UI
        │  appelle
        ▼
  stores/*.store.ts        ← état d'écran + orchestration + statuts
        │  délègue la persistance à
        ▼
  database/repositories/*  ← requêtes Dexie, une seule source de vérité
        │
        ▼
  Dexie → IndexedDB

  services/  → opérations transverses : export, import, stockage, offline, notifications
```

**Règle :** un composant ne parle jamais directement à Dexie. Il passe par un hook ou un store.
Cela garde les composants testables et la persistance remplaçable.

---

## 3. Arborescence et responsabilités

| Chemin | Responsabilité |
| --- | --- |
| `app/` | Bootstrap : providers, router, configuration globale |
| `design-system/` | Tokens et CSS de base (couleurs, typo, spacing, reset) |
| `components/` | Composants UI réutilisables, groupés par famille |
| `layouts/` | Coquille applicative : sidebar desktop, drawer mobile, en-tête de page |
| `pages/` | Un dossier par espace, un fichier par section |
| `database/` | Dexie, schéma versionné, migrations, repositories |
| `stores/` | État applicatif et orchestration (Zustand) |
| `services/` | Opérations transverses (I/O, export/import, offline) |
| `hooks/` | Hooks métier qui exposent database + stores à l'UI |
| `types/` | Modèles de données typés |
| `utils/` | Fonctions pures (dates, formatters, validators) |

---

## 4. Modèle de données

Tous les modèles portent `id` (uuid), `createdAt`, `updatedAt`.

| Modèle | Table Dexie | Rôle | Index principaux |
| --- | --- | --- | --- |
| `UserProfile` | `profile` | Identité locale, prénom, intention | `id` |
| `UserSettings` | `settings` | Préférences, accessibilité, confidentialité | `id` |
| `MoodEntry` | `moods` | Check-in d'humeur | `id`, `date`, `mood`, `createdAt` |
| `Goal` | `goals` | Objectif personnel | `id`, `status`, `targetDate` |
| `Habit` | `habits` | Habitude à ancrer | `id`, `archived`, `createdAt` |
| `HabitCompletion` | `habitCompletions` | Une coche d'habitude pour un jour | `id`, `habitId`, `date`, `[habitId+date]` |
| `Challenge` | `challenges` | Challenge multi-jours | `id`, `status`, `startDate` |
| `JournalEntry` | `journal` | Entrée de journal | `id`, `date`, `createdAt` |
| `Quote` | `quotes` | Citation du contenu | `id`, `category`, `favorite` |
| `Affirmation` | `affirmations` | Affirmation positive | `id`, `category`, `favorite` |
| `MusicInspiration` | `music` | Référence musicale inspirante | `id`, `category` |
| `Favorite` | `favorites` | Référence générique vers un contenu aimé | `id`, `refType`, `refId`, `[refType+refId]` |

### Versioning du schéma

- `CURRENT_SCHEMA_VERSION` (dans `database/schema.ts`) décrit la version attendue.
- `database/migrations.ts` exécute les migrations Dexie (`.version(n).upgrade()`).
- À l'ouverture, `db.ts` compare la version déployée à `CURRENT_SCHEMA_VERSION` et journalise
  dans la table `meta` (clés `schema:lastOpened`, `schema:history`).
- Toute migration future **ajoute** une version ; elle n'en modifie jamais une existante.

### Export / import

Document `kind: "zentiq-backup"`, `schemaVersion`, `exportedAt`, `data{}` par table.
L'import valide le document, refuse un `schemaVersion` supérieur, puis restaure table par table.

---

## 5. Design system

Ordre de chargement :
`tokens.css` → `reset.css` → `themes.css` (dark-only) → `typography.css` → `spacing.css`
→ `index.css` (agrégateur, seul fichier importé par `main.tsx`).

Échelles :

- **Spacing** : base 4 px → `--space-1` … `--space-24`.
- **Radius** : cartes 22 px, boutons 14 px, champs 12 px.
- **Transition** : 220 ms, `--ease-standard`.
- **Layout** : sidebar 240 px, contenu max 1100 px, padding desktop 32 px, mobile 20 px.
- **Typo** : `clamp()` pour rester lisible de 320 px à 1440 px+.

### Contraste (WCAG AA)

Les tokens sont calibrés pour AA : `--color-text-primary` (`#E0F0ED`) et `--color-text-secondary`
sur `--color-bg` / `--color-surface` atteignent ≥ 4.5:1.

**Deux exceptions assumées**, documentées dans `tokens.css` :
- Le texte sur aplat **Digital Teal** (`#72C8C1`) utilise `--color-text-on-accent` (foncé) et non du
  blanc : blanc sur teal échoue AA (~2.2:1).
- **Placeholder** et texte désactivé sont à ~4.0:1 : acceptable pour du texte non essentiel,
  sous AA strict — à reprendre en phase accessibilité.

---

## 6. PWA & offline

- `public/manifest.webmanifest` : nom, couleurs, `display: standalone`, icônes 192/512 + maskable.
- `vite-plugin-pwa` (`strategies: 'generateSW'`) précache les assets du build.
- `registerType: 'prompt'` : **aucune mise à jour silencieuse**. L'utilisateur décide.
- `src/services/offline.service.ts` : enregistrement du SW, détection `online`/`offline`,
  détection de mise à jour disponible, application à la demande.
- `public/offline.html` : filet de sécurité hors ligne.

---

## 7. État réel des cinq espaces (Phase 01)

| Espace | Squelette | Ce qui est fonctionnel | À venir |
| --- | --- | --- | --- |
| `Today` | Oui | Citation du jour, mood check-in (écriture), progression du jour | Recommandations, résumé enrichi |
| `Inspire` | Oui | Recherche locale, favoris | Bibliothèque réelle (citations/affirmations/musique), filtres par catégorie |
| `Grow` | Oui | CRUD objectifs + habitudes, coche du jour | Challenges, séries, rappels |
| `Journey` | Oui | Journal (écriture), historique d'humeur, timeline | Statistiques, tendances, visualisations |
| `Me` | Oui | Profil, préférences persistées, export/import/stats/reset | Notifications réelles, thèmes |

Chaque page possède : un état vide, un état de chargement et un état d'erreur.
Aucun bouton décoratif : **chaque action visible appelle un store ou un service**.

---

## 8. Conventions de code

- Imports absolus via `@/` (alias dans `tsconfig.json` **et** `vite.config.ts`).
- CSS : un fichier `.css` par composant, importé par le composant ; pas de CSS-in-JS.
- Nommage : `PascalCase.tsx` pour les composants, `camelCase.ts` pour le reste.
- Aucune couleur littérale dans un `.tsx` ou un `.css` de composant.
- `zustand` : un store par domaine, sélecteurs explicites dans les composants.

---

## 9. Roadmap des phases suivantes

1. **Contenu & curation** — banque de citations/affirmations/musique, catégories, recherche.
2. **Grow complet** — challenges, séries, rappels, objectifs liés aux habitudes.
3. **Journey analytique** — tendances d'humeur, corrélations habitudes/humeur, graphiques.
4. **Personnalisation** — thèmes d'accent, densité, objectifs de notification.
5. **Qualité** — audit accessibilité AA complet, tests d'intégration, budget de performance.

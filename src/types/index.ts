/**
 * Modeles de base et re-exports.
 *
 * Les composants importent depuis '@/types' — jamais depuis un fichier profond —
 * pour qu'une reorganisation interne ne casse pas les imports.
 */

/* --------------------------------------------------------------------------
   Types de base — declares ICI et exportes directement.
   -------------------------------------------------------------------------- */

/** Champs communs a toutes les entites persistees. */
export interface BaseEntity {
  /** Identifiant unique, genere cote client (uuid v4). */
  id: string;
  /** Date de creation, ISO 8601. */
  createdAt: string;
  /** Date de derniere modification, ISO 8601. */
  updatedAt: string;
}

/**
 * Champs optionnels de synchronisation.
 *
 * RESERVE : aucune synchronisation cloud n'est implementee a ce stade. Ces
 * champs existent uniquement pour eviter une migration cassante le jour ou une
 * synchronisation optionnelle serait ajoutee. Ils restent `undefined`.
 */
export interface SyncableEntity {
  syncState?: 'local' | 'pending' | 'synced';
  remoteId?: string;
  syncedAt?: string;
}

/** Alias : une entite horodatee est une entite de base. */
export type TimestampedEntity = BaseEntity;

/** Niveaux d'humeur — echelle courte (1..5), non culpabilisante. */
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type EntityId = string;

/**
 * Union des tables exportables, utilisee par les services d'export/import.
 *
 * Pas de `meta` : la table technique est exclue des sauvegardes, et l'inclure
 * ici laisserait croire le contraire a qui lit ce type.
 */
export type TableName =
  | 'profile'
  | 'settings'
  | 'moods'
  | 'goals'
  | 'habits'
  | 'habitCompletions'
  | 'challenges'
  | 'journal'
  | 'quotes'
  | 'affirmations'
  | 'music'
  | 'favorites';

/* --------------------------------------------------------------------------
   Modeles du domaine
   -------------------------------------------------------------------------- */

export type { UserProfile, UserSettings } from './user.types';
export { DEFAULT_SETTINGS_VALUES } from './user.types';

export type { MoodEntry } from './mood.types';
export { MOOD_LABELS, MOOD_LEVELS } from './mood.types';

export type { Goal, GoalStatus, GoalHorizon } from './goal.types';
export { GOAL_STATUS_LABELS, GOAL_HORIZON_LABELS } from './goal.types';

/* Habitudes et challenges.

   CHALLENGE DAY, MILESTONE ET RHYTHM DOIVENT FIGURER ICI.

   `ChallengeDay` : sans lui, les composants qui lisent les etapes d'un
   challenge recoivent un type incomplet et le compilateur signale
   « Property 'dayNumber' does not exist ».

   `ChallengeMilestone` et `ChallengeRhythm` : le repository des challenges les
   importe depuis '@/types'. Les oublier ici ne casse pas les types eux-memes,
   mais rend le repository incompilable — ce qui est exactement ce qui s'est
   produit. Un type declare dans un module profond doit TOUJOURS etre repris
   dans ce point d'entree. */
export type {
  Habit,
  HabitCompletion,
  HabitFrequency,
  Challenge,
  ChallengeStatus,
  ChallengeDay,
  ChallengeRhythm,
  ChallengeRhythmConfig,
  ChallengeMilestone,
} from './habit.types';
export {
  HABIT_FREQUENCY_LABELS,
  CHALLENGE_STATUS_LABELS,
  CHALLENGE_RHYTHM_LABELS,
  CHALLENGE_DURATIONS,
  challengeProgress,
  challengeRhythm,
  rhythmPeriodDays,
  rhythmTargetPerPeriod,
  rhythmStatus,
} from './habit.types';

export type { JournalEntry, TimelinePoint } from './journal.types';

export type {
  Quote,
  Affirmation,
  MusicInspiration,
  Favorite,
  InspirationItem,
  InspirationCategory,
  InspirationKind,
} from './inspiration.types';
export { INSPIRATION_CATEGORY_LABELS } from './inspiration.types';

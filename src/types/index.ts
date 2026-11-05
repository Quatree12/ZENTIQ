/**
 * Modèles de base et ré-exports.
 *
 * Les composants importent depuis '@/types' — jamais depuis un fichier profond —
 * pour qu'une réorganisation interne ne casse pas les imports.
 */

/* --------------------------------------------------------------------------
   Types de base — déclarés ICI et exportés directement.
   --------------------------------------------------------------------------
   Ces types étaient auparavant « réexportés » depuis './index', c'est-à-dire
   depuis ce fichier lui-même : un import circulaire qui empêchait TypeScript de
   résoudre BaseEntity, et faisait perdre id / createdAt / updatedAt à tous les
   modèles qui en héritent (Goal, Habit, Favorite…).
   -------------------------------------------------------------------------- */

/** Champs communs à toutes les entités persistées. */
export interface BaseEntity {
  /** Identifiant unique, généré côté client (uuid v4). */
  id: string;
  /** Date de création, ISO 8601. */
  createdAt: string;
  /** Date de dernière modification, ISO 8601. */
  updatedAt: string;
}

/**
 * Champs optionnels de synchronisation.
 *
 * RÉSERVE : aucune synchronisation cloud n'est implémentée à ce stade. Ces
 * champs existent uniquement pour éviter une migration cassante le jour où une
 * synchronisation optionnelle serait ajoutée. Ils restent `undefined`.
 */
export interface SyncableEntity {
  syncState?: 'local' | 'pending' | 'synced';
  remoteId?: string;
  syncedAt?: string;
}

/** Alias : une entité horodatée est une entité de base. */
export type TimestampedEntity = BaseEntity;

/** Niveaux d'humeur — échelle courte (1..5), non culpabilisante. */
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type EntityId = string;

/** Union des tables exportables, utilisée par les services d'export/import. */
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
  | 'favorites'
  | 'meta';

/* --------------------------------------------------------------------------
   Modèles du domaine
   -------------------------------------------------------------------------- */

export type { UserProfile, UserSettings } from './user.types';
export { DEFAULT_SETTINGS_VALUES } from './user.types';

export type { MoodEntry } from './mood.types';
export { MOOD_LABELS, MOOD_LEVELS } from './mood.types';

export type { Goal, GoalStatus, GoalHorizon } from './goal.types';
export { GOAL_STATUS_LABELS, GOAL_HORIZON_LABELS } from './goal.types';

/* Challenges.
   ChallengeDay DOIT figurer ici : sans lui, les composants qui lisent les
   étapes d'un challenge reçoivent un type incomplet et le compilateur signale
   « Property 'dayNumber' does not exist ». */
export type {
  Habit,
  HabitCompletion,
  HabitFrequency,
  Challenge,
  ChallengeStatus,
  ChallengeDay,
} from './habit.types';
export {
  HABIT_FREQUENCY_LABELS,
  CHALLENGE_STATUS_LABELS,
  CHALLENGE_DURATIONS,
  challengeProgress,
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

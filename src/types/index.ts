/**
 * Ré-exports des modèles.
 *
 * Les composants importent depuis '@/types' — jamais depuis un fichier profond —
 * pour qu'une réorganisation interne ne casse pas les imports.
 */

/* Les types de base (BaseEntity, SyncableEntity, TimestampedEntity, MoodLevel,
   EntityId, TableName) sont déclarés directement dans ce fichier : ils n'ont
   pas à être réexportés depuis './index', ce qui créait un import circulaire
   et faisait perdre id / createdAt / updatedAt à tous les modèles qui en
   héritent. */

export type { UserProfile, UserSettings } from './user.types';
export { DEFAULT_SETTINGS_VALUES } from './user.types';

export type { MoodEntry } from './mood.types';
export { MOOD_LABELS, MOOD_LEVELS } from './mood.types';

export type { Goal, GoalStatus, GoalHorizon } from './goal.types';
export { GOAL_STATUS_LABELS, GOAL_HORIZON_LABELS } from './goal.types';

export type {
  Habit,
  HabitCompletion,
  HabitFrequency,
  Challenge,
  ChallengeStatus,
} from './habit.types';
export { HABIT_FREQUENCY_LABELS, CHALLENGE_STATUS_LABELS } from './habit.types';

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

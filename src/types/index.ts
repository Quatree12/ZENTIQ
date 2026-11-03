/**
 * Ré-exports des modèles.
 *
 * Les composants importent depuis '@/types' — jamais depuis un fichier profond —
 * pour qu'une réorganisation interne ne casse pas les imports.
 */

export type {
  BaseEntity,
  SyncableEntity,
  TimestampedEntity,
  MoodLevel,
  EntityId,
  TableName,
} from './index';

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

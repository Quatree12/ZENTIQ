/**
 * Point d'entree unique de la couche d'acces aux donnees.
 *
 * Les stores importent depuis '@/database/repositories' et jamais depuis un
 * fichier profond : l'organisation interne peut evoluer sans casser leurs
 * imports.
 */

export * from './base.repository';
export { moodsRepository } from './moods.repository';
export type { CreateMoodInput } from './moods.repository';
export { goalsRepository } from './goals.repository';
export type { CreateGoalInput } from './goals.repository';
export { habitsRepository } from './habits.repository';
export type { CreateHabitInput, HabitWithStatus } from './habits.repository';
export { journalRepository } from './journal.repository';
export type { CreateJournalEntryInput } from './journal.repository';
export { favoritesRepository } from './favorites.repository';
export type { FavoriteRefType } from './favorites.repository';
export {
  challengesRepository,
  computeEndDate,
  resolveStatus,
} from './challenges.repository';
export type { CreateChallengeInput } from './challenges.repository';

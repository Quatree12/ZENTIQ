/**
 * Schema de la base locale ZENTIQ.
 *
 * `TABLES` decrit, table par table, la cle primaire et les index Dexie.
 * La chaine d'index suit la syntaxe Dexie :
 *   'id'             cle primaire
 *   'date'           index simple
 *   '[habitId+date]' index compose (unicite logique d'une coche par jour)
 *
 * REGLE DE MAINTENANCE
 * --------------------
 * Une fois une version publiee, on n'en modifie JAMAIS la definition.
 * Toute evolution incremente `CURRENT_SCHEMA_VERSION` et ajoute une migration
 * dans `migrations.ts`.
 *
 * La liste des tables EXPORTABLES ne vit plus ici : elle se deduit de `TABLES`
 * dans `exportable-tables.ts`.
 */

export const DATABASE_NAME = 'zentiq';

/**
 * Version logique du schema applicatif, independante de la version Dexie.
 *
 * v1 -> v2 : ajout de `lastReviewedAt` sur les habitudes.
 * v2 -> v3 : ajout du rythme, des jalons et des reports sur les challenges.
 *            L'index `reminderAt` est ajoute a `challenges` pour les rappels
 *            a heure fixe, et `lastReviewedAt` reste en place.
 */
export const CURRENT_SCHEMA_VERSION = 3;

export interface ZentiqSchema {
  profile: Table<UserProfile, string>;
  settings: Table<UserSettings, string>;
  moods: Table<MoodEntry, string>;
  goals: Table<Goal, string>;
  habits: Table<Habit, string>;
  habitCompletions: Table<HabitCompletion, string>;
  challenges: Table<Challenge, string>;
  journal: Table<JournalEntry, string>;
  quotes: Table<Quote, string>;
  affirmations: Table<Affirmation, string>;
  music: Table<MusicInspiration, string>;
  favorites: Table<Favorite, string>;
  meta: Table<MetaRecord, string>;
}

/**
 * Table technique : journal du schema et metadonnees locales.
 * Jamais affichee telle quelle, mais consultable depuis l'espace ME
 * (diagnostic et export).
 */
export interface MetaRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

/**
 * Definition des tables pour la version COURANTE (v3).
 * Regroupee par domaine pour rester lisible.
 */
export const TABLES = {
  profile: 'id',
  settings: 'id',
  moods: 'id, date, mood, createdAt',
  goals: 'id, status, targetDate, isPriority, createdAt',
  habits: 'id, archived, goalId, createdAt, lastReviewedAt',
  habitCompletions: 'id, habitId, date, [habitId+date]',
  challenges: 'id, status, startDate, habitId, rhythm',
  journal: 'id, date, pinned, createdAt',
  quotes: 'id, category, favorite, author',
  affirmations: 'id, category, favorite',
  music: 'id, category, favorite, artist',
  favorites: 'id, refType, refId, [refType+refId]',
  meta: 'key',
} as const;

/** Noms de tables, types — evite les chaines libres un peu partout. */
export type TableName = keyof typeof TABLES;

/** Forme d'un document de sauvegarde ZENTIQ. */
export interface BackupDocument {
  kind: 'zentiq-backup';
  /** Version applicative qui a produit le fichier. */
  appVersion: string;
  /** Version de schema des donnees contenues. */
  schemaVersion: number;
  /** Horodatage ISO de l'export. */
  exportedAt: string;
  /** Nombre d'enregistrements par table, pour affichage avant import. */
  counts: Record<string, number>;
  /** Donnees brutes, table par table. */
  data: Record<string, unknown[]>;
}

/** Cles de metadonnees utilisees par la couche base. */
export const META_KEYS = {
  schemaLastOpened: 'schema:lastOpened',
  schemaHistory: 'schema:history',
  firstRunAt: 'app:firstRunAt',
  lastBackupAt: 'backup:lastAt',
} as const;

/* Imports de types — en fin de fichier pour ne pas melanger avec la logique. */
import type {
  Affirmation,
  Challenge,
  Favorite,
  Goal,
  Habit,
  HabitCompletion,
  JournalEntry,
  MoodEntry,
  MusicInspiration,
  Quote,
  UserProfile,
  UserSettings,
} from '@/types';
import type { Table } from 'dexie';

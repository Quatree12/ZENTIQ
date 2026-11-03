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

/**
 * Schéma de la base locale ZENTIQ.
 *
 * `TABLES` décrit, table par table, la clé primaire et les index Dexie.
 * La chaîne d'index suit la syntaxe Dexie :
 *   'id'             clé primaire
 *   'date'           index simple
 *   '[habitId+date]' index composé (unicité logique d'une coche par jour)
 *
 * RÈGLE DE MAINTENANCE
 * --------------------
 * Une fois une version publiée, on n'en modifie JAMAIS la définition.
 * Toute évolution incrémente `CURRENT_SCHEMA_VERSION` et ajoute une migration
 * dans `migrations.ts`.
 */

export const DATABASE_NAME = 'zentiq';

/** Version logique du schéma applicatif, indépendante de la version Dexie. */
export const CURRENT_SCHEMA_VERSION = 1;

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
 * Table technique : journal du schéma et métadonnées locales.
 * Jamais affichée telle quelle, mais consultable depuis l'espace ME
 * (diagnostic et export).
 */
export interface MetaRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

/**
 * Définition des tables pour la version courante.
 * Regroupée par domaine pour rester lisible.
 */
export const TABLES = {
  profile: 'id',
  settings: 'id',
  moods: 'id, date, mood, createdAt',
  goals: 'id, status, targetDate, isPriority, createdAt',
  habits: 'id, archived, goalId, createdAt',
  habitCompletions: 'id, habitId, date, [habitId+date]',
  challenges: 'id, status, startDate, habitId',
  journal: 'id, date, pinned, createdAt',
  quotes: 'id, category, favorite, author',
  affirmations: 'id, category, favorite',
  music: 'id, category, favorite, artist',
  favorites: 'id, refType, refId, [refType+refId]',
  meta: 'key',
} as const;

/** Noms de tables, typés — évite les chaînes libres un peu partout. */
export type TableName = keyof typeof TABLES;

/** Tables exportables (`meta` est technique et régénéré, donc exclu). */
export const EXPORTABLE_TABLES = [
  'profile',
  'settings',
  'moods',
  'goals',
  'habits',
  'habitCompletions',
  'challenges',
  'journal',
  'quotes',
  'affirmations',
  'music',
  'favorites',
] as const satisfies readonly TableName[];

export type ExportableTableName = (typeof EXPORTABLE_TABLES)[number];

/** Forme d'un document de sauvegarde ZENTIQ. */
export interface BackupDocument {
  kind: 'zentiq-backup';
  /** Version applicative qui a produit le fichier. */
  appVersion: string;
  /** Version de schéma des données contenues. */
  schemaVersion: number;
  /** Horodatage ISO de l'export. */
  exportedAt: string;
  /** Nombre d'enregistrements par table, pour affichage avant import. */
  counts: Record<string, number>;
  /** Données brutes, table par table. */
  data: Record<string, unknown[]>;
}

/** Clés de métadonnées utilisées par la couche base. */
export const META_KEYS = {
  schemaLastOpened: 'schema:lastOpened',
  schemaHistory: 'schema:history',
  firstRunAt: 'app:firstRunAt',
  lastBackupAt: 'backup:lastAt',
} as const;

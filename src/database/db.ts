import Dexie, { type Table } from 'dexie';
import { appConfig, APP_VERSION } from '@/app/app-config';
import { nowIso } from '@/utils/dates';
import { applyMigrations } from './migrations';
import {
  CURRENT_SCHEMA_VERSION,
  DATABASE_NAME,
  META_KEYS,
  TABLES,
  type MetaRecord,
  type ZentiqSchema,
} from './schema';
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

/**
 * Instance Dexie de ZENTIQ.
 *
 * C'est la seule porte d'entrée vers IndexedDB. Aucun composant ne doit
 * importer ce fichier directement : les repositories exposent les opérations,
 * les stores orchestrent, les hooks alimentent l'UI.
 */
class ZentiqDatabase extends Dexie implements ZentiqSchema {
  profile!: Table<UserProfile, string>;
  settings!: Table<UserSettings, string>;
  moods!: Table<MoodEntry, string>;
  goals!: Table<Goal, string>;
  habits!: Table<Habit, string>;
  habitCompletions!: Table<HabitCompletion, string>;
  challenges!: Table<Challenge, string>;
  journal!: Table<JournalEntry, string>;
  quotes!: Table<Quote, string>;
  affirmations!: Table<Affirmation, string>;
  music!: Table<MusicInspiration, string>;
  favorites!: Table<Favorite, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super(DATABASE_NAME);

    // Version 1 — création initiale du schéma.
    this.version(1).stores(TABLES);

    // Migrations suivantes (registre vide à ce stade).
    applyMigrations(this);
  }
}

export const db = new ZentiqDatabase();

/* --------------------------------------------------------------------------
   État d'ouverture — partagé par l'UI (bandeau d'erreur, écran de chargement)
   -------------------------------------------------------------------------- */

export type DatabaseStatus = 'idle' | 'opening' | 'ready' | 'error';

export interface DatabaseState {
  status: DatabaseStatus;
  error: string | null;
}

let databaseState: DatabaseState = { status: 'idle', error: null };
const databaseListeners = new Set<(state: DatabaseState) => void>();

function setDatabaseState(next: Partial<DatabaseState>): void {
  databaseState = { ...databaseState, ...next };
  for (const listener of databaseListeners) listener(databaseState);
}

/** S'abonne aux changements d'état de la base. */
export function subscribeToDatabase(listener: (state: DatabaseState) => void): () => void {
  databaseListeners.add(listener);
  listener(databaseState);
  return () => {
    databaseListeners.delete(listener);
  };
}

/** Lecture synchrone de l'état courant (utile aux hooks non abonnés). */
export function getDatabaseState(): DatabaseState {
  return databaseState;
}

/* --------------------------------------------------------------------------
   Ouverture & vérification du schéma
   -------------------------------------------------------------------------- */

export interface OpenDatabaseResult {
  ok: boolean;
  /** Migration détectée : la version locale était antérieure. */
  migrated: boolean;
  error: string | null;
}

/**
 * Ouvre la base et journalise l'état du schéma.
 *
 * Appelée une fois au démarrage. Idempotente : un second appel ne fait rien si
 * la base est déjà ouverte.
 */
export async function openDatabase(): Promise<OpenDatabaseResult> {
  if (db.isOpen()) {
    setDatabaseState({ status: 'ready', error: null });
    return { ok: true, migrated: false, error: null };
  }

  setDatabaseState({ status: 'opening', error: null });

  try {
    const previousVersion = await readMeta<number>(META_KEYS.schemaLastOpened);
    const migrated = previousVersion !== null && previousVersion < CURRENT_SCHEMA_VERSION;

    await db.open();
    await recordSchemaOpen(previousVersion);

    setDatabaseState({ status: 'ready', error: null });
    return { ok: true, migrated, error: null };
  } catch (error) {
    const message = describeDatabaseError(error);
    setDatabaseState({ status: 'error', error: message });
    return { ok: false, migrated: false, error: message };
  }
}

/** Ferme la base proprement (utilisé par la réinitialisation). */
export async function closeDatabase(): Promise<void> {
  if (db.isOpen()) db.close();
  setDatabaseState({ status: 'idle', error: null });
}

/**
 * Supprime entièrement la base locale.
 * Action irréversible — réservée à l'espace ME, toujours derrière une
 * confirmation explicite de l'utilisateur.
 */
export async function deleteDatabase(): Promise<void> {
  db.close();
  await Dexie.delete(DATABASE_NAME);
  setDatabaseState({ status: 'idle', error: null });
}

/* --------------------------------------------------------------------------
   Métadonnées
   -------------------------------------------------------------------------- */

export async function readMeta<T>(key: string): Promise<T | null> {
  try {
    const record = await db.meta.get(key);
    return record ? (record.value as T) : null;
  } catch {
    return null;
  }
}

export async function writeMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value, updatedAt: nowIso() });
}

/** Écrit la version de schéma atteinte et tient un historique court. */
async function recordSchemaOpen(previousVersion: number | null): Promise<void> {
  await writeMeta(META_KEYS.schemaLastOpened, CURRENT_SCHEMA_VERSION);

  const history = (await readMeta<unknown[]>(META_KEYS.schemaHistory)) ?? [];
  const entry = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    previousVersion,
    appVersion: APP_VERSION,
    at: nowIso(),
  };

  // Historique borné : on ne garde que les 20 derniers passages.
  const nextHistory = [...history, entry].slice(-20);
  await writeMeta(META_KEYS.schemaHistory, nextHistory);

  const firstRun = await readMeta<string>(META_KEYS.firstRunAt);
  if (firstRun === null) await writeMeta(META_KEYS.firstRunAt, nowIso());
}

/* --------------------------------------------------------------------------
   Erreurs
   -------------------------------------------------------------------------- */

/**
 * Traduit une erreur Dexie/navigateur en message compréhensible.
 * L'utilisateur ne doit jamais voir un code d'erreur brut : il ne pourrait
 * rien en faire.
 */
export function describeDatabaseError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes('MissingAPIError') || raw.includes('indexedDB')) {
    return "Le stockage local n'est pas disponible dans ce navigateur. ZENTIQ enregistre tes données sur ton appareil ; sans ce stockage, elles ne peuvent pas être conservées.";
  }
  if (raw.includes('VersionError') || raw.includes('version')) {
    return 'Une version plus récente de ZENTIQ a déjà ouvert ces données. Recharge la page pour continuer.';
  }
  if (raw.includes('QuotaExceededError') || raw.includes('quota')) {
    return "L'espace de stockage de ton appareil est plein. Pense à exporter tes données depuis l'espace ME, puis à libérer de la place.";
  }
  if (raw.includes('AbortError')) {
    return 'La base locale a été fermée par une autre fenêtre. Recharge la page pour reprendre.';
  }

  return "Une erreur est survenue lors de l'accès aux données locales. Tes données précédentes sont conservées.";
}

/**
 * Jauge de stockage — utilisée par l'espace ME pour informer l'utilisateur de
 * l'espace occupé par ses données.
 */
export interface StorageEstimate {
  usageBytes: number;
  quotaBytes: number;
  percentUsed: number;
  supported: boolean;
}

export async function estimateStorage(): Promise<StorageEstimate> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { usageBytes: 0, quotaBytes: 0, percentUsed: 0, supported: false };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usageBytes = estimate.usage ?? 0;
    const quotaBytes = estimate.quota ?? 0;
    return {
      usageBytes,
      quotaBytes,
      percentUsed: quotaBytes > 0 ? Math.round((usageBytes / quotaBytes) * 100) : 0,
      supported: true,
    };
  } catch {
    return { usageBytes: 0, quotaBytes: 0, percentUsed: 0, supported: false };
  }
}

/** Identifiant du profil local (singleton). */
export const PROFILE_ID = appConfig.singletonIds.profile;
/** Identifiant des réglages locaux (singleton). */
export const SETTINGS_ID = appConfig.singletonIds.settings;

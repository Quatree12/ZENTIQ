/**
 * Tests des migrations de schema.
 *
 * Le mecanisme n'avait JAMAIS tourne avant ce fichier : le registre etait vide,
 * donc aucune montee de version n'avait ete exercee. Ces tests ouvrent une base
 * de v1, y ecrivent une habitude, puis laissent Dexie appliquer la v2 et
 * verifient que la donnee survit et que le champ est bien pose.
 *
 * C'est le seul test du projet qui exerce une vraie migration. Sans lui, on ne
 * saurait toujours rien de ce mecanisme.
 */
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { CURRENT_SCHEMA_VERSION, TABLES } from '@/database/schema';
import { migrations } from '@/database/migrations';

const TEST_DB = 'zentiq-migration-test';

/** Index de la v1, tels qu'ils etaient avant l'ajout de lastReviewedAt. */
const V1_STORES = {
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
};

describe('registre des migrations', () => {
  it('declares les versions dans l ordre croissant', () => {
    const versions = migrations.map((m) => m.version);
    const sorted = [...versions].sort((a, b) => a - b);
    expect(versions).toEqual(sorted);
  });

  it('couvre la version courante du schema', () => {
    const last = migrations[migrations.length - 1];
    expect(last?.version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('decrit chaque migration', () => {
    for (const migration of migrations) {
      expect(migration.description.length).toBeGreaterThan(0);
      expect(Object.keys(migration.stores).length).toBeGreaterThan(0);
    }
  });
});

describe('montee de version v1 vers v2', () => {
  it('ajoute lastReviewedAt sans perdre les habitudes existantes', async () => {
    // 1. Base a la version 1, telle qu'un utilisateur l'aurait.
    const legacy = new Dexie(TEST_DB);
    legacy.version(1).stores(V1_STORES);
    await legacy.open();

    await legacy.table('habits').add({
      id: 'habit-legacy',
      name: 'Habitude existante',
      intention: '',
      frequency: 'daily',
      targetDays: [0, 1, 2, 3, 4, 5, 6],
      weeklyTarget: null,
      icon: 'circle-check',
      accent: 'teal',
      archived: false,
      createdAt: '2026-01-01T08:00:00.000Z',
      updatedAt: '2026-01-01T08:00:00.000Z',
    });
    legacy.close();

    // 2. Base a la version 2, avec la migration reelle du registre.
    const upgraded = new Dexie(TEST_DB);
    upgraded.version(1).stores(V1_STORES);
    for (const migration of migrations) {
      const v = upgraded.version(migration.version).stores(migration.stores);
      if (migration.upgrade) v.upgrade(migration.upgrade);
    }
    await upgraded.open();

    // 3. L'habitude a survecu.
    const habit = await upgraded.table('habits').get('habit-legacy');
    expect(habit).toBeDefined();
    expect(habit.name).toBe('Habitude existante');
    expect(habit.createdAt).toBe('2026-01-01T08:00:00.000Z');

    // 4. Le nouveau champ est pose, a null — aucune date inventee.
    expect(habit).toHaveProperty('lastReviewedAt');
    expect(habit.lastReviewedAt).toBeNull();

    upgraded.close();
    await Dexie.delete(TEST_DB);
  });

  it('ne touche pas aux autres tables lors de la migration', async () => {
    const legacy = new Dexie(TEST_DB + '-2');
    legacy.version(1).stores(V1_STORES);
    await legacy.open();
    await legacy.table('moods').add({
      id: 'mood-1',
      date: '2026-01-01',
      mood: 4,
      note: 'Note existante',
      emotions: [],
      createdAt: '2026-01-01T08:00:00.000Z',
      updatedAt: '2026-01-01T08:00:00.000Z',
    });
    legacy.close();

    const upgraded = new Dexie(TEST_DB + '-2');
    upgraded.version(1).stores(V1_STORES);
    for (const migration of migrations) {
      const v = upgraded.version(migration.version).stores(migration.stores);
      if (migration.upgrade) v.upgrade(migration.upgrade);
    }
    await upgraded.open();

    // L'humeur doit etre intacte : la migration ne cible que `habits`.
    const mood = await upgraded.table('moods').get('mood-1');
    expect(mood.mood).toBe(4);
    expect(mood.note).toBe('Note existante');

    upgraded.close();
    await Dexie.delete(TEST_DB + '-2');
  });
});

describe('coherence entre schema et migrations', () => {
  it('la derniere migration declare exactement les tables du schema', () => {
    const last = migrations[migrations.length - 1];
    expect(Object.keys(last?.stores ?? {}).sort()).toEqual(Object.keys(TABLES).sort());
  });
});

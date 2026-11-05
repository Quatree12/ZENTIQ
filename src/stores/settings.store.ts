import { create } from 'zustand';
import { db, SETTINGS_ID } from '@/database/db';
import { prepareInsert, prepareUpdate } from '@/database/repositories';
import { applyRenderSettings, writeCachedRenderSettings } from '@/services/storage.service';
import { DEFAULT_SETTINGS_VALUES, type UserSettings } from '@/types';

interface SettingsState {
  settings: UserSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  load: () => Promise<void>;
  updateSettings: (
    patch: Partial<Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<void>;
  reset: () => void;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Applique et met en cache les preferences de rendu.
 *
 * `largeReadableText` fait partie du lot : c'est lui qui declenche l'attribut
 * `data-large-text` sur <html>, seul moyen pour le CSS d'agir sur la taille du
 * texte. Sans cette ligne, la preference restait persistee et sans effet.
 */
function syncVisuals(settings: UserSettings): void {
  const payload = {
    accentTheme: settings.accentTheme,
    reduceMotion: settings.reduceMotion,
    density: settings.density,
    largeReadableText: settings.largeReadableText,
  };
  applyRenderSettings(payload);
  writeCachedRenderSettings(payload);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,
  saving: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const existing = await db.settings.get(SETTINGS_ID);

      if (existing) {
        syncVisuals(existing);
        set({ settings: existing, loading: false });
        return;
      }

      const created: UserSettings = prepareInsert<UserSettings>({
        id: SETTINGS_ID,
        accentTheme: DEFAULT_SETTINGS_VALUES.accentTheme,
        density: DEFAULT_SETTINGS_VALUES.density,
        reduceMotion: DEFAULT_SETTINGS_VALUES.reduceMotion,
        largeReadableText: DEFAULT_SETTINGS_VALUES.largeReadableText,
        dailyReminderEnabled: DEFAULT_SETTINGS_VALUES.dailyReminderEnabled,
        dailyReminderTime: DEFAULT_SETTINGS_VALUES.dailyReminderTime,
        dailyReminderDays: [...DEFAULT_SETTINGS_VALUES.dailyReminderDays],
        weekStartsOnMonday: DEFAULT_SETTINGS_VALUES.weekStartsOnMonday,
        use24HourClock: DEFAULT_SETTINGS_VALUES.use24HourClock,
        autoBackupReminder: DEFAULT_SETTINGS_VALUES.autoBackupReminder,
      });

      await db.settings.put(created);
      syncVisuals(created);
      set({ settings: created, loading: false });
    } catch (error) {
      set({ loading: false, error: messageOf(error, "Les preferences n'ont pas pu etre chargees.") });
    }
  },

  updateSettings: async (patch) => {
    const current = get().settings;
    if (!current) return;

    set({ saving: true });
    try {
      const updated = prepareUpdate(current, patch);
      await db.settings.put(updated);
      syncVisuals(updated);
      set({ settings: updated, saving: false, error: null });
    } catch (error) {
      set({ saving: false, error: messageOf(error, "La preference n'a pas pu etre enregistree.") });
    }
  },

  reset: () => set({ settings: null, loading: false, saving: false, error: null }),
}));

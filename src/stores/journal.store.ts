/**
 * Store du journal.
 *
 * Porte aussi la timeline : elle est construite à partir de toutes les sources
 * (journal, humeurs, objectifs atteints, habitudes cochées) et sert de matière
 * première à l'espace Journey.
 */
import { create } from 'zustand';
import { journalRepository, type CreateJournalEntryInput } from '@/database/repositories';
import type { JournalEntry, TimelinePoint } from '@/types';

interface JournalState {
  entries: JournalEntry[];
  timeline: TimelinePoint[];
  loading: boolean;
  saving: boolean;
  error: string | null;

  load: () => Promise<void>;
  loadTimeline: () => Promise<void>;
  createEntry: (input: CreateJournalEntryInput) => Promise<boolean>;
  updateEntry: (id: string, patch: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  reset: () => void;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  timeline: [],
  loading: false,
  saving: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const entries = await journalRepository.listAll();
      set({ entries, loading: false });
    } catch (error) {
      set({ loading: false, error: messageOf(error, "Le journal n'a pas pu être chargé.") });
    }
  },

  loadTimeline: async () => {
    try {
      const timeline = await journalRepository.buildTimeline();
      set({ timeline });
    } catch (error) {
      set({ error: messageOf(error, "La timeline n'a pas pu être construite.") });
    }
  },

  createEntry: async (input) => {
    set({ saving: true, error: null });
    try {
      const entry = await journalRepository.create(input);
      set({ entries: [entry, ...get().entries], saving: false });
      // La timeline inclut la nouvelle entrée.
      await get().loadTimeline();
      return true;
    } catch (error) {
      set({ saving: false, error: messageOf(error, "L'entrée n'a pas pu être enregistrée.") });
      return false;
    }
  },

  updateEntry: async (id, patch) => {
    try {
      const updated = await journalRepository.update(id, patch);
      set({
        entries: get().entries.map((entry) => (entry.id === id ? updated : entry)),
        error: null,
      });
    } catch (error) {
      set({ error: messageOf(error, "La modification n'a pas pu être enregistrée.") });
    }
  },

  removeEntry: async (id) => {
    try {
      await journalRepository.remove(id);
      set({ entries: get().entries.filter((entry) => entry.id !== id), error: null });
      await get().loadTimeline();
    } catch (error) {
      set({ error: messageOf(error, "L'entrée n'a pas pu être supprimée.") });
    }
  },

  togglePin: async (id) => {
    try {
      const updated = await journalRepository.togglePin(id);
      const entries = get()
        .entries.map((entry) => (entry.id === id ? updated : entry))
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.date.localeCompare(a.date);
        });
      set({ entries, error: null });
    } catch (error) {
      set({ error: messageOf(error, "L'épingle n'a pas pu être modifiée.") });
    }
  },

  reset: () => set({ entries: [], timeline: [], loading: false, saving: false, error: null }),
}));

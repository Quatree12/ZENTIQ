/**
 * Hooks métier du domaine journal.
 */
import { useJournalStore } from '@/stores/journal.store';
import type { CreateJournalEntryInput } from '@/database/repositories';
import type { JournalEntry, TimelinePoint } from '@/types';

export interface UseJournalResult {
  entries: JournalEntry[];
  timeline: TimelinePoint[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  createEntry: (input: CreateJournalEntryInput) => Promise<boolean>;
  updateEntry: (id: string, patch: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useJournal(): UseJournalResult {
  const { entries, timeline, loading, saving, error, load, createEntry, updateEntry, removeEntry, togglePin } =
    useJournalStore();

  return {
    entries,
    timeline,
    loading,
    saving,
    error,
    createEntry,
    updateEntry,
    removeEntry,
    togglePin,
    refresh: load,
  };
}

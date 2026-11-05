/**
 * Hooks métier du domaine journal.
 */
import { useCallback } from 'react';
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

/**
 * Accès au journal et à la timeline.
 *
 * `refresh` mémorisée : c'est ce qui évite la boucle sur les pages Journey, qui
 * chargent leurs données dans un `useEffect` dépendant de cette fonction.
 */
export function useJournal(): UseJournalResult {
  const entries = useJournalStore((state) => state.entries);
  const timeline = useJournalStore((state) => state.timeline);
  const loading = useJournalStore((state) => state.loading);
  const saving = useJournalStore((state) => state.saving);
  const error = useJournalStore((state) => state.error);
  const load = useJournalStore((state) => state.load);
  const loadTimeline = useJournalStore((state) => state.loadTimeline);
  const createEntry = useJournalStore((state) => state.createEntry);
  const updateEntry = useJournalStore((state) => state.updateEntry);
  const removeEntry = useJournalStore((state) => state.removeEntry);
  const togglePin = useJournalStore((state) => state.togglePin);

  const refresh = useCallback(async () => {
    await Promise.all([load(), loadTimeline()]);
  }, [load, loadTimeline]);

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
    refresh,
  };
}

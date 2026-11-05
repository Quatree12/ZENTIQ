/**
 * Hook métier des challenges.
 */
import { useCallback } from 'react';
import { useChallengesStore } from '@/stores/challenges.store';
import type { CreateChallengeInput, UpdateChallengeInput } from '@/database/repositories';
import type { Challenge } from '@/types';
import { summarizeChallenges, type ChallengeSummary } from '@/utils/challenge-stats';

export interface UseChallengesResult {
  challenges: Challenge[];
  summary: ChallengeSummary;
  loading: boolean;
  error: string | null;
  busyIds: string[];
  createChallenge: (input: CreateChallengeInput) => Promise<Challenge | null>;
  updateChallenge: (id: string, input: UpdateChallengeInput) => Promise<Challenge | null>;
  updateSteps: (id: string, labels: string[]) => Promise<Challenge | null>;
  completeDay: (id: string, dayNumber: number, date?: string) => Promise<Challenge | null>;
  uncompleteDay: (id: string, dayNumber: number) => Promise<void>;
  postpone: (id: string, days?: number) => Promise<Challenge | null>;
  setAside: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  removeChallenge: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Accès aux challenges.
 *
 * `refresh` est mémorisée : sans cela, tout `useEffect(…, [refresh])` se
 * relancerait à chaque rendu — le défaut qui a bloqué les premières versions
 * des écrans.
 */
export function useChallenges(): UseChallengesResult {
  const challenges = useChallengesStore((state) => state.challenges);
  const loading = useChallengesStore((state) => state.loading);
  const error = useChallengesStore((state) => state.error);
  const busyIds = useChallengesStore((state) => state.busyIds);
  const load = useChallengesStore((state) => state.load);
  const createChallenge = useChallengesStore((state) => state.createChallenge);
  const updateChallenge = useChallengesStore((state) => state.updateChallenge);
  const updateSteps = useChallengesStore((state) => state.updateSteps);
  const completeDay = useChallengesStore((state) => state.completeDay);
  const uncompleteDay = useChallengesStore((state) => state.uncompleteDay);
  const postpone = useChallengesStore((state) => state.postpone);
  const setAside = useChallengesStore((state) => state.setAside);
  const resume = useChallengesStore((state) => state.resume);
  const removeChallenge = useChallengesStore((state) => state.removeChallenge);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return {
    challenges,
    summary: summarizeChallenges(challenges),
    loading,
    error,
    busyIds,
    createChallenge,
    updateChallenge,
    updateSteps,
    completeDay,
    uncompleteDay,
    postpone,
    setAside,
    resume,
    removeChallenge,
    refresh,
  };
}

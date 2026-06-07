import { useEffect, useState } from "react";

import {
  evaluateLoopVacancyMatchViaRest,
  type VacancyMatchEvaluation,
} from "src/features/vacancyMatches";

export interface MatchEvaluationState {
  data: VacancyMatchEvaluation | null;
  isLoading: boolean;
  error: boolean;
}

interface SettledResult {
  key: string;
  data: VacancyMatchEvaluation | null;
  error: boolean;
}

/**
 * Fetches the deterministic server evaluation (POST …/matches/{id}/evaluate)
 * for the selected match. Loading is *derived* from whether the latest settled
 * result matches the current (loopId, matchId) key, so the effect never calls
 * setState synchronously (keeps react-hooks/set-state-in-effect happy) and
 * stale responses for a previously selected match are ignored.
 */
export function useMatchEvaluation(
  loopId: string | null,
  matchId: string | null,
): MatchEvaluationState {
  const key = loopId && matchId ? `${loopId}:${matchId}` : null;
  const [result, setResult] = useState<SettledResult | null>(null);

  useEffect(() => {
    if (!key || !loopId || !matchId) return undefined;
    let active = true;
    evaluateLoopVacancyMatchViaRest(loopId, matchId)
      .then((data) => {
        if (active) setResult({ key, data, error: false });
      })
      .catch(() => {
        if (active) setResult({ key, data: null, error: true });
      });
    return () => {
      active = false;
    };
  }, [key, loopId, matchId]);

  const isCurrent = result !== null && result.key === key;
  return {
    data: isCurrent ? result.data : null,
    error: isCurrent ? result.error : false,
    isLoading: key !== null && !isCurrent,
  };
}

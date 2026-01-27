import { skipToken } from "@reduxjs/toolkit/query";

import { useGetLoopsQuery } from "src/entities/loop/api/loopApi";
import { useGetAllMatchesQuery } from "src/entities/match/api/matchesApi";

export function useMatchesQueries(userId: string | null) {
  const matchesQ = useGetAllMatchesQuery(userId ? { userId } : skipToken);
  const loopsQ = useGetLoopsQuery(userId ? { userId } : skipToken);

  const matches = matchesQ.data ?? [];
  const loops = loopsQ.data ?? [];

  return { matchesQ, loopsQ, matches, loops };
}

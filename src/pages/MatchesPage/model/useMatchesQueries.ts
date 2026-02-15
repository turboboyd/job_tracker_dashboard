import { useAuthSelectors } from "src/entities/auth";
import { useGetLoopsQuery } from "src/entities/loop";
import { useGetAllMatchesQuery } from "src/entities/loopMatch";



export function useMatchesQueries() {
  const { isAuthReady, isAuthenticated } = useAuthSelectors();
  const skip = !isAuthReady || !isAuthenticated;

  const matchesQ = useGetAllMatchesQuery(undefined, { skip });
  const loopsQ = useGetLoopsQuery(undefined, { skip });

  const matches = matchesQ.data ?? [];
  const loops = loopsQ.data ?? [];

  return { matchesQ, loopsQ, matches, loops };
}

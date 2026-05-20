import { useGetAllMatchesQuery } from "src/entities/loopMatch";
import { useAuthSelectors } from "src/features/auth/model";
import { useBackendLoopsQuery } from "src/features/loops";



export function useMatchesQueries() {
  const { isAuthReady, isAuthenticated } = useAuthSelectors();
  const skip = !isAuthReady || !isAuthenticated;

  const matchesQ = useGetAllMatchesQuery(undefined, { skip });
  const loopsQ = useBackendLoopsQuery({ includeArchived: true, skip });

  const matches = matchesQ.data ?? [];
  const loops = loopsQ.data ?? [];

  return { matchesQ, loopsQ, matches, loops };
}

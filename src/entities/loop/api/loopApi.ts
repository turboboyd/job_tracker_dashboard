import { baseApi } from "src/shared/api/rtk";

import { buildLoopEndpoints } from "./endpoints/loop.endpoints";

/**
 * ✅ Loops API (ONLY loops collection).
 * All loopMatches (matches) endpoints were moved to:
 *   src/entities/loopMatch/api/loopMatchesApi.ts
 */
export const loopApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...buildLoopEndpoints(builder),
  }),
});

export const {
  useGetLoopsQuery,
  useLazyGetLoopsQuery,

  useGetLoopsPageQuery,
  useLazyGetLoopsPageQuery,

  useGetLoopQuery,
  useCreateLoopMutation,
  useUpdateLoopMutation,
  useDeleteLoopMutation,
} = loopApi;

import { baseApi } from "src/shared/api/rtk";

import { buildLoopMatchesEndpoints } from "./endpoints/loopMatches.endpoints";

export const loopMatchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...buildLoopMatchesEndpoints(builder),
  }),
});

export const {
  useGetAllMatchesQuery,
  useGetMatchesByLoopQuery,
  useGetMatchQuery,
  useCreateMatchMutation,
  useUpdateMatchStatusMutation,
  useUpdateMatchMutation,
  useDeleteMatchMutation,
} = loopMatchesApi;

export type { GetMatchArgs, GetMatchesByLoopArgs } from "./loopMatchesApi.types";

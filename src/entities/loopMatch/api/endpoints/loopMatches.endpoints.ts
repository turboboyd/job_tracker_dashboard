import { guardAuthRtk } from "src/entities/auth/lib";
import type { AppEndpointBuilder } from "src/shared/api/rtk";

import type {
  CreateLoopMatchInput,
  DeleteLoopMatchInput,
  LoopMatch,
  UpdateLoopMatchInput,
  UpdateLoopMatchStatusInput,
} from "../../model/types";
import {
  createMatchQuery,
  deleteMatchQuery,
  getAllMatchesQuery,
  getMatchByIdQuery,
  getMatchesByLoopQuery,
  updateMatchQuery,
  updateMatchStatusQuery,
} from "../loopMatchesApi.queries";
import {
  invalidateLoopMatchEntityTags,
  invalidateLoopMatchesByLoopTags,
  provideAllLoopMatchesTags,
  provideLoopMatchTags,
  provideLoopMatchesByLoopTags,
} from "../loopMatchesApi.tags";
import type {
  GetMatchArgs,
  GetMatchesByLoopArgs,
} from "../loopMatchesApi.types";

type Builder = AppEndpointBuilder;

export function buildLoopMatchesEndpoints(builder: Builder) {
  return {
    getAllMatches: builder.query<LoopMatch[], void>({
      queryFn: (_arg, api) =>
        guardAuthRtk(api, (uid) => getAllMatchesQuery(uid)),
      providesTags: (result) => provideAllLoopMatchesTags(result),
    }),

    getMatchesByLoop: builder.query<LoopMatch[], GetMatchesByLoopArgs>({
      queryFn: ({ loopId }, api) =>
        guardAuthRtk(api, (uid) => getMatchesByLoopQuery(uid, loopId)),
      providesTags: (_result, _error, arg) => provideLoopMatchesByLoopTags(arg.loopId),
    }),

    getMatch: builder.query<LoopMatch | null, GetMatchArgs>({
      queryFn: ({ matchId }, api) =>
        guardAuthRtk(api, (uid) => getMatchByIdQuery(uid, matchId)),
      providesTags: (_result, _error, arg) => provideLoopMatchTags(arg.matchId),
    }),

    createMatch: builder.mutation<{ id: string }, CreateLoopMatchInput>({
      queryFn: (input, api) =>
        guardAuthRtk(api, (uid) => createMatchQuery(uid, input)),
      invalidatesTags: (_result, _error, arg) => invalidateLoopMatchesByLoopTags(arg.loopId),
    }),

    updateMatchStatus: builder.mutation<void, UpdateLoopMatchStatusInput>({
      queryFn: (input, api) =>
        guardAuthRtk(api, async (uid) => {
          await updateMatchStatusQuery(uid, input);
        }),
      invalidatesTags: (_result, _error, arg) =>
        invalidateLoopMatchEntityTags(arg.matchId, arg.loopId),
    }),

    updateMatch: builder.mutation<void, UpdateLoopMatchInput>({
      queryFn: (input, api) =>
        guardAuthRtk(api, async (uid) => {
          await updateMatchQuery(uid, input);
        }),
      invalidatesTags: (_result, _error, arg) =>
        invalidateLoopMatchEntityTags(arg.matchId),
    }),

    deleteMatch: builder.mutation<void, DeleteLoopMatchInput>({
      queryFn: ({ matchId }, api) =>
        guardAuthRtk(api, async (uid) => {
          await deleteMatchQuery(uid, matchId);
        }),
      invalidatesTags: (_result, _error, arg) =>
        invalidateLoopMatchEntityTags(arg.matchId, arg.loopId),
    }),
  };
}

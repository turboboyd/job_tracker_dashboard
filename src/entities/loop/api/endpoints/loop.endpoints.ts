import type { Api, EndpointBuilder } from "@reduxjs/toolkit/query";

import { baseApi } from "src/shared/api/rtk/baseApi";
import { guardRtk } from "src/shared/api/rtk/guardRtk";
import { requireUidFromState } from "src/shared/api/rtk/requireUid";

import type { Loop } from "../../model";
import type { CreateLoopInput, UpdateLoopInput } from "../loopApi.types";
import { createLoopQuery } from "../queries/loops/createLoop";
import {
  deleteLoopQuery,
  type DeleteLoopInput,
} from "../queries/loops/deleteLoop";
import { getLoopByIdQuery } from "../queries/loops/getLoopById";
import { getLoopsQuery } from "../queries/loops/getLoops";
import {
  getLoopsPageQuery,
  type GetLoopsPageInput,
  type LoopsPageResponse,
} from "../queries/loops/getLoopsPage";
import { updateLoopQuery } from "../queries/loops/updateLoop";

type BaseApi = typeof baseApi;

type ExtractBaseQuery<T> =
  T extends Api<
    infer BQ,
    infer _Definitions,
    infer _ReducerPath,
    infer _TagTypes,
    infer _Enhancers
  >
    ? BQ
    : never;

type ExtractReducerPath<T> =
  T extends Api<
    infer _BQ,
    infer _Definitions,
    infer RP,
    infer _TagTypes,
    infer _Enhancers
  >
    ? RP
    : never;

type ExtractTagTypes<T> =
  T extends Api<
    infer _BQ,
    infer _Definitions,
    infer _ReducerPath,
    infer TT,
    infer _Enhancers
  >
    ? TT
    : never;

type Builder = EndpointBuilder<
  ExtractBaseQuery<BaseApi>,
  ExtractTagTypes<BaseApi>,
  ExtractReducerPath<BaseApi>
>;

function provideLoopsListTags(items: Loop[] | undefined) {
  return [
    { type: "Loops" as const, id: "LIST" },
    ...(items?.map((l) => ({ type: "Loops" as const, id: l.id })) ?? []),
  ];
}

function provideLoopsPageTags(res: LoopsPageResponse | undefined) {
  return [
    { type: "Loops" as const, id: "LIST" },
    ...(res?.items?.map((l) => ({ type: "Loops" as const, id: l.id })) ?? []),
  ];
}

export function buildLoopEndpoints(builder: Builder) {
  return {
    getLoops: builder.query<Loop[], void>({
      queryFn: (_arg, api) =>
        guardRtk(() => {
          const uid = requireUidFromState(api.getState());
          return getLoopsQuery(uid);
        }),
      providesTags: (res) => provideLoopsListTags(res),
    }),

    getLoopsPage: builder.query<LoopsPageResponse, GetLoopsPageInput>({
      queryFn: (arg, api) =>
        guardRtk(() => {
          const uid = requireUidFromState(api.getState());
          return getLoopsPageQuery(uid, arg);
        }),
      providesTags: (res) => provideLoopsPageTags(res),
    }),

    getLoop: builder.query<Loop | null, { loopId: string }>({
      queryFn: ({ loopId }, api) =>
        guardRtk(() => {
          const uid = requireUidFromState(api.getState());
          return getLoopByIdQuery(uid, loopId);
        }),
      providesTags: (_res, _err, arg) => [
        { type: "Loops" as const, id: arg.loopId },
      ],
    }),

    createLoop: builder.mutation<{ id: string }, CreateLoopInput>({
      queryFn: (input, api) =>
        guardRtk(() => {
          const uid = requireUidFromState(api.getState());
          return createLoopQuery(uid, input);
        }),
      invalidatesTags: [{ type: "Loops", id: "LIST" }],
    }),

    updateLoop: builder.mutation<void, UpdateLoopInput>({
      queryFn: (input, api) =>
        guardRtk(() => {
          const uid = requireUidFromState(api.getState());
          return updateLoopQuery(uid, input);
        }),
      invalidatesTags: (_r, _e, a) => [
        { type: "Loops", id: a.loopId },
        { type: "Loops", id: "LIST" },
      ],
    }),

    deleteLoop: builder.mutation<void, DeleteLoopInput>({
      queryFn: (input, api) =>
        guardRtk(() => {
          const uid = requireUidFromState(api.getState());
          return deleteLoopQuery(uid, input);
        }),
      invalidatesTags: (_r, _e, a) => [
        { type: "Loops", id: a.loopId },
        { type: "Loops", id: "LIST" },
      ],
    }),
  };
}

export type { LoopsPageResponse, GetLoopsPageInput, DeleteLoopInput };

import { guardAuthRtk } from "src/entities/auth/lib";
import type { AppEndpointBuilder } from "src/shared/api/rtk";

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

type Builder = AppEndpointBuilder;

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
        guardAuthRtk(api, (uid) => getLoopsQuery(uid)),
      providesTags: (res) => provideLoopsListTags(res),
    }),

    getLoopsPage: builder.query<LoopsPageResponse, GetLoopsPageInput>({
      queryFn: (arg, api) =>
        guardAuthRtk(api, (uid) => getLoopsPageQuery(uid, arg)),
      providesTags: (res) => provideLoopsPageTags(res),
    }),

    getLoop: builder.query<Loop | null, { loopId: string }>({
      queryFn: ({ loopId }, api) =>
        guardAuthRtk(api, (uid) => getLoopByIdQuery(uid, loopId)),
      providesTags: (_res, _err, arg) => [
        { type: "Loops" as const, id: arg.loopId },
      ],
    }),

    createLoop: builder.mutation<{ id: string }, CreateLoopInput>({
      queryFn: (input, api) =>
        guardAuthRtk(api, (uid) => createLoopQuery(uid, input)),
      invalidatesTags: [{ type: "Loops", id: "LIST" }],
    }),

    updateLoop: builder.mutation<void, UpdateLoopInput>({
      queryFn: (input, api) =>
        guardAuthRtk(api, (uid) => updateLoopQuery(uid, input)),
      invalidatesTags: (_r, _e, a) => [
        { type: "Loops", id: a.loopId },
        { type: "Loops", id: "LIST" },
      ],
    }),

    deleteLoop: builder.mutation<void, DeleteLoopInput>({
      queryFn: (input, api) =>
        guardAuthRtk(api, (uid) => deleteLoopQuery(uid, input)),
      invalidatesTags: (_r, _e, a) => [
        { type: "Loops", id: a.loopId },
        { type: "Loops", id: "LIST" },
      ],
    }),
  };
}

export type { LoopsPageResponse, GetLoopsPageInput, DeleteLoopInput };

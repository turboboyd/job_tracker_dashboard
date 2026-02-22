import type { QueryReturnValue } from "@reduxjs/toolkit/query";
import { getDoc } from "firebase/firestore";


import { publicStatsDoc } from "src/shared/api/firestoreRefs";
import { baseApi } from "src/shared/api/rtk/baseApi";
import { guardRtk } from "src/shared/api/rtk/guardRtk";
import type { ApiError } from "src/shared/api/rtk/rtkError";
import { toMillisOptional } from "src/shared/lib/firestore/toMillis";

import type { PublicStats } from "../model/types";

export const publicStatsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPublicStats: build.query<PublicStats | null, { docId: string }>({
      queryFn: ({ docId }): Promise<QueryReturnValue<PublicStats | null, ApiError, undefined>> =>
        guardRtk(async () => {
          const snap = await getDoc(publicStatsDoc(docId));
          if (!snap.exists()) return null;
          const raw = (snap.data() ?? {}) as Record<string, unknown>;
          return {
            hiredCount: Number(raw.hiredCount ?? 0),
            waitingCount: Number(raw.waitingCount ?? 0),
            positiveRate: Number(raw.positiveRate ?? 0),
            updatedAt: toMillisOptional(raw.updatedAt),
          };
        }),
      providesTags: (_r, _e, arg) => [{ type: "PublicStats", id: `public-${arg.docId}` }],
    }),
  }),
});

export const { useGetPublicStatsQuery } = publicStatsApi;

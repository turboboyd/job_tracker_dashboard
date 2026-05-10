import type { QueryReturnValue } from "@reduxjs/toolkit/query";
import { getDoc } from "firebase/firestore";

import { baseApi, guardRtk, type ApiError, publicStatsDoc } from "src/shared/api";
import { toMillisOptional } from "src/shared/lib";

import type { PublicStats } from "../model/types";

export const publicStatsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPublicStats: build.query<PublicStats | null, { docId: string }>({
      queryFn: ({ docId }): Promise<
        QueryReturnValue<PublicStats | null, ApiError, Record<string, never>>
      > =>
        guardRtk(async () => {
          const snap = await getDoc(publicStatsDoc(docId));
          if (!snap.exists()) return null;
          const raw = (snap.data() ?? {}) as Record<string, unknown>;

          const updatedAt = toMillisOptional(raw.updatedAt);

          return {
            hiredCount: Number(raw.hiredCount ?? 0),
            waitingCount: Number(raw.waitingCount ?? 0),
            positiveRate: Number(raw.positiveRate ?? 0),
            ...(updatedAt !== undefined ? { updatedAt } : {}),
          };
        }),
      providesTags: (_r, _e, arg) => [{ type: "PublicStats", id: `public-${arg.docId}` }],
    }),
  }),
});

export const { useGetPublicStatsQuery } = publicStatsApi;
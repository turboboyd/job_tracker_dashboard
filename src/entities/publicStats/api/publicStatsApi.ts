import type { QueryReturnValue } from "@reduxjs/toolkit/query";
import { getDoc } from "firebase/firestore";


import { publicStatsDoc } from "src/shared/api/firestoreRefs";
import { baseApi } from "src/shared/api/rtk/baseApi";
import { guardRtk } from "src/shared/api/rtk/guardRtk";
import type { ApiError } from "src/shared/api/rtk/rtkError";

import type { PublicStats } from "../model/types";

export const publicStatsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPublicStats: build.query<PublicStats | null, { docId: string }>({
      queryFn: ({ docId }): Promise<QueryReturnValue<PublicStats | null, ApiError, undefined>> =>
        guardRtk(async () => {
          const snap = await getDoc(publicStatsDoc(docId));
          return snap.exists() ? (snap.data() as PublicStats) : null;
        }),
      providesTags: (_r, _e, arg) => [{ type: "PublicStats", id: `public-${arg.docId}` }],
    }),
  }),
});

export const { useGetPublicStatsQuery } = publicStatsApi;

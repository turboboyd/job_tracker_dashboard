import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

import { ApiError } from "./rtkError";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: [
    "Loops",
    "LoopRuns",
    "LoopMatches",
    "UserSettings",
    "Outcome",
    "PublicStats",
  ],

  keepUnusedDataFor: 60,
  refetchOnFocus: true,
  refetchOnReconnect: true,

  endpoints: () => ({}),
});

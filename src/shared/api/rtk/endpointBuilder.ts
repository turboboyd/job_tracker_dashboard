import type { Api, EndpointBuilder } from "@reduxjs/toolkit/query";

import type { baseApi } from "./baseApi";

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

type BaseApi = typeof baseApi;

export type AppEndpointBuilder = EndpointBuilder<
  ExtractBaseQuery<BaseApi>,
  ExtractTagTypes<BaseApi>,
  ExtractReducerPath<BaseApi>
>;

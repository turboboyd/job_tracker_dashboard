import { restGet, restPost } from "src/shared/api";
import { getBackendConfig } from "src/shared/config";

import {
  mapDiscoveryRunHistoryResponseDto,
  mapDiscoveryRunPreviewInputToDto,
  mapDiscoveryRunResponseDto,
  mapDiscoverySourceRuntimeStatusResponseDto,
} from "./adapter";
import type {
  DiscoveryRunHistoryQuery,
  DiscoveryRunHistoryResponse,
  DiscoveryRunHistoryResponseDto,
  DiscoveryRunPreviewInput,
  DiscoveryRunResponse,
  DiscoveryRunResponseDto,
  DiscoverySourceRuntimeStatusResponse,
  DiscoverySourceRuntimeStatusResponseDto,
} from "./types";

export function buildDiscoveryRunsUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl}/discovery-runs`;
}

export function buildDiscoverySourceRuntimeStatusUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl}/discovery-sources/runtime-status`;
}

export async function runDiscoveryPreviewViaRest(
  input: DiscoveryRunPreviewInput,
): Promise<DiscoveryRunResponse> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<DiscoveryRunResponseDto>(
    buildDiscoveryRunsUrl(apiBaseUrl),
    mapDiscoveryRunPreviewInputToDto(input),
  );
  return mapDiscoveryRunResponseDto(dto);
}

export async function getDiscoverySourceRuntimeStatusViaRest(): Promise<DiscoverySourceRuntimeStatusResponse> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<DiscoverySourceRuntimeStatusResponseDto>(
    buildDiscoverySourceRuntimeStatusUrl(apiBaseUrl),
    { auth: false },
  );
  return mapDiscoverySourceRuntimeStatusResponseDto(dto);
}

export function buildDiscoveryRunsHistoryUrl(
  apiBaseUrl: string,
  query: DiscoveryRunHistoryQuery = {},
): string {
  const params = new URLSearchParams();
  if (query.loopId) params.set("loop_id", query.loopId);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";
  return `${apiBaseUrl}/discovery-runs${suffix}`;
}

export async function listDiscoveryRunHistoryViaRest(
  query: DiscoveryRunHistoryQuery = {},
): Promise<DiscoveryRunHistoryResponse> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<DiscoveryRunHistoryResponseDto>(
    buildDiscoveryRunsHistoryUrl(apiBaseUrl, query),
  );
  return mapDiscoveryRunHistoryResponseDto(dto);
}

import { restGet, restPost } from "src/shared/api";
import { getBackendConfig } from "src/shared/config";

import {
  mapDiscoveryRunPreviewInputToDto,
  mapDiscoveryRunResponseDto,
  mapDiscoverySourceRuntimeStatusResponseDto,
} from "./adapter";
import type {
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

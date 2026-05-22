import type { Loop } from "src/entities/loop";
import { restDelete, restGet, restPatch, restPost } from "src/shared/api";
import { getBackendConfig } from "src/shared/config";

import {
  mapBackendLoopDtoToLoop,
  mapCreateLoopInputToDto,
  mapUpdateLoopInputToDto,
  type BackendLoopDto,
  type CreateBackendLoopInput,
  type UpdateBackendLoopInput,
} from "./adapter";

export interface BackendLoopListResponseDto {
  items: BackendLoopDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface BackendLoopListQuery {
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

const LOOP_LIST_DEFAULT_LIMIT = 100;

function appendQueryParam(params: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (typeof value === "boolean") {
    params.set(key, value ? "true" : "false");
    return;
  }
  params.set(key, String(value));
}

export function buildLoopsListUrl(
  apiBaseUrl: string,
  query: BackendLoopListQuery = {},
): string {
  const params = new URLSearchParams();
  appendQueryParam(params, "include_archived", query.includeArchived);
  appendQueryParam(params, "limit", query.limit ?? LOOP_LIST_DEFAULT_LIMIT);
  appendQueryParam(params, "offset", query.offset ?? 0);

  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";
  return `${apiBaseUrl}/loops${suffix}`;
}

export function buildLoopDetailUrl(apiBaseUrl: string, loopId: string): string {
  return `${apiBaseUrl}/loops/${encodeURIComponent(loopId)}`;
}

export async function listLoopsViaRest(query: BackendLoopListQuery = {}) {
  const { apiBaseUrl } = getBackendConfig();
  const response = await restGet<BackendLoopListResponseDto>(
    buildLoopsListUrl(apiBaseUrl, query),
  );
  return {
    items: response.items.map(mapBackendLoopDtoToLoop),
    total: response.total,
    limit: response.limit,
    offset: response.offset,
  };
}

export async function createLoopViaRest(input: CreateBackendLoopInput) {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<BackendLoopDto>(
    `${apiBaseUrl}/loops`,
    mapCreateLoopInputToDto(input),
  );
  return mapBackendLoopDtoToLoop(dto);
}

export async function getLoopViaRest(loopId: string) {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<BackendLoopDto>(buildLoopDetailUrl(apiBaseUrl, loopId));
  return mapBackendLoopDtoToLoop(dto);
}

export async function updateLoopViaRest(loopId: string, patch: UpdateBackendLoopInput) {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPatch<BackendLoopDto>(
    buildLoopDetailUrl(apiBaseUrl, loopId),
    mapUpdateLoopInputToDto(patch),
  );
  return mapBackendLoopDtoToLoop(dto);
}

export async function archiveLoopViaRest(loopId: string): Promise<void> {
  const { apiBaseUrl } = getBackendConfig();
  await restDelete(buildLoopDetailUrl(apiBaseUrl, loopId));
}

export async function duplicateLoopViaRest(loopId: string): Promise<Loop> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<BackendLoopDto>(
    `${apiBaseUrl}/loops/${encodeURIComponent(loopId)}/duplicate`,
    {},
  );
  return mapBackendLoopDtoToLoop(dto);
}

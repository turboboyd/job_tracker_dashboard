import { restDelete, restGet, restPatch, restPost } from "src/shared/api";
import { getBackendConfig } from "src/shared/config";

import {
  mapCreateApplicationFromMatchInputToDto,
  mapCreateApplicationFromMatchResponseDto,
  mapIgnoreDiscoveryPreviewInputToDto,
  mapPatchVacancyMatchInputToDto,
  mapSaveDiscoveryPreviewMatchInputToDto,
  mapSaveVacancyMatchInputToDto,
  mapVacancyPreviewIgnoreDto,
  mapVacancyPreviewIgnoreResponseDto,
  mapVacancyMatchFromPreviewResponseDto,
  mapVacancyMatchDto,
  mapVacancyMatchPreviewDto,
  type CreateApplicationFromMatchInput,
  type CreateApplicationFromMatchResponseDto,
  type CreateApplicationFromMatchResult,
  type ConvertVacancyMatchResponseDto,
  type IgnoreDiscoveryPreviewInput,
  type IgnoreDiscoveryPreviewResult,
  type PatchVacancyMatchInput,
  type SaveDiscoveryPreviewMatchInput,
  type SaveDiscoveryPreviewMatchResult,
  type SaveVacancyMatchInput,
  type VacancyMatch,
  type VacancyMatchDto,
  type VacancyMatchFromPreviewResponseDto,
  type VacancyMatchListEnvelope,
  type VacancyMatchListEnvelopeDto,
  type VacancyMatchPreview,
  type VacancyMatchPreviewDto,
  type VacancyMatchStatus,
  type VacancyPreviewIgnoreListEnvelope,
  type VacancyPreviewIgnoreListEnvelopeDto,
  type VacancyPreviewIgnoreResponseDto,
} from "./adapter";

export interface VacancyMatchListQuery {
  status?: VacancyMatchStatus;
  limit?: number;
  offset?: number;
}

export interface ConvertVacancyMatchResult {
  applicationId: string;
  match: VacancyMatch;
}

function loopMatchesBaseUrl(apiBaseUrl: string, loopId: string): string {
  return `${apiBaseUrl}/loops/${encodeURIComponent(loopId)}/matches`;
}

export function buildLoopMatchImportPreviewUrl(apiBaseUrl: string, loopId: string): string {
  return `${loopMatchesBaseUrl(apiBaseUrl, loopId)}/import-preview`;
}

export function buildLoopMatchFromPreviewUrl(apiBaseUrl: string, loopId: string): string {
  return `${loopMatchesBaseUrl(apiBaseUrl, loopId)}/from-preview`;
}

export function buildLoopMatchPreviewIgnoresUrl(apiBaseUrl: string, loopId: string): string {
  return `${loopMatchesBaseUrl(apiBaseUrl, loopId)}/preview-ignores`;
}

export function buildLoopMatchPreviewIgnoreUrl(
  apiBaseUrl: string,
  loopId: string,
  ignoreId: string,
): string {
  return `${buildLoopMatchPreviewIgnoresUrl(apiBaseUrl, loopId)}/${encodeURIComponent(ignoreId)}`;
}

export function buildLoopMatchesListUrl(
  apiBaseUrl: string,
  loopId: string,
  query: VacancyMatchListQuery = {},
): string {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.limit !== undefined) params.set("limit", String(Math.max(1, Math.min(query.limit, 100))));
  if (query.offset !== undefined) params.set("offset", String(Math.max(0, query.offset)));

  const qs = params.toString();
  return `${loopMatchesBaseUrl(apiBaseUrl, loopId)}${qs ? `?${qs}` : ""}`;
}

export function buildLoopMatchDetailUrl(apiBaseUrl: string, loopId: string, matchId: string): string {
  return `${loopMatchesBaseUrl(apiBaseUrl, loopId)}/${encodeURIComponent(matchId)}`;
}

export function buildLoopMatchConvertUrl(apiBaseUrl: string, loopId: string, matchId: string): string {
  return `${buildLoopMatchDetailUrl(apiBaseUrl, loopId, matchId)}/convert-to-application`;
}

export function buildLoopMatchCreateApplicationUrl(
  apiBaseUrl: string,
  loopId: string,
  matchId: string,
): string {
  return `${buildLoopMatchDetailUrl(apiBaseUrl, loopId, matchId)}/create-application`;
}

export async function previewLoopVacancyMatchViaRest(
  loopId: string,
  url: string,
): Promise<VacancyMatchPreview> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<VacancyMatchPreviewDto>(
    buildLoopMatchImportPreviewUrl(apiBaseUrl, loopId),
    { url },
  );
  return mapVacancyMatchPreviewDto(dto);
}

export async function saveLoopVacancyMatchViaRest(
  loopId: string,
  input: SaveVacancyMatchInput,
): Promise<VacancyMatch> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<VacancyMatchDto>(
    loopMatchesBaseUrl(apiBaseUrl, loopId),
    mapSaveVacancyMatchInputToDto(input),
  );
  return mapVacancyMatchDto(dto);
}

export async function saveDiscoveryPreviewAsMatchViaRest(
  loopId: string,
  input: SaveDiscoveryPreviewMatchInput,
): Promise<SaveDiscoveryPreviewMatchResult> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<VacancyMatchFromPreviewResponseDto>(
    buildLoopMatchFromPreviewUrl(apiBaseUrl, loopId),
    mapSaveDiscoveryPreviewMatchInputToDto(input),
  );
  return mapVacancyMatchFromPreviewResponseDto(dto);
}

export async function ignoreDiscoveryPreviewViaRest(
  loopId: string,
  input: IgnoreDiscoveryPreviewInput,
): Promise<IgnoreDiscoveryPreviewResult> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<VacancyPreviewIgnoreResponseDto>(
    buildLoopMatchPreviewIgnoresUrl(apiBaseUrl, loopId),
    mapIgnoreDiscoveryPreviewInputToDto(input),
  );
  return mapVacancyPreviewIgnoreResponseDto(dto);
}

export async function listDiscoveryPreviewIgnoresViaRest(
  loopId: string,
): Promise<VacancyPreviewIgnoreListEnvelope> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<VacancyPreviewIgnoreListEnvelopeDto>(
    buildLoopMatchPreviewIgnoresUrl(apiBaseUrl, loopId),
  );
  return {
    items: dto.items.map(mapVacancyPreviewIgnoreDto),
    total: dto.total,
    limit: dto.limit,
    offset: dto.offset,
  };
}

export async function unignoreDiscoveryPreviewViaRest(
  loopId: string,
  ignoreId: string,
): Promise<void> {
  const { apiBaseUrl } = getBackendConfig();
  await restDelete(buildLoopMatchPreviewIgnoreUrl(apiBaseUrl, loopId, ignoreId));
}

export async function listLoopVacancyMatchesViaRest(
  loopId: string,
  query: VacancyMatchListQuery = {},
): Promise<VacancyMatchListEnvelope> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<VacancyMatchListEnvelopeDto>(
    buildLoopMatchesListUrl(apiBaseUrl, loopId, query),
  );
  return {
    items: dto.items.map(mapVacancyMatchDto),
    total: dto.total,
    limit: dto.limit,
    offset: dto.offset,
  };
}

export async function patchLoopVacancyMatchViaRest(
  loopId: string,
  matchId: string,
  input: PatchVacancyMatchInput,
): Promise<VacancyMatch> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPatch<VacancyMatchDto>(
    buildLoopMatchDetailUrl(apiBaseUrl, loopId, matchId),
    mapPatchVacancyMatchInputToDto(input),
  );
  return mapVacancyMatchDto(dto);
}

export async function convertLoopVacancyMatchViaRest(
  loopId: string,
  matchId: string,
): Promise<ConvertVacancyMatchResult> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<ConvertVacancyMatchResponseDto>(
    buildLoopMatchConvertUrl(apiBaseUrl, loopId, matchId),
    {},
  );
  return {
    applicationId: dto.application_id,
    match: mapVacancyMatchDto(dto.match),
  };
}

export async function createApplicationFromVacancyMatchViaRest(
  loopId: string,
  matchId: string,
  input: CreateApplicationFromMatchInput = {},
): Promise<CreateApplicationFromMatchResult> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<CreateApplicationFromMatchResponseDto>(
    buildLoopMatchCreateApplicationUrl(apiBaseUrl, loopId, matchId),
    mapCreateApplicationFromMatchInputToDto(input),
  );
  return mapCreateApplicationFromMatchResponseDto(dto);
}

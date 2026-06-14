import { restGet, restPatch, restPost } from "src/shared/api";
import { getBackendConfig } from "src/shared/config";

import {
  mapApplicationFromPreviewResponseDto,
  mapCreateApplicationFromMatchInputToDto,
  mapCreateApplicationFromMatchResponseDto,
  mapMatchesFeedResponseDto,
  mapPatchVacancyMatchInputToDto,
  mapSaveDiscoveryPreviewMatchInputToDto,
  mapSaveVacancyMatchInputToDto,
  mapVacancyMatchFromPreviewResponseDto,
  mapVacancyMatchDto,
  mapVacancyMatchEvaluationDto,
  mapVacancyMatchPreviewDto,
  type ApplicationFromPreviewResponseDto,
  type CreateApplicationFromMatchInput,
  type CreateApplicationFromMatchResponseDto,
  type CreateApplicationFromMatchResult,
  type ConvertVacancyMatchResponseDto,
  type ListMatchesFeedInput,
  type MatchesFeedResponse,
  type MatchesFeedResponseDto,
  type PatchVacancyMatchInput,
  type SaveDiscoveryPreviewAsApplicationResult,
  type SaveDiscoveryPreviewMatchInput,
  type SaveDiscoveryPreviewMatchResult,
  type SaveVacancyMatchInput,
  type VacancyMatch,
  type VacancyMatchDto,
  type VacancyMatchEvaluation,
  type VacancyMatchEvaluationDto,
  type VacancyMatchFromPreviewResponseDto,
  type VacancyMatchListEnvelope,
  type VacancyMatchListEnvelopeDto,
  type VacancyMatchPreview,
  type VacancyMatchPreviewDto,
  type VacancyMatchStatus,
} from "./adapter";

/** "freshness" (default, unchanged) | "score" (backend-owned match score). */
export type LoopMatchesSort = "freshness" | "score";

export interface VacancyMatchListQuery {
  status?: VacancyMatchStatus;
  sort?: LoopMatchesSort;
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

export function buildLoopApplicationFromPreviewUrl(apiBaseUrl: string, loopId: string): string {
  return `${apiBaseUrl}/loops/${encodeURIComponent(loopId)}/applications/from-preview`;
}

export function buildMatchesFeedUrl(
  apiBaseUrl: string,
  input: ListMatchesFeedInput = {},
): string {
  const params = new URLSearchParams();
  if (input.tab) params.set("tab", input.tab);
  if (input.q) params.set("q", input.q);
  if (input.source) params.set("source", input.source);
  if (input.sort) params.set("sort", input.sort);
  if (input.limit !== undefined) {
    params.set("limit", String(Math.max(1, Math.min(input.limit, 100))));
  }
  if (input.offset !== undefined) params.set("offset", String(Math.max(0, input.offset)));

  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";
  return `${apiBaseUrl}/matches${suffix}`;
}

export function buildLoopMatchSeenUrl(apiBaseUrl: string, loopId: string, matchId: string): string {
  return `${buildLoopMatchDetailUrl(apiBaseUrl, loopId, matchId)}/seen`;
}

export function buildLoopMatchesListUrl(
  apiBaseUrl: string,
  loopId: string,
  query: VacancyMatchListQuery = {},
): string {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.sort) params.set("sort", query.sort);
  if (query.limit !== undefined) params.set("limit", String(Math.max(1, Math.min(query.limit, 100))));
  if (query.offset !== undefined) params.set("offset", String(Math.max(0, query.offset)));

  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";
  return `${loopMatchesBaseUrl(apiBaseUrl, loopId)}${suffix}`;
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

export function buildLoopMatchEvaluateUrl(
  apiBaseUrl: string,
  loopId: string,
  matchId: string,
): string {
  return `${buildLoopMatchDetailUrl(apiBaseUrl, loopId, matchId)}/evaluate`;
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

export async function saveDiscoveryPreviewAsApplicationViaRest(
  loopId: string,
  input: SaveDiscoveryPreviewMatchInput,
): Promise<SaveDiscoveryPreviewAsApplicationResult> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<ApplicationFromPreviewResponseDto>(
    buildLoopApplicationFromPreviewUrl(apiBaseUrl, loopId),
    mapSaveDiscoveryPreviewMatchInputToDto(input),
  );
  return mapApplicationFromPreviewResponseDto(dto);
}

export async function listMatchesFeedViaRest(
  input: ListMatchesFeedInput = {},
): Promise<MatchesFeedResponse> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<MatchesFeedResponseDto>(buildMatchesFeedUrl(apiBaseUrl, input));
  return mapMatchesFeedResponseDto(dto);
}

export async function markLoopVacancyMatchSeenViaRest(
  loopId: string,
  matchId: string,
): Promise<VacancyMatch> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<VacancyMatchDto>(
    buildLoopMatchSeenUrl(apiBaseUrl, loopId, matchId),
    {},
  );
  return mapVacancyMatchDto(dto);
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

export async function getLoopVacancyMatchViaRest(
  loopId: string,
  matchId: string,
): Promise<VacancyMatch> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<VacancyMatchDto>(
    buildLoopMatchDetailUrl(apiBaseUrl, loopId, matchId),
  );
  return mapVacancyMatchDto(dto);
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

export async function evaluateLoopVacancyMatchViaRest(
  loopId: string,
  matchId: string,
): Promise<VacancyMatchEvaluation> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<VacancyMatchEvaluationDto>(
    buildLoopMatchEvaluateUrl(apiBaseUrl, loopId, matchId),
    {},
  );
  return mapVacancyMatchEvaluationDto(dto);
}

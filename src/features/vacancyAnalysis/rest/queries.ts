import { restGet, restPost } from "src/shared/api";
import { ApiError } from "src/shared/api/rest/restClient";
import { getBackendConfig } from "src/shared/config";

import {
  mapAnalysisPlanDto,
  mapCreateVacancyAnalysisInputToDto,
  mapVacancyAnalysisListResponseDto,
  mapVacancyAnalysisResponseDto,
  mapVacancyAnalysisDto,
} from "./adapter";
import type {
  AnalysisPlan,
  AnalysisPlanReadDto,
  VacancyAnalysis,
  VacancyAnalysisCreateInput,
  VacancyAnalysisDto,
  VacancyAnalysisListResponse,
  VacancyAnalysisListResponseDto,
  VacancyAnalysisResponseDto,
} from "./types";

export interface VacancyAnalysisListQuery {
  limit?: number;
  offset?: number;
}

export function buildCurrentAnalysisPlanUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl}/users/me/analysis-plan`;
}

function analysesBaseUrl(apiBaseUrl: string, loopId: string, matchId: string): string {
  return `${apiBaseUrl}/loops/${encodeURIComponent(loopId)}/matches/${encodeURIComponent(
    matchId,
  )}/analyses`;
}

export function buildVacancyAnalysesUrl(
  apiBaseUrl: string,
  loopId: string,
  matchId: string,
  query: VacancyAnalysisListQuery = {},
): string {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set("limit", String(Math.max(1, Math.min(query.limit, 100))));
  if (query.offset !== undefined) params.set("offset", String(Math.max(0, query.offset)));

  const qs = params.toString();
  return `${analysesBaseUrl(apiBaseUrl, loopId, matchId)}${qs ? `?${qs}` : ""}`;
}

export function buildLatestVacancyAnalysisUrl(
  apiBaseUrl: string,
  loopId: string,
  matchId: string,
): string {
  return `${analysesBaseUrl(apiBaseUrl, loopId, matchId)}/latest`;
}

export async function createVacancyAnalysisViaRest(
  loopId: string,
  matchId: string,
  input: VacancyAnalysisCreateInput,
): Promise<VacancyAnalysis> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<VacancyAnalysisResponseDto>(
    buildVacancyAnalysesUrl(apiBaseUrl, loopId, matchId),
    mapCreateVacancyAnalysisInputToDto(input),
  );
  return mapVacancyAnalysisResponseDto(dto);
}

export async function listVacancyAnalysesViaRest(
  loopId: string,
  matchId: string,
  query: VacancyAnalysisListQuery = {},
): Promise<VacancyAnalysisListResponse> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<VacancyAnalysisListResponseDto>(
    buildVacancyAnalysesUrl(apiBaseUrl, loopId, matchId, query),
  );
  return mapVacancyAnalysisListResponseDto(dto);
}

export async function getLatestVacancyAnalysisViaRest(
  loopId: string,
  matchId: string,
): Promise<VacancyAnalysis | null> {
  const { apiBaseUrl } = getBackendConfig();
  try {
    const dto = await restGet<VacancyAnalysisDto>(
      buildLatestVacancyAnalysisUrl(apiBaseUrl, loopId, matchId),
    );
    return mapVacancyAnalysisDto(dto);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getCurrentAnalysisPlanViaRest(): Promise<AnalysisPlan> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<AnalysisPlanReadDto>(buildCurrentAnalysisPlanUrl(apiBaseUrl));
  return mapAnalysisPlanDto(dto);
}

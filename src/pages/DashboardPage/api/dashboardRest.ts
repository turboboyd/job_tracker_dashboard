import { restGet } from "src/shared/api";
import { getBackendConfig } from "src/shared/config";

export type DashboardKpiRange = "7d" | "30d" | "90d" | "all";

export interface ActivityFeedQuery {
  limit?: number;
  kind?: string | null;
}

export interface ActivityEventReadDto {
  id: string;
  user_id: string;
  application_id: string | null;
  kind: string;
  title: string;
  description: string | null;
  payload: unknown;
  created_at: string;
}

export interface ActivityFeedResponseDto {
  items: ActivityEventReadDto[];
}

export type DashboardActivityType =
  | "view"
  | "match"
  | "loop"
  | "system"
  | "note"
  | "message"
  | "file"
  | "apply"
  | "move"
  | "interview"
  | "contact";

export interface DashboardActivityFeedItem {
  id: string;
  applicationId: string | null;
  timeMs: number;
  time: string;
  who: string;
  action: string;
  target: string;
  type: DashboardActivityType;
  title: string;
  description: string | null;
  kind: string;
  payload: unknown;
  createdAt: string;
}

export interface DashboardKpiResponseDto {
  range: string;
  total_applications: number;
  active_applications: number;
  archived_applications: number;
  status_counts: Record<string, number>;
  follow_ups_due: number;
  applied_count: number;
  interview_count: number;
  offer_count: number;
  rejected_count: number;
  response_rate: number;
  interview_rate: number;
  offer_rate: number;
}

export interface DashboardKpiModel {
  range: DashboardKpiRange | string;
  totalApplications: number;
  activeApplications: number;
  archivedApplications: number;
  statusCounts: Record<string, number>;
  followUpsDue: number;
  appliedCount: number;
  interviewCount: number;
  offerCount: number;
  rejectedCount: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
}

function appendQueryParam(
  params: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value === undefined || value === null) return;
  params.set(key, String(value));
}

export function buildActivityFeedUrl(
  apiBaseUrl: string,
  query: ActivityFeedQuery = {},
): string {
  const params = new URLSearchParams();
  appendQueryParam(params, "limit", query.limit);
  appendQueryParam(params, "kind", query.kind);

  const queryString = params.toString();
  const querySuffix = queryString ? `?${queryString}` : "";
  return `${apiBaseUrl}/activity/feed${querySuffix}`;
}

export function buildAnalyticsKpiUrl(
  apiBaseUrl: string,
  range?: DashboardKpiRange,
): string {
  const params = new URLSearchParams();
  appendQueryParam(params, "range", range);

  const queryString = params.toString();
  const querySuffix = queryString ? `?${queryString}` : "";
  return `${apiBaseUrl}/analytics/kpi${querySuffix}`;
}

function toActivityType(kind: string): DashboardActivityType {
  const normalized = kind.toUpperCase();

  if (normalized.includes("COMMENT")) return "note";
  if (normalized.includes("STATUS")) return "move";
  if (normalized.includes("DOCUMENT") || normalized.includes("FILE"))
    return "file";
  if (normalized.includes("APPLICATION")) return "apply";
  if (normalized.includes("INTERVIEW")) return "interview";
  if (normalized.includes("OFFER")) return "match";

  return "system";
}

function splitActivityTitle(title: string): { action: string; target: string } {
  const separator = " to ";
  const separatorIndex = title.indexOf(separator);

  if (separatorIndex > 0) {
    return {
      action: title.slice(0, separatorIndex),
      target: title.slice(separatorIndex + separator.length),
    };
  }

  return {
    action: title,
    target: "",
  };
}

export function mapActivityEventDtoToDashboardItem(
  dto: ActivityEventReadDto,
): DashboardActivityFeedItem {
  const timeMs = Date.parse(dto.created_at);
  const { action, target } = splitActivityTitle(dto.title);

  return {
    id: dto.id,
    applicationId: dto.application_id,
    timeMs: Number.isFinite(timeMs) ? timeMs : 0,
    time: Number.isFinite(timeMs)
      ? new Date(timeMs).toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
    who: "Ты",
    action,
    target,
    type: toActivityType(dto.kind),
    title: dto.title,
    description: dto.description,
    kind: dto.kind,
    payload: dto.payload,
    createdAt: dto.created_at,
  };
}

export function mapActivityFeedResponseDto(
  dto: ActivityFeedResponseDto,
): DashboardActivityFeedItem[] {
  return (dto.items ?? []).map(mapActivityEventDtoToDashboardItem);
}

export function mapKpiResponseDto(
  dto: DashboardKpiResponseDto,
): DashboardKpiModel {
  return {
    range: dto.range,
    totalApplications: dto.total_applications ?? 0,
    activeApplications: dto.active_applications ?? 0,
    archivedApplications: dto.archived_applications ?? 0,
    statusCounts: dto.status_counts ?? {},
    followUpsDue: dto.follow_ups_due ?? 0,
    appliedCount: dto.applied_count ?? 0,
    interviewCount: dto.interview_count ?? 0,
    offerCount: dto.offer_count ?? 0,
    rejectedCount: dto.rejected_count ?? 0,
    responseRate: dto.response_rate ?? 0,
    interviewRate: dto.interview_rate ?? 0,
    offerRate: dto.offer_rate ?? 0,
  };
}

export async function getActivityFeedViaRest(
  query: ActivityFeedQuery = {},
): Promise<DashboardActivityFeedItem[]> {
  const { apiBaseUrl } = getBackendConfig();
  const response = await restGet<ActivityFeedResponseDto>(
    buildActivityFeedUrl(apiBaseUrl, query),
  );
  return mapActivityFeedResponseDto(response);
}

export async function getAnalyticsKpiViaRest(
  range: DashboardKpiRange = "30d",
): Promise<DashboardKpiModel> {
  const { apiBaseUrl } = getBackendConfig();
  const response = await restGet<DashboardKpiResponseDto>(
    buildAnalyticsKpiUrl(apiBaseUrl, range),
  );
  return mapKpiResponseDto(response);
}

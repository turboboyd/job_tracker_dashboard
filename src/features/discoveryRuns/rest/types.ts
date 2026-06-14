export type DiscoveryRunStatus = "completed" | "completed_with_warnings" | "failed" | "skipped";
export type DiscoveryRunItemStatus = "skipped" | "unsupported" | "would_run" | "failed";
export type DiscoverySearchScope = "focused" | "normal" | "broad";

export interface DiscoveryRunRequestDto {
  loop_id: string;
  dry_run: boolean;
  source_ids?: string[];
  search_scope?: DiscoverySearchScope;
  page?: number;
  page_size?: number;
  cache_only?: boolean;
}

export interface DiscoveryRunPreviewInsightDto {
  score: number;
  matched: string[];
  missing: string[];
}

export interface DiscoveryRunPreviewItemDto {
  external_id: string | null;
  source_url: string;
  title: string | null;
  company: string | null;
  location: string | null;
  snippet: string | null;
  posted_at: string | null;
  raw_metadata: Record<string, unknown>;
  confidence: Record<string, number>;
  insight?: DiscoveryRunPreviewInsightDto | null;
}

export interface DiscoveryRunItemDto {
  loop_id: string;
  source_id: string | null;
  status: DiscoveryRunItemStatus;
  reason: string;
  message: string;
  items_previewed: number;
  has_more?: boolean;
  preview_items: DiscoveryRunPreviewItemDto[];
  warnings: string[];
  errors: string[];
}

export interface DiscoveryRunResponseDto {
  run_id: string;
  status: DiscoveryRunStatus;
  dry_run: boolean;
  page?: number;
  page_size?: number;
  loops_checked: number;
  sources_checked: number;
  matches_created: number;
  matches_previewed: number;
  warnings: string[];
  items: DiscoveryRunItemDto[];
}

export interface DiscoveryRunPreviewInput {
  loopId: string;
  dryRun: true;
  sourceIds?: string[];
  searchScope?: DiscoverySearchScope;
  page?: number;
  pageSize?: number;
  /** Serve only from the backend cache; missing pages are warmed in the background. */
  cacheOnly?: boolean;
}

/**
 * A real (non-dry) discovery run that persists freshly-found vacancies as
 * matches. Used by the Matches page «Обновить» button to trigger an on-demand
 * "добор" before re-reading the persisted feed.
 */
export interface DiscoveryRunInput {
  loopId: string;
  sourceIds?: string[];
  searchScope?: DiscoverySearchScope;
}

export type DiscoverySourceConfigurationStatus =
  | "ready"
  | "not_configured"
  | "not_runnable";

export interface DiscoverySourceRuntimeStatusDto {
  source_id: string;
  name: string;
  automatic_discovery: boolean;
  configured: boolean;
  runnable: boolean;
  configuration_status: DiscoverySourceConfigurationStatus;
  message_code: string;
}

export interface DiscoverySourceRuntimeStatusResponseDto {
  items: DiscoverySourceRuntimeStatusDto[];
}

export interface DiscoverySourceRuntimeStatus {
  sourceId: string;
  name: string;
  automaticDiscovery: boolean;
  configured: boolean;
  runnable: boolean;
  configurationStatus: DiscoverySourceConfigurationStatus;
  messageCode: string;
}

export interface DiscoverySourceRuntimeStatusResponse {
  items: DiscoverySourceRuntimeStatus[];
}

export interface DiscoveryRunPreviewInsight {
  score: number;
  matched: string[];
  missing: string[];
}

export interface DiscoveryRunPreviewItem {
  externalId: string | null;
  sourceUrl: string;
  title: string | null;
  company: string | null;
  location: string | null;
  snippet: string | null;
  postedAt: string | null;
  rawMetadata: Record<string, unknown>;
  confidence: Record<string, number>;
  insight?: DiscoveryRunPreviewInsight | null;
}

export interface DiscoveryRunItem {
  loopId: string;
  sourceId: string | null;
  status: DiscoveryRunItemStatus;
  reason: string;
  message: string;
  itemsPreviewed: number;
  hasMore?: boolean;
  previewItems: DiscoveryRunPreviewItem[];
  warnings: string[];
  errors: string[];
}

export interface DiscoveryRunResponse {
  runId: string;
  status: DiscoveryRunStatus;
  dryRun: boolean;
  page?: number;
  pageSize?: number;
  loopsChecked: number;
  sourcesChecked: number;
  matchesCreated: number;
  matchesPreviewed: number;
  warnings: string[];
  items: DiscoveryRunItem[];
}

export interface DiscoveryRunHistoryItemDto {
  id: string;
  run_id: string;
  loop_id: string;
  status: DiscoveryRunStatus;
  sources: string[];
  items_found: number;
  items_new: number;
  duration_ms: number;
  error_text: string | null;
  started_at: string;
  finished_at: string;
}

export interface DiscoveryRunHistoryResponseDto {
  items: DiscoveryRunHistoryItemDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface DiscoveryRunHistoryItem {
  id: string;
  runId: string;
  loopId: string;
  status: DiscoveryRunStatus;
  sources: string[];
  itemsFound: number;
  itemsNew: number;
  durationMs: number;
  errorText: string | null;
  startedAt: string;
  finishedAt: string;
}

export interface DiscoveryRunHistoryResponse {
  items: DiscoveryRunHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface DiscoveryRunHistoryQuery {
  loopId?: string;
  limit?: number;
  offset?: number;
}

import type {
  DiscoveryRunHistoryItem,
  DiscoveryRunHistoryItemDto,
  DiscoveryRunHistoryResponse,
  DiscoveryRunHistoryResponseDto,
  DiscoveryRunItem,
  DiscoveryRunItemDto,
  DiscoveryRunPreviewInput,
  DiscoveryRunPreviewItem,
  DiscoveryRunPreviewItemDto,
  DiscoveryRunRequestDto,
  DiscoveryRunResponse,
  DiscoveryRunResponseDto,
  DiscoverySourceRuntimeStatus,
  DiscoverySourceRuntimeStatusDto,
  DiscoverySourceRuntimeStatusResponse,
  DiscoverySourceRuntimeStatusResponseDto,
} from "./types";

export function mapDiscoveryRunPreviewInputToDto(
  input: DiscoveryRunPreviewInput,
): DiscoveryRunRequestDto {
  return {
    loop_id: input.loopId,
    dry_run: input.dryRun,
    source_ids: input.sourceIds,
    search_scope: input.searchScope,
    page: input.page,
    page_size: input.pageSize,
    cache_only: input.cacheOnly,
  };
}

export function mapDiscoveryRunPreviewItemDto(
  dto: DiscoveryRunPreviewItemDto,
): DiscoveryRunPreviewItem {
  return {
    externalId: dto.external_id,
    sourceUrl: dto.source_url,
    title: dto.title,
    company: dto.company,
    location: dto.location,
    snippet: dto.snippet,
    postedAt: dto.posted_at,
    rawMetadata: dto.raw_metadata,
    confidence: dto.confidence,
  };
}

export function mapDiscoveryRunItemDto(dto: DiscoveryRunItemDto): DiscoveryRunItem {
  return {
    loopId: dto.loop_id,
    sourceId: dto.source_id,
    status: dto.status,
    reason: dto.reason,
    message: dto.message,
    itemsPreviewed: dto.items_previewed,
    hasMore: dto.has_more ?? dto.items_previewed >= 20,
    previewItems: dto.preview_items.map(mapDiscoveryRunPreviewItemDto),
    warnings: dto.warnings,
    errors: dto.errors,
  };
}

export function mapDiscoveryRunResponseDto(
  dto: DiscoveryRunResponseDto,
): DiscoveryRunResponse {
  return {
    runId: dto.run_id,
    status: dto.status,
    dryRun: dto.dry_run,
    page: dto.page ?? 1,
    pageSize: dto.page_size ?? 5,
    loopsChecked: dto.loops_checked,
    sourcesChecked: dto.sources_checked,
    matchesCreated: dto.matches_created,
    matchesPreviewed: dto.matches_previewed,
    warnings: dto.warnings,
    items: dto.items.map(mapDiscoveryRunItemDto),
  };
}

export function mapDiscoverySourceRuntimeStatusDto(
  dto: DiscoverySourceRuntimeStatusDto,
): DiscoverySourceRuntimeStatus {
  return {
    sourceId: dto.source_id,
    name: dto.name,
    automaticDiscovery: dto.automatic_discovery,
    configured: dto.configured,
    runnable: dto.runnable,
    configurationStatus: dto.configuration_status,
    messageCode: dto.message_code,
  };
}

export function mapDiscoverySourceRuntimeStatusResponseDto(
  dto: DiscoverySourceRuntimeStatusResponseDto,
): DiscoverySourceRuntimeStatusResponse {
  return {
    items: dto.items.map(mapDiscoverySourceRuntimeStatusDto),
  };
}

export function mapDiscoveryRunHistoryItemDto(
  dto: DiscoveryRunHistoryItemDto,
): DiscoveryRunHistoryItem {
  return {
    id: dto.id,
    runId: dto.run_id,
    loopId: dto.loop_id,
    status: dto.status,
    sources: dto.sources,
    itemsFound: dto.items_found,
    itemsNew: dto.items_new,
    durationMs: dto.duration_ms,
    errorText: dto.error_text,
    startedAt: dto.started_at,
    finishedAt: dto.finished_at,
  };
}

export function mapDiscoveryRunHistoryResponseDto(
  dto: DiscoveryRunHistoryResponseDto,
): DiscoveryRunHistoryResponse {
  return {
    items: dto.items.map(mapDiscoveryRunHistoryItemDto),
    total: dto.total,
    limit: dto.limit,
    offset: dto.offset,
  };
}

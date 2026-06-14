import {
  DEFAULT_CANONICAL_FILTERS,
  LOOP_PLATFORM_VALUES,
  type CanonicalFilters,
  type Loop,
  type LoopMetrics,
  type LoopPlatform,
  type LoopStatus,
  type RemoteMode,
} from "src/entities/loop";

export interface BackendLoopMetricsDto {
  matches_saved: number;
  applications_total: number;
  applied_count?: number;
  interview_count?: number;
  offer_count?: number;
  rejected_count?: number;
  response_rate?: number;
  interview_rate?: number;
  offer_rate?: number;
}

export interface BackendLoopDto {
  id: string;
  user_id?: string;
  title?: string | null;
  name?: string | null;
  target_role: string | null;
  location: string | null;
  radius_km?: number | null;
  sources?: string[];
  status?: LoopStatus;
  keywords?: string[];
  excluded_keywords?: string[];
  employment_types?: string[];
  work_modes?: string[];
  selected_sources?: string[];
  auto_discovery_enabled?: boolean;
  discovery_radius_km?: number | null;
  last_discovery_at?: string | null;
  next_run_at?: string | null;
  discovery_interval_hours?: number;
  created_at?: string;
  updated_at?: string;
  metrics?: BackendLoopMetricsDto | null;
}

export interface CreateBackendLoopInput {
  title?: string;
  name?: string;
  targetRole?: string | null;
  titles?: string[];
  location?: string | null;
  radiusKm?: number | null;
  sources?: string[];
  platforms?: LoopPlatform[];
  status?: LoopStatus;
  keywords?: string[];
  excludedKeywords?: string[];
  employmentTypes?: string[];
  workModes?: string[];
  selectedSources?: string[];
  autoDiscoveryEnabled?: boolean;
  discoveryIntervalHours?: number;
  discoveryRadiusKm?: number | null;
  remoteMode?: RemoteMode;
  filters?: CanonicalFilters;
}

export type UpdateBackendLoopInput = Partial<CreateBackendLoopInput>;

const LOOP_PLATFORM_SET = new Set<string>(LOOP_PLATFORM_VALUES);

function normalizeString(value: string | null | undefined, fallback = ""): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeStringList(values: readonly string[] | undefined): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function mapSourcesToPlatforms(values: readonly string[]): LoopPlatform[] {
  return normalizeStringList(values).filter((value): value is LoopPlatform =>
    LOOP_PLATFORM_SET.has(value),
  );
}

function mapWorkModesToRemoteMode(values: readonly string[]): RemoteMode {
  return values.some((value) => value === "remote" || value === "remote_only")
    ? "remote_only"
    : "any";
}

function splitKeywords(value: string | undefined): string[] {
  if (!value) return [];
  return normalizeStringList(value.split(","));
}

function buildFilters(dto: BackendLoopDto): CanonicalFilters {
  const keywords = normalizeStringList(dto.keywords);
  const excludedKeywords = normalizeStringList(dto.excluded_keywords);
  const employmentTypes = normalizeStringList(dto.employment_types);
  const workModes = normalizeStringList(dto.work_modes);

  return {
    ...DEFAULT_CANONICAL_FILTERS,
    role: dto.target_role ?? "",
    location: dto.location ?? "",
    radiusKm: normalizeRadius(dto.radius_km ?? null),
    workMode: mapWorkModesToRemoteMode(workModes),
    includeKeywords: keywords.join(", "),
    excludeKeywords: excludedKeywords.join(", "),
    employmentType: mapEmploymentType(employmentTypes),
  };
}

function normalizeRadius(value: number | null): CanonicalFilters["radiusKm"] {
  if (value === 5 || value === 10 || value === 20 || value === 30 || value === 50 || value === 100) {
    return value;
  }
  return 30;
}

function mapEmploymentType(values: readonly string[]): CanonicalFilters["employmentType"] {
  const first = values[0];
  if (
    first === "full_time" ||
    first === "part_time" ||
    first === "contract" ||
    first === "internship" ||
    first === "ausbildung"
  ) {
    return first;
  }
  return DEFAULT_CANONICAL_FILTERS.employmentType;
}

function mapMetrics(dto: BackendLoopDto): LoopMetrics | null {
  if (dto.metrics == null) return null;
  return {
    matches_saved: dto.metrics.matches_saved,
    applications_total: dto.metrics.applications_total,
    applied_count: dto.metrics.applied_count ?? 0,
    interview_count: dto.metrics.interview_count ?? 0,
    offer_count: dto.metrics.offer_count ?? 0,
    rejected_count: dto.metrics.rejected_count ?? 0,
    response_rate: dto.metrics.response_rate ?? 0,
    interview_rate: dto.metrics.interview_rate ?? 0,
    offer_rate: dto.metrics.offer_rate ?? 0,
  };
}

export function mapBackendLoopDtoToLoop(dto: BackendLoopDto): Loop {
  const targetRole = normalizeString(dto.target_role);
  const title = normalizeString(dto.title ?? dto.name, targetRole || "Untitled loop");
  const selectedSources = normalizeStringList(dto.selected_sources);
  const sources = normalizeStringList(dto.sources);
  const effectiveSources = selectedSources.length > 0 ? selectedSources : sources;
  const platforms = mapSourcesToPlatforms(effectiveSources);
  const radiusKm = dto.radius_km ?? 30;
  const keywords = normalizeStringList(dto.keywords);
  const excludedKeywords = normalizeStringList(dto.excluded_keywords);
  const employmentTypes = normalizeStringList(dto.employment_types);
  const workModes = normalizeStringList(dto.work_modes);
  const createdAt = dto.created_at ?? "";
  const updatedAt = dto.updated_at ?? createdAt;

  return {
    id: dto.id,
    title,
    name: title,
    targetRole,
    titles: targetRole ? [targetRole] : [],
    location: dto.location ?? "",
    radiusKm,
    sources,
    status: dto.status ?? "active",
    keywords,
    excludedKeywords,
    employmentTypes,
    workModes,
    selectedSources,
    autoDiscoveryEnabled: dto.auto_discovery_enabled ?? false,
    discoveryRadiusKm: dto.discovery_radius_km ?? null,
    lastDiscoveryAt: dto.last_discovery_at ?? null,
    nextRunAt: dto.next_run_at ?? null,
    discoveryIntervalHours: dto.discovery_interval_hours ?? 4,
    createdAt,
    updatedAt,
    createdAtTs: createdAt ? Date.parse(createdAt) : null,
    updatedAtTs: updatedAt ? Date.parse(updatedAt) : null,
    filters: buildFilters(dto),
    remoteMode: mapWorkModesToRemoteMode(workModes),
    platforms,
    metrics: mapMetrics(dto),
  };
}

export function mapCreateLoopInputToDto(input: CreateBackendLoopInput): Record<string, unknown> {
  const targetRole = normalizeString(
    input.targetRole ?? input.titles?.[0] ?? input.filters?.role,
  );
  const sources = normalizeStringList(input.sources ?? input.platforms);
  const selectedSources = normalizeStringList(input.selectedSources ?? input.platforms ?? sources);
  const workModes = normalizeStringList(
    input.workModes ??
      (input.filters?.workMode ? [input.filters.workMode] : input.remoteMode === "remote_only" ? ["remote"] : []),
  );
  const title = normalizeString(input.title ?? input.name, targetRole || "Untitled loop");

  return {
    title,
    ...(targetRole ? { target_role: targetRole } : {}),
    ...(input.location !== undefined || input.filters?.location
      ? { location: input.location ?? input.filters?.location ?? null }
      : {}),
    ...(input.radiusKm !== undefined || input.filters?.radiusKm
      ? { radius_km: input.radiusKm ?? input.filters?.radiusKm ?? null }
      : {}),
    sources,
    status: input.status ?? "active",
    keywords: normalizeStringList(input.keywords ?? splitKeywords(input.filters?.includeKeywords)),
    excluded_keywords: normalizeStringList(
      input.excludedKeywords ?? splitKeywords(input.filters?.excludeKeywords),
    ),
    employment_types: normalizeStringList(
      input.employmentTypes ?? (input.filters?.employmentType ? [input.filters.employmentType] : []),
    ),
    work_modes: workModes,
    selected_sources: selectedSources,
    auto_discovery_enabled: input.autoDiscoveryEnabled ?? false,
    ...(input.discoveryIntervalHours !== undefined
      ? { discovery_interval_hours: input.discoveryIntervalHours }
      : {}),
    ...(input.discoveryRadiusKm !== undefined
      ? { discovery_radius_km: input.discoveryRadiusKm }
      : {}),
  };
}

// ─── Source stats ─────────────────────────────────────────────────────────────

export type SourceHealth = "ok" | "warning" | "error" | "never";

export interface LoopSourceStatDto {
  source_id: string;
  matches: number;
  applied: number;
  last_run_at: string | null;
  health: SourceHealth;
}

export interface LoopSourceStatsResponseDto {
  items: LoopSourceStatDto[];
}

export interface LoopSourceStat {
  sourceId: string;
  matches: number;
  applied: number;
  lastRunAt: string | null;
  health: SourceHealth;
}

export interface LoopSourceStatsResponse {
  items: LoopSourceStat[];
}

export function mapLoopSourceStatDto(dto: LoopSourceStatDto): LoopSourceStat {
  return {
    sourceId: dto.source_id,
    matches: dto.matches,
    applied: dto.applied,
    lastRunAt: dto.last_run_at ?? null,
    health: dto.health ?? "never",
  };
}

export function mapLoopSourceStatsResponseDto(
  dto: LoopSourceStatsResponseDto,
): LoopSourceStatsResponse {
  return { items: dto.items.map(mapLoopSourceStatDto) };
}

export function mapUpdateLoopInputToDto(input: UpdateBackendLoopInput): Record<string, unknown> {
  const dto = mapCreateLoopInputToDto(input);
  if (input.title === undefined && input.name === undefined) delete dto.title;
  if (input.status === undefined) delete dto.status;
  if (input.autoDiscoveryEnabled === undefined) delete dto.auto_discovery_enabled;
  if (input.discoveryIntervalHours === undefined) delete dto.discovery_interval_hours;
  if (input.sources === undefined && input.platforms === undefined) delete dto.sources;
  if (input.selectedSources === undefined && input.platforms === undefined) delete dto.selected_sources;
  if (input.keywords === undefined && input.filters?.includeKeywords === undefined) delete dto.keywords;
  if (input.excludedKeywords === undefined && input.filters?.excludeKeywords === undefined) {
    delete dto.excluded_keywords;
  }
  if (input.employmentTypes === undefined && input.filters?.employmentType === undefined) {
    delete dto.employment_types;
  }
  if (input.workModes === undefined && input.filters?.workMode === undefined && input.remoteMode === undefined) {
    delete dto.work_modes;
  }
  return dto;
}

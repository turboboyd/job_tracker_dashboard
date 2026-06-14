export type VacancyMatchStatus = "new" | "saved" | "converted";

export interface VacancyMatchPreviewDto {
  source_url: string;
  source: string;
  company_name: string | null;
  role_title: string | null;
  location_text: string | null;
  vacancy_description: string | null;
  confidence: Record<string, number>;
  warnings: string[];
}

export interface VacancyMatchDto {
  id: string;
  user_id: string;
  loop_id: string;
  source_url: string;
  source: string | null;
  external_id?: string | null;
  company_name: string | null;
  role_title: string | null;
  location_text: string | null;
  vacancy_description: string | null;
  raw_metadata?: Record<string, unknown>;
  confidence: Record<string, number>;
  warnings: string[];
  status: VacancyMatchStatus;
  application_id: string | null;
  seen_at?: string | null;
  posted_at?: string | null;
  // Backend-owned persisted match score (0–100). Null = not yet scored
  // (rows created before the scoring migration). See Stage 6c.
  score?: number | null;
  score_version?: number | null;
  created_at: string;
  updated_at: string;
}

export interface VacancyMatchListEnvelopeDto {
  items: VacancyMatchDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface ConvertVacancyMatchResponseDto {
  application_id: string;
  match: VacancyMatchDto;
}

export interface CreateApplicationFromMatchRequestDto {
  status?: "SAVED";
  notes?: string | null;
  favorite?: boolean;
}

export interface CreateApplicationFromMatchResponseDto {
  application: { id: string };
  match: VacancyMatchDto;
  created: boolean;
  already_linked: boolean;
}

export interface VacancyMatchFromPreviewResponseDto {
  match: VacancyMatchDto;
  created: boolean;
  duplicate: boolean;
}

export interface ApplicationFromPreviewResponseDto {
  application: { id: string; [key: string]: unknown };
  match_id: string | null;
  application_id: string;
  created: boolean;
  duplicate: boolean;
}

export interface SaveDiscoveryPreviewAsApplicationResult {
  applicationId: string;
  matchId: string | null;
  created: boolean;
  duplicate: boolean;
}

export interface VacancyMatchPreview {
  sourceUrl: string;
  source: string;
  companyName: string | null;
  roleTitle: string | null;
  locationText: string | null;
  vacancyDescription: string | null;
  confidence: Record<string, number>;
  warnings: string[];
}

export interface VacancyMatch {
  id: string;
  userId: string;
  loopId: string;
  sourceUrl: string;
  source: string | null;
  externalId: string | null;
  companyName: string | null;
  roleTitle: string | null;
  locationText: string | null;
  vacancyDescription: string | null;
  rawMetadata: Record<string, unknown>;
  confidence: Record<string, number>;
  warnings: string[];
  status: VacancyMatchStatus;
  applicationId: string | null;
  seenAt: string | null;
  postedAt: string | null;
  // Backend-owned persisted match score (0–100), or null when not yet scored.
  // The frontend only DISPLAYS this — it never computes a match score.
  score: number | null;
  scoreVersion: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VacancyMatchListEnvelope {
  items: VacancyMatch[];
  total: number;
  limit: number;
  offset: number;
}

export interface SaveVacancyMatchInput {
  sourceUrl: string;
  source?: string | null;
  externalId?: string | null;
  companyName?: string | null;
  roleTitle?: string | null;
  locationText?: string | null;
  vacancyDescription?: string | null;
  rawMetadata?: Record<string, unknown>;
  confidence?: Record<string, number>;
  warnings?: string[];
  status?: VacancyMatchStatus;
}

export interface SaveDiscoveryPreviewMatchInput {
  sourceId: string;
  externalId?: string | null;
  sourceUrl: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  postedAt?: string | null;
  rawMetadata?: Record<string, unknown>;
  confidence?: Record<string, number>;
}

export interface SaveDiscoveryPreviewMatchResult {
  match: VacancyMatch;
  created: boolean;
  duplicate: boolean;
}

export interface CreateApplicationFromMatchInput {
  status?: "SAVED";
  notes?: string | null;
  favorite?: boolean;
}

export interface CreateApplicationFromMatchResult {
  applicationId: string;
  match: VacancyMatch;
  created: boolean;
  alreadyLinked: boolean;
}

export interface PatchVacancyMatchInput {
  companyName?: string | null;
  roleTitle?: string | null;
  locationText?: string | null;
  vacancyDescription?: string | null;
  status?: VacancyMatchStatus;
}

export function mapVacancyMatchPreviewDto(dto: VacancyMatchPreviewDto): VacancyMatchPreview {
  return {
    sourceUrl: dto.source_url,
    source: dto.source,
    companyName: dto.company_name,
    roleTitle: dto.role_title,
    locationText: dto.location_text,
    vacancyDescription: dto.vacancy_description,
    confidence: dto.confidence,
    warnings: dto.warnings,
  };
}

export function mapVacancyMatchDto(dto: VacancyMatchDto): VacancyMatch {
  return {
    id: dto.id,
    userId: dto.user_id,
    loopId: dto.loop_id,
    sourceUrl: dto.source_url,
    source: dto.source,
    externalId: dto.external_id ?? null,
    companyName: dto.company_name,
    roleTitle: dto.role_title,
    locationText: dto.location_text,
    vacancyDescription: dto.vacancy_description,
    rawMetadata: dto.raw_metadata ?? {},
    confidence: dto.confidence,
    warnings: dto.warnings,
    status: dto.status,
    applicationId: dto.application_id,
    seenAt: dto.seen_at ?? null,
    postedAt: dto.posted_at ?? null,
    score: dto.score ?? null,
    scoreVersion: dto.score_version ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

// ── Cross-loop matches feed (GET /matches) ─────────────────────────────────
export type MatchesFeedTab = "all" | "new" | "saved";
// "posted" stays the default; "score" orders by the backend-owned match score.
export type MatchesFeedSort = "posted" | "company" | "loop" | "score";

export interface MatchesFeedItemDto extends VacancyMatchDto {
  loop_name: string | null;
}

export interface MatchesFeedCountsDto {
  all: number;
  new: number;
  saved: number;
}

export interface MatchesFeedResponseDto {
  items: MatchesFeedItemDto[];
  total: number;
  limit: number;
  offset: number;
  counts: MatchesFeedCountsDto;
}

export interface MatchesFeedItem {
  match: VacancyMatch;
  loopName: string | null;
}

export interface MatchesFeedCounts {
  all: number;
  new: number;
  saved: number;
}

export interface MatchesFeedResponse {
  items: MatchesFeedItem[];
  total: number;
  limit: number;
  offset: number;
  counts: MatchesFeedCounts;
}

export interface ListMatchesFeedInput {
  tab?: MatchesFeedTab;
  q?: string | null;
  source?: string | null;
  sort?: MatchesFeedSort;
  limit?: number;
  offset?: number;
}

export function mapMatchesFeedItemDto(dto: MatchesFeedItemDto): MatchesFeedItem {
  return {
    match: mapVacancyMatchDto(dto),
    loopName: dto.loop_name ?? null,
  };
}

export function mapMatchesFeedResponseDto(dto: MatchesFeedResponseDto): MatchesFeedResponse {
  return {
    items: dto.items.map(mapMatchesFeedItemDto),
    total: dto.total,
    limit: dto.limit,
    offset: dto.offset,
    counts: {
      all: dto.counts.all,
      new: dto.counts.new,
      saved: dto.counts.saved,
    },
  };
}

export function mapSaveVacancyMatchInputToDto(input: SaveVacancyMatchInput): Record<string, unknown> {
  return {
    source_url: input.sourceUrl,
    ...(input.source !== undefined ? { source: input.source } : {}),
    ...(input.externalId !== undefined ? { external_id: input.externalId } : {}),
    ...(input.companyName !== undefined ? { company_name: input.companyName } : {}),
    ...(input.roleTitle !== undefined ? { role_title: input.roleTitle } : {}),
    ...(input.locationText !== undefined ? { location_text: input.locationText } : {}),
    ...(input.vacancyDescription !== undefined
      ? { vacancy_description: input.vacancyDescription }
      : {}),
    raw_metadata: input.rawMetadata ?? {},
    confidence: input.confidence ?? {},
    warnings: input.warnings ?? [],
    status: input.status ?? "saved",
  };
}

export function mapSaveDiscoveryPreviewMatchInputToDto(
  input: SaveDiscoveryPreviewMatchInput,
): Record<string, unknown> {
  return {
    source_id: input.sourceId,
    ...(input.externalId !== undefined ? { external_id: input.externalId } : {}),
    source_url: input.sourceUrl,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.company !== undefined ? { company: input.company } : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.postedAt !== undefined ? { posted_at: input.postedAt } : {}),
    raw_metadata: input.rawMetadata ?? {},
    confidence: input.confidence ?? {},
  };
}

export function mapVacancyMatchFromPreviewResponseDto(
  dto: VacancyMatchFromPreviewResponseDto,
): SaveDiscoveryPreviewMatchResult {
  return {
    match: mapVacancyMatchDto(dto.match),
    created: dto.created,
    duplicate: dto.duplicate,
  };
}

export function mapCreateApplicationFromMatchInputToDto(
  input: CreateApplicationFromMatchInput = {},
): CreateApplicationFromMatchRequestDto {
  return {
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.favorite !== undefined ? { favorite: input.favorite } : {}),
  };
}

export function mapCreateApplicationFromMatchResponseDto(
  dto: CreateApplicationFromMatchResponseDto,
): CreateApplicationFromMatchResult {
  return {
    applicationId: dto.application.id,
    match: mapVacancyMatchDto(dto.match),
    created: dto.created,
    alreadyLinked: dto.already_linked,
  };
}

export function mapPatchVacancyMatchInputToDto(input: PatchVacancyMatchInput): Record<string, unknown> {
  return {
    ...(input.companyName !== undefined ? { company_name: input.companyName } : {}),
    ...(input.roleTitle !== undefined ? { role_title: input.roleTitle } : {}),
    ...(input.locationText !== undefined ? { location_text: input.locationText } : {}),
    ...(input.vacancyDescription !== undefined
      ? { vacancy_description: input.vacancyDescription }
      : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  };
}

export function mapApplicationFromPreviewResponseDto(
  dto: ApplicationFromPreviewResponseDto,
): SaveDiscoveryPreviewAsApplicationResult {
  return {
    applicationId: dto.application_id,
    matchId: dto.match_id,
    created: dto.created,
    duplicate: dto.duplicate,
  };
}

export type DuplicateStatus =
  | "none"
  | "possible_duplicate"
  | "likely_duplicate"
  | "exact_duplicate";

/** Machine-readable scoring explanation entry. Clients localize by `code`
 * (with `terms` carrying matched tokens/keywords) instead of parsing the legacy
 * English strings. Added in Stage 6c. */
export interface ScoreReasonEntryDto {
  code: string;
  terms: string[];
}

export interface ScoreReasonEntry {
  code: string;
  terms: string[];
}

export interface VacancyMatchEvaluationDto {
  match_id: string;
  loop_id: string;
  total_score: number;
  title_match_score: number;
  location_match_score: number;
  employment_type_match_score: number;
  work_mode_match_score: number;
  keyword_score: number;
  excluded_keyword_penalty: number;
  source_score: number;
  reasons: string[];
  penalties: string[];
  // Preferred over `reasons`/`penalties` when present (Stage 6c). Optional so
  // the mapper stays backward-compatible with older backends.
  reason_codes?: ScoreReasonEntryDto[];
  penalty_codes?: ScoreReasonEntryDto[];
  duplicate_status: DuplicateStatus;
  duplicate_of_match_id: string | null;
  duplicate_application_id: string | null;
  duplicate_reasons: string[];
}

export interface VacancyMatchEvaluation {
  matchId: string;
  loopId: string;
  totalScore: number;
  titleMatchScore: number;
  locationMatchScore: number;
  employmentTypeMatchScore: number;
  workModeMatchScore: number;
  keywordScore: number;
  excludedKeywordPenalty: number;
  sourceScore: number;
  reasons: string[];
  penalties: string[];
  reasonCodes: ScoreReasonEntry[];
  penaltyCodes: ScoreReasonEntry[];
  duplicateStatus: DuplicateStatus;
  duplicateOfMatchId: string | null;
  duplicateApplicationId: string | null;
  duplicateReasons: string[];
}

export function mapVacancyMatchEvaluationDto(
  dto: VacancyMatchEvaluationDto,
): VacancyMatchEvaluation {
  return {
    matchId: dto.match_id,
    loopId: dto.loop_id,
    totalScore: dto.total_score,
    titleMatchScore: dto.title_match_score,
    locationMatchScore: dto.location_match_score,
    employmentTypeMatchScore: dto.employment_type_match_score,
    workModeMatchScore: dto.work_mode_match_score,
    keywordScore: dto.keyword_score,
    excludedKeywordPenalty: dto.excluded_keyword_penalty,
    sourceScore: dto.source_score,
    reasons: dto.reasons,
    penalties: dto.penalties,
    reasonCodes: (dto.reason_codes ?? []).map((entry) => ({
      code: entry.code,
      terms: entry.terms ?? [],
    })),
    penaltyCodes: (dto.penalty_codes ?? []).map((entry) => ({
      code: entry.code,
      terms: entry.terms ?? [],
    })),
    duplicateStatus: dto.duplicate_status,
    duplicateOfMatchId: dto.duplicate_of_match_id,
    duplicateApplicationId: dto.duplicate_application_id,
    duplicateReasons: dto.duplicate_reasons,
  };
}

export type VacancyMatchStatus = "new" | "saved" | "ignored" | "converted";

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

export interface VacancyPreviewIgnoreDto {
  id: string;
  user_id: string;
  loop_id: string;
  source_id: string;
  external_id?: string | null;
  source_url: string;
  title?: string | null;
  company?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VacancyPreviewIgnoreResponseDto {
  item: VacancyPreviewIgnoreDto;
  created: boolean;
  duplicate: boolean;
}

export interface VacancyPreviewIgnoreListEnvelopeDto {
  items: VacancyPreviewIgnoreDto[];
  total: number;
  limit: number;
  offset: number;
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

export interface IgnoreDiscoveryPreviewInput {
  sourceId: string;
  externalId?: string | null;
  sourceUrl: string;
  title?: string | null;
  company?: string | null;
}

export interface VacancyPreviewIgnore {
  id: string;
  userId: string;
  loopId: string;
  sourceId: string;
  externalId: string | null;
  sourceUrl: string;
  title: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IgnoreDiscoveryPreviewResult {
  item: VacancyPreviewIgnore;
  created: boolean;
  duplicate: boolean;
}

export interface VacancyPreviewIgnoreListEnvelope {
  items: VacancyPreviewIgnore[];
  total: number;
  limit: number;
  offset: number;
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
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
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

export function mapIgnoreDiscoveryPreviewInputToDto(
  input: IgnoreDiscoveryPreviewInput,
): Record<string, unknown> {
  return {
    source_id: input.sourceId,
    ...(input.externalId !== undefined ? { external_id: input.externalId } : {}),
    source_url: input.sourceUrl,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.company !== undefined ? { company: input.company } : {}),
  };
}

export function mapVacancyPreviewIgnoreDto(
  dto: VacancyPreviewIgnoreDto,
): VacancyPreviewIgnore {
  return {
    id: dto.id,
    userId: dto.user_id,
    loopId: dto.loop_id,
    sourceId: dto.source_id,
    externalId: dto.external_id ?? null,
    sourceUrl: dto.source_url,
    title: dto.title ?? null,
    company: dto.company ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function mapVacancyPreviewIgnoreResponseDto(
  dto: VacancyPreviewIgnoreResponseDto,
): IgnoreDiscoveryPreviewResult {
  return {
    item: mapVacancyPreviewIgnoreDto(dto.item),
    created: dto.created,
    duplicate: dto.duplicate,
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

import type { CreateApplicationInput } from "src/entities/application";
import type {
  ApplicationHistoryRow,
  ApplicationRow,
} from "src/features/applications/firestore/queries.types";
import {
  restDelete,
  restGet,
  restGetBlob,
  restPatch,
  restPost,
  type RestBlobResponse,
} from "src/shared/api";
import { getBackendConfig } from "src/shared/config";

import {
  mapCreateInputToDto,
  mapDocumentDtoToModel,
  mapDtoToDoc,
  mapHistoryDtoToDoc,
  mapPatchToDto,
  type ApplicationDocument,
  type ApplicationReadDto,
  type DocumentReadDto,
  type HistoryItemReadDto,
} from "./adapter";

export const APPLICATION_LIST_DEFAULT_LIMIT = 20;
export const APPLICATION_LIST_MAX_LIMIT = 100;
export const HISTORY_LIST_DEFAULT_LIMIT = 20;
export const HISTORY_LIST_MAX_LIMIT = 100;

export type ApplicationListSort =
  | "created_at_desc"
  | "created_at_asc"
  | "updated_at_desc"
  | "updated_at_asc"
  | "last_status_change_at_desc"
  | "last_status_change_at_asc";

export interface ApplicationListQuery {
  archived?: boolean;
  status?: string | string[];
  stage?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: ApplicationListSort;
  loopId?: string;
  isFavorite?: boolean;
}

export interface ApplicationListResponseDto {
  items: ApplicationReadDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApplicationListResult {
  items: ApplicationRow[];
  total: number;
  limit: number;
  offset: number;
}


export interface VacancyImportPreviewRequestDto {
  url: string;
}

export interface VacancyImportPreviewResponseDto {
  source_url: string;
  source: string;
  company_name: string | null;
  role_title: string | null;
  location_text: string | null;
  vacancy_description: string | null;
  confidence: Record<string, number>;
  warnings: string[];
}

export interface VacancyImportPreview {
  sourceUrl: string;
  source: string;
  companyName: string | null;
  roleTitle: string | null;
  locationText: string | null;
  vacancyDescription: string | null;
  confidence: Record<string, number>;
  warnings: string[];
}

export interface CurrentUserReadDto {
  id: string;
  firebase_uid: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  language: string;
  timezone: string;
  date_format: string;
  created_at: string;
  updated_at: string;
}


export interface DocumentListResponseDto {
  items: DocumentReadDto[];
  total: number;
}

export interface ApplicationDocumentListResult {
  items: ApplicationDocument[];
  total: number;
}

export type DocumentKind = "cv" | "cover_letter" | "portfolio" | "other";

export interface ApplicationDocumentUploadInput {
  file: File;
  kind: DocumentKind;
}

export interface ApplicationDocumentUploadValidationResult {
  ok: boolean;
  message?: string;
}

export const DOCUMENT_UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024;

const DOCUMENT_UPLOAD_ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "txt",
  "zip",
]);

const DOCUMENT_UPLOAD_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

export function validateApplicationDocumentUploadFile(
  file: Pick<File, "name" | "size" | "type">,
): ApplicationDocumentUploadValidationResult {
  if (file.size > DOCUMENT_UPLOAD_MAX_SIZE_BYTES) {
    return {
      ok: false,
      message: "Файл слишком большой. Максимальный размер — 10 MB.",
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const hasAllowedExtension = DOCUMENT_UPLOAD_ALLOWED_EXTENSIONS.has(extension);
  const hasAllowedMimeType = file.type
    ? DOCUMENT_UPLOAD_ALLOWED_MIME_TYPES.has(file.type.toLowerCase())
    : false;

  if (!hasAllowedExtension && !hasAllowedMimeType) {
    return {
      ok: false,
      message: "Можно загрузить только PDF, DOCX, TXT или ZIP.",
    };
  }

  return { ok: true };
}

export interface DocumentDownloadResult extends RestBlobResponse {
  filename?: string;
}

export interface HistoryListResponseDto {
  items: HistoryItemReadDto[];
  total: number;
  limit: number;
  offset: number;
}

export type ApplicationHistoryTypeFilter =
  | "APPLICATION_CREATED"
  | "STATUS_CHANGE"
  | "FIELD_CHANGE"
  | "COMMENT"
  | "APPLICATION_ARCHIVED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DELETED";

export interface ApplicationHistoryQuery {
  limit?: number;
  offset?: number;
  type?: ApplicationHistoryTypeFilter;
}

export interface ApplicationHistoryListResult {
  items: ApplicationHistoryRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApplicationCommentInput {
  text: string;
  feedbackType?: string | null;
  sentiment?: string | null;
  rejectionReasonCode?: string | null;
  correlationId?: string | null;
}

export interface ApplicationCommentRequestDto {
  text: string;
  feedback_type?: string | null;
  sentiment?: string | null;
  rejection_reason_code?: string | null;
  correlation_id?: string | null;
}

export interface ApplicationStatusChangeInput {
  toStatus: string;
  subStatus?: string | null;
  comment?: string | null;
  correlationId?: string | null;
}

export interface ApplicationStatusChangeDto {
  to_status: string;
  sub_status?: string | null;
  comment?: string | null;
  correlation_id?: string | null;
}

export type ApplicationPatchInput = Record<string, unknown>;

function clampApplicationListLimit(limit: number | undefined): number | undefined {
  if (limit === undefined) return undefined;
  return Math.max(1, Math.min(limit, APPLICATION_LIST_MAX_LIMIT));
}

function appendQueryParam(
  params: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    if (value.length > 0) params.set(key, value.join(","));
    return;
  }

  if (typeof value === "boolean") {
    params.set(key, value ? "true" : "false");
    return;
  }

  params.set(key, String(value));
}

export function buildApplicationsListUrl(
  apiBaseUrl: string,
  query: ApplicationListQuery = {},
): string {
  const params = new URLSearchParams();

  appendQueryParam(params, "archived", query.archived);
  appendQueryParam(params, "status", query.status);
  appendQueryParam(params, "stage", query.stage);
  appendQueryParam(params, "search", query.search);
  appendQueryParam(params, "limit", clampApplicationListLimit(query.limit));
  appendQueryParam(params, "offset", query.offset);
  appendQueryParam(params, "sort", query.sort);
  appendQueryParam(params, "loop_id", query.loopId);
  appendQueryParam(params, "is_favorite", query.isFavorite);

  const queryString = params.toString();
  const suffix = queryString ? `?${queryString}` : "";
  return `${apiBaseUrl}/applications${suffix}`;
}

export function buildVacancyImportPreviewUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl}/vacancy-import/preview`;
}

export function buildCurrentUserUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl}/users/me`;
}

export async function getCurrentUserViaRest(): Promise<CurrentUserReadDto> {
  const { apiBaseUrl } = getBackendConfig();
  return restGet<CurrentUserReadDto>(buildCurrentUserUrl(apiBaseUrl));
}

export function mapVacancyImportPreviewDto(
  dto: VacancyImportPreviewResponseDto,
): VacancyImportPreview {
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

export async function previewVacancyImportViaRest(
  url: string,
): Promise<VacancyImportPreview> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<VacancyImportPreviewResponseDto>(
    buildVacancyImportPreviewUrl(apiBaseUrl),
    { url } satisfies VacancyImportPreviewRequestDto,
  );
  return mapVacancyImportPreviewDto(dto);
}


export async function listApplicationsViaRest(
  userId: string,
  query: ApplicationListQuery = {},
): Promise<ApplicationListResult> {
  const { apiBaseUrl } = getBackendConfig();
  const response = await restGet<ApplicationListResponseDto>(
    buildApplicationsListUrl(apiBaseUrl, query),
  );

  return {
    items: response.items.map((dto) => mapApplicationReadResult(dto, userId)),
    total: response.total,
    limit: response.limit,
    offset: response.offset,
  };
}

export async function createApplicationViaRest(
  userId: string,
  input: CreateApplicationInput,
): Promise<ApplicationRow> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<ApplicationReadDto>(
    `${apiBaseUrl}/applications`,
    mapCreateInputToDto(input),
  );
  return mapApplicationReadResult(dto, userId);
}


export function buildApplicationDetailUrl(
  apiBaseUrl: string,
  appId: string,
): string {
  return `${apiBaseUrl}/applications/${encodeURIComponent(appId)}`;
}

export function buildApplicationStatusUrl(
  apiBaseUrl: string,
  appId: string,
): string {
  return `${buildApplicationDetailUrl(apiBaseUrl, appId)}/status`;
}

function clampHistoryListLimit(limit: number | undefined): number | undefined {
  if (limit === undefined) return undefined;
  return Math.min(limit, HISTORY_LIST_MAX_LIMIT);
}

export function buildApplicationHistoryUrl(
  apiBaseUrl: string,
  appId: string,
  query: ApplicationHistoryQuery = {},
): string {
  const params = new URLSearchParams();
  appendQueryParam(params, "limit", clampHistoryListLimit(query.limit));
  appendQueryParam(params, "offset", query.offset);
  appendQueryParam(params, "type", query.type);

  const queryString = params.toString();
  return `${buildApplicationDetailUrl(apiBaseUrl, appId)}/history${
    queryString ? `?${queryString}` : ""
  }`;
}

export function buildApplicationCommentsUrl(
  apiBaseUrl: string,
  appId: string,
): string {
  return `${buildApplicationDetailUrl(apiBaseUrl, appId)}/comments`;
}

export function buildApplicationDocumentsUrl(
  apiBaseUrl: string,
  appId: string,
): string {
  return `${buildApplicationDetailUrl(apiBaseUrl, appId)}/documents`;
}

export function buildDocumentDetailUrl(
  apiBaseUrl: string,
  documentId: string,
): string {
  return `${apiBaseUrl}/documents/${encodeURIComponent(documentId)}`;
}

export function buildDocumentDownloadUrl(
  apiBaseUrl: string,
  documentId: string,
): string {
  return `${buildDocumentDetailUrl(apiBaseUrl, documentId)}/download`;
}

function parseFilenameFromContentDisposition(
  contentDisposition?: string,
): string | undefined {
  if (!contentDisposition) return undefined;

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].replace(/^"|"$/g, "");
    }
  }

  const filenameMatch = /filename=("([^"]+)"|([^;]+))/i.exec(
    contentDisposition,
  );
  return (filenameMatch?.[2] ?? filenameMatch?.[3])?.trim();
}

function mapStatusChangeInputToDto(
  input: ApplicationStatusChangeInput,
): ApplicationStatusChangeDto {
  return {
    to_status: input.toStatus,
    ...(input.subStatus !== undefined ? { sub_status: input.subStatus } : {}),
    ...(input.comment !== undefined ? { comment: input.comment } : {}),
    ...(input.correlationId !== undefined
      ? { correlation_id: input.correlationId }
      : {}),
  };
}

function mapCommentInputToDto(
  input: ApplicationCommentInput,
): ApplicationCommentRequestDto {
  return {
    text: input.text,
    ...(input.feedbackType !== undefined
      ? { feedback_type: input.feedbackType }
      : {}),
    ...(input.sentiment !== undefined ? { sentiment: input.sentiment } : {}),
    ...(input.rejectionReasonCode !== undefined
      ? { rejection_reason_code: input.rejectionReasonCode }
      : {}),
    ...(input.correlationId !== undefined
      ? { correlation_id: input.correlationId }
      : {}),
  };
}

function mapHistoryReadResult(dto: HistoryItemReadDto): ApplicationHistoryRow {
  return {
    id: dto.id,
    data: mapHistoryDtoToDoc(dto),
  };
}

function mapApplicationReadResult(
  dto: ApplicationReadDto,
  fallbackUserId: string,
): ApplicationRow {
  return {
    id: dto.id,
    data: mapDtoToDoc(dto, dto.user_id || fallbackUserId),
  };
}

export async function getApplicationByIdViaRest(
  userId: string,
  appId: string,
): Promise<ApplicationRow> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<ApplicationReadDto>(
    buildApplicationDetailUrl(apiBaseUrl, appId),
  );
  return mapApplicationReadResult(dto, userId);
}

export async function updateApplicationViaRest(
  userId: string,
  appId: string,
  patch: ApplicationPatchInput,
): Promise<ApplicationRow> {
  const { apiBaseUrl } = getBackendConfig();
  const body = mapPatchToDto(patch);
  const dto = await restPatch<ApplicationReadDto>(
    buildApplicationDetailUrl(apiBaseUrl, appId),
    body,
  );
  return mapApplicationReadResult(dto, userId);
}

export async function changeApplicationStatusViaRest(
  userId: string,
  appId: string,
  input: ApplicationStatusChangeInput,
): Promise<ApplicationRow> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restPost<ApplicationReadDto>(
    buildApplicationStatusUrl(apiBaseUrl, appId),
    mapStatusChangeInputToDto(input),
  );
  return mapApplicationReadResult(dto, userId);
}

export async function getApplicationHistoryPageViaRest(
  appId: string,
  query: ApplicationHistoryQuery = {},
): Promise<ApplicationHistoryListResult> {
  const { apiBaseUrl } = getBackendConfig();
  const response = await restGet<HistoryListResponseDto>(
    buildApplicationHistoryUrl(apiBaseUrl, appId, {
      limit: query.limit ?? HISTORY_LIST_DEFAULT_LIMIT,
      offset: query.offset ?? 0,
      type: query.type,
    }),
  );

  return {
    items: response.items.map(mapHistoryReadResult),
    total: response.total,
    limit: response.limit,
    offset: response.offset,
  };
}

export async function getApplicationHistoryViaRest(
  appId: string,
  limit = HISTORY_LIST_DEFAULT_LIMIT,
): Promise<ApplicationHistoryRow[]> {
  const response = await getApplicationHistoryPageViaRest(appId, {
    limit,
    offset: 0,
  });
  return response.items;
}

export async function createApplicationCommentViaRest(
  appId: string,
  input: string | ApplicationCommentInput,
): Promise<ApplicationHistoryRow> {
  const { apiBaseUrl } = getBackendConfig();
  const commentInput = typeof input === "string" ? { text: input } : input;
  const dto = await restPost<HistoryItemReadDto>(
    buildApplicationCommentsUrl(apiBaseUrl, appId),
    mapCommentInputToDto(commentInput),
  );
  return mapHistoryReadResult(dto);
}

export async function deleteApplicationViaRest(appId: string): Promise<void> {
  const { apiBaseUrl } = getBackendConfig();
  await restDelete(buildApplicationDetailUrl(apiBaseUrl, appId));
}

export async function listApplicationDocumentsViaRest(
  appId: string,
): Promise<ApplicationDocumentListResult> {
  const { apiBaseUrl } = getBackendConfig();
  const response = await restGet<DocumentListResponseDto>(
    buildApplicationDocumentsUrl(apiBaseUrl, appId),
  );

  return {
    items: response.items.map(mapDocumentDtoToModel),
    total: response.total,
  };
}

export async function uploadApplicationDocumentViaRest(
  appId: string,
  input: ApplicationDocumentUploadInput,
): Promise<ApplicationDocument> {
  const { apiBaseUrl } = getBackendConfig();
  const form = new FormData();
  form.set("file", input.file);
  form.set("kind", input.kind);

  const dto = await restPost<DocumentReadDto>(
    buildApplicationDocumentsUrl(apiBaseUrl, appId),
    form,
  );

  return mapDocumentDtoToModel(dto);
}

export async function getDocumentViaRest(
  documentId: string,
): Promise<ApplicationDocument> {
  const { apiBaseUrl } = getBackendConfig();
  const dto = await restGet<DocumentReadDto>(
    buildDocumentDetailUrl(apiBaseUrl, documentId),
  );
  return mapDocumentDtoToModel(dto);
}

export async function downloadDocumentViaRest(
  documentId: string,
): Promise<DocumentDownloadResult> {
  const { apiBaseUrl } = getBackendConfig();
  const response = await restGetBlob(
    buildDocumentDownloadUrl(apiBaseUrl, documentId),
  );
  return {
    ...response,
    filename: parseFilenameFromContentDisposition(response.contentDisposition),
  };
}

export async function deleteDocumentViaRest(documentId: string): Promise<void> {
  const { apiBaseUrl } = getBackendConfig();
  await restDelete(buildDocumentDetailUrl(apiBaseUrl, documentId));
}

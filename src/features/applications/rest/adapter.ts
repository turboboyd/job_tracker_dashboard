/**
 * Adapter layer between the FastAPI backend DTOs (flat snake_case)
 * and the frontend ApplicationDoc shape (nested camelCase, Firestore Timestamps).
 *
 * All functions are pure and import-free of network/Firebase, making them
 * straightforward to unit-test.
 */
import { Timestamp } from "firebase/firestore";

import type {
  ApplicationDoc,
  AppliedVia,
  CreateApplicationInput,
  EmploymentType,
  ProcessStage,
  ProcessStatus,
  ReminderEntry,
  WorkMode,
  FeedbackType,
  HistoryActor,
  HistoryEventDoc,
  HistoryType,
  RejectionReasonCode,
  Sentiment,
} from "src/entities/application";

// ── Backend DTO types ──────────────────────────────────────────────────────────

export interface ReminderDto {
  id: string;
  at: string; // ISO 8601
  text?: string;
}

export interface SalaryDto {
  currency?: string;
  min?: number;
  max?: number;
}

/** Shape returned by GET /applications and GET /applications/{id}. */
export interface ApplicationReadDto {
  id: string;
  user_id: string;
  archived: boolean;
  is_favorite: boolean;
  // Job
  company_name: string;
  role_title: string;
  location_text: string | null;
  vacancy_url: string | null;
  source: string | null;
  employment_type: string | null;
  work_mode: string | null;
  salary: SalaryDto | null;
  posted_at: string | null;
  // Process
  status: string;
  stage: string | null;
  sub_status: string | null;
  last_status_change_at: string;
  applied_at: string | null;
  applied_via: string | null;
  next_action_at: string | null;
  next_action_text: string | null;
  contact_attempts: number;
  last_contact_at: string | null;
  last_follow_up_at: string | null;
  follow_up_level: number;
  needs_follow_up: boolean;
  follow_up_due_at: string | null;
  needs_reapply_suggestion: boolean;
  reapply_eligible_at: string | null;
  reapply_reason: string | null;
  reminders: ReminderDto[] | null;
  // Notes
  current_note: string | null;
  tags: string[] | null;
  // Vacancy
  vacancy_description: string | null;
  role_fingerprint: string | null;
  // Linkage
  loop_id: string | null;
  has_loop: boolean;
  cv_version_id: string | null;
  profile_version_id: string | null;
  // Derived metrics
  days_in_pipeline?: number | null;
  days_since_applied?: number | null;
  days_in_current_status?: number | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}


/** Shape returned by GET /applications/{id}/history and POST /applications/{id}/comments. */
export interface HistoryItemReadDto {
  id: string;
  application_id: string;
  user_id: string;
  actor: string;
  type: string;
  from_status: string | null;
  to_status: string | null;
  field_path: string | null;
  old_value: unknown;
  new_value: unknown;
  comment: string | null;
  feedback_type: string | null;
  sentiment: string | null;
  rejection_reason_code: string | null;
  correlation_id: string | null;
  created_at: string;
}


export interface DocumentReadDto {
  id: string;
  application_id: string;
  kind: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  sha256_hash: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  kind: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  sha256Hash: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ── Timestamp helpers ──────────────────────────────────────────────────────────

function isoToTs(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso));
}

function maybeTs(iso: string | null | undefined): Timestamp | undefined {
  if (!iso) return undefined;
  return isoToTs(iso);
}

// ── REST DTO → ApplicationDoc ──────────────────────────────────────────────────

export function mapDtoToDoc(dto: ApplicationReadDto, userId: string): ApplicationDoc {
  const reminders: ReminderEntry[] | undefined = dto.reminders
    ? dto.reminders.map((r) => ({
        id: r.id,
        at: isoToTs(r.at),
        ...(r.text !== undefined ? { text: r.text } : {}),
      }))
    : undefined;

  const doc: ApplicationDoc = {
    createdAt: isoToTs(dto.created_at),
    updatedAt: isoToTs(dto.updated_at),
    createdBy: userId,
    archived: dto.archived,
    isFavorite: dto.is_favorite,

    job: {
      companyName: dto.company_name,
      roleTitle: dto.role_title,
      ...(dto.location_text !== null ? { locationText: dto.location_text } : {}),
      ...(dto.vacancy_url !== null ? { vacancyUrl: dto.vacancy_url } : {}),
      ...(dto.source !== null ? { source: dto.source } : {}),
      ...(dto.employment_type !== null
        ? { employmentType: dto.employment_type as EmploymentType }
        : {}),
      ...(dto.work_mode !== null ? { workMode: dto.work_mode as WorkMode } : {}),
      ...(dto.salary !== null ? { salary: dto.salary } : {}),
      ...(dto.posted_at !== null ? { postedAt: isoToTs(dto.posted_at) } : {}),
    },

    process: {
      status: dto.status as ProcessStatus,
      ...(dto.stage !== null ? { stage: dto.stage as ProcessStage } : {}),
      ...(dto.sub_status !== null ? { subStatus: dto.sub_status } : {}),
      lastStatusChangeAt: isoToTs(dto.last_status_change_at),
      ...(dto.applied_at !== null ? { appliedAt: isoToTs(dto.applied_at) } : {}),
      ...(dto.applied_via !== null ? { appliedVia: dto.applied_via as AppliedVia } : {}),
      ...(dto.next_action_at !== null ? { nextActionAt: isoToTs(dto.next_action_at) } : {}),
      ...(dto.next_action_text !== null ? { nextActionText: dto.next_action_text } : {}),
      contactAttempts: dto.contact_attempts,
      ...(dto.last_contact_at !== null ? { lastContactAt: isoToTs(dto.last_contact_at) } : {}),
      ...(dto.last_follow_up_at !== null
        ? { lastFollowUpAt: isoToTs(dto.last_follow_up_at) }
        : {}),
      followUpLevel: dto.follow_up_level,
      needsFollowUp: dto.needs_follow_up,
      ...(dto.follow_up_due_at !== null ? { followUpDueAt: isoToTs(dto.follow_up_due_at) } : {}),
      needsReapplySuggestion: dto.needs_reapply_suggestion,
      ...(dto.reapply_eligible_at !== null
        ? { reapplyEligibleAt: isoToTs(dto.reapply_eligible_at) }
        : {}),
      ...(dto.reapply_reason !== null ? { reapplyReason: dto.reapply_reason } : {}),
      ...(reminders !== undefined ? { reminders } : {}),
    },

    ...(dto.current_note !== null || (dto.tags !== null && dto.tags.length > 0)
      ? {
          notes: {
            ...(dto.current_note !== null ? { currentNote: dto.current_note } : {}),
            ...(dto.tags !== null ? { tags: dto.tags } : {}),
          },
        }
      : {}),

    ...(dto.vacancy_description !== null || dto.role_fingerprint !== null
      ? {
          vacancy: {
            ...(dto.vacancy_description !== null
              ? { rawDescription: dto.vacancy_description }
              : {}),
            ...(dto.role_fingerprint !== null ? { roleFingerprint: dto.role_fingerprint } : {}),
          },
        }
      : {}),

    ...(dto.loop_id !== null
      ? { loopLinkage: { loopId: dto.loop_id, source: "manual" as const } }
      : {}),

    hasLoop: dto.has_loop,

    ...(dto.days_in_pipeline !== null && dto.days_in_pipeline !== undefined
      ? { daysInPipeline: dto.days_in_pipeline }
      : {}),
    ...(dto.days_since_applied !== null && dto.days_since_applied !== undefined
      ? { daysSinceApplied: dto.days_since_applied }
      : {}),
    ...(dto.days_in_current_status !== null && dto.days_in_current_status !== undefined
      ? { daysInCurrentStatus: dto.days_in_current_status }
      : {}),

    ...(dto.cv_version_id !== null || dto.profile_version_id !== null
      ? {
          cvLinkage: {
            ...(dto.cv_version_id !== null ? { cvVersionId: dto.cv_version_id } : {}),
            ...(dto.profile_version_id !== null
              ? { profileVersionId: dto.profile_version_id }
              : {}),
          },
        }
      : {}),
  };

  return doc;
}

// ── CreateApplicationInput → REST body ─────────────────────────────────────────

export function mapCreateInputToDto(input: CreateApplicationInput): Record<string, unknown> {
  return {
    company_name: input.companyName,
    role_title: input.roleTitle,
    ...(input.isFavorite !== undefined ? { is_favorite: input.isFavorite } : {}),
    ...(input.vacancyUrl !== undefined ? { vacancy_url: input.vacancyUrl } : {}),
    ...(input.source !== undefined ? { source: input.source } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.locationText !== undefined ? { location_text: input.locationText } : {}),
    ...(input.workMode !== undefined ? { work_mode: input.workMode } : {}),
    ...(input.employmentType !== undefined ? { employment_type: input.employmentType } : {}),
    ...(input.tags !== undefined ? { tags: input.tags } : {}),
    ...(input.currentNote !== undefined ? { current_note: input.currentNote } : {}),
    ...(input.rawDescription !== undefined ? { vacancy_description: input.rawDescription } : {}),
    ...(input.loopId !== undefined ? { loop_id: input.loopId } : {}),
  };
}

// ── Patch → REST body ──────────────────────────────────────────────────────────

// Maps dot-path or nested Firestore patch keys to REST snake_case fields.
const DOT_PATH_MAP: Readonly<Record<string, string>> = {
  archived: "archived",
  isFavorite: "is_favorite",
  "job.companyName": "company_name",
  "job.roleTitle": "role_title",
  "job.locationText": "location_text",
  "job.vacancyUrl": "vacancy_url",
  "job.source": "source",
  "job.employmentType": "employment_type",
  "job.workMode": "work_mode",
  "job.salary": "salary",
  "job.postedAt": "posted_at",
  "process.status": "status",
  "process.subStatus": "sub_status",
  "process.appliedAt": "applied_at",
  "process.appliedVia": "applied_via",
  "process.nextActionAt": "next_action_at",
  "process.nextActionText": "next_action_text",
  "process.contactAttempts": "contact_attempts",
  "process.lastContactAt": "last_contact_at",
  "process.lastFollowUpAt": "last_follow_up_at",
  "process.followUpLevel": "follow_up_level",
  "process.reminders": "reminders",
  "process.reapplyReason": "reapply_reason",
  "notes.currentNote": "current_note",
  "notes.tags": "tags",
  "vacancy.rawDescription": "vacancy_description",
  "cvLinkage.cvVersionId": "cv_version_id",
  "cvLinkage.profileVersionId": "profile_version_id",
};

function isTimestampLike(v: unknown): boolean {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>)["toDate"] === "function"
  );
}

function serializeFieldValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (isTimestampLike(value)) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(serializeFieldValue);
  return value;
}

/**
 * Map a Firestore-style patch (dot-path keys or nested objects) to a flat
 * REST snake_case body suitable for PATCH /applications/{id}.
 *
 * Fields that have no REST equivalent (matching, priority, integrations, …)
 * are silently ignored — the server manages them independently.
 */
export function mapPatchToDto(
  patch: Partial<ApplicationDoc> | Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(patch)) {
    // 1. Dot-path key (e.g. "process.status")
    const directMapping = DOT_PATH_MAP[key];
    if (directMapping !== undefined) {
      result[directMapping] = serializeFieldValue(value);
      continue;
    }

    // 2. Nested object key (e.g. { process: { status: "APPLIED" } })
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !isTimestampLike(value) &&
      !(value instanceof Date)
    ) {
      for (const [nestedKey, nestedValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        const mappedKey = DOT_PATH_MAP[`${key}.${nestedKey}`];
        if (mappedKey !== undefined) {
          result[mappedKey] = serializeFieldValue(nestedValue);
        }
      }
    }
    // Unknown keys (matching, priority, loopLinkage, etc.) are intentionally skipped.
  }

  return result;
}


// ── History DTO → HistoryEventDoc ─────────────────────────────────────────────

export function mapHistoryDtoToDoc(dto: HistoryItemReadDto): HistoryEventDoc {
  return {
    createdAt: isoToTs(dto.created_at),
    actor: dto.actor as HistoryActor,
    type: dto.type as HistoryType,
    ...(dto.from_status !== null ? { fromStatus: dto.from_status as ProcessStatus } : {}),
    ...(dto.to_status !== null ? { toStatus: dto.to_status as ProcessStatus } : {}),
    ...(dto.field_path !== null ? { fieldPath: dto.field_path } : {}),
    ...(dto.old_value !== null ? { oldValue: dto.old_value } : {}),
    ...(dto.new_value !== null ? { newValue: dto.new_value } : {}),
    ...(dto.comment !== null ? { comment: dto.comment } : {}),
    ...(dto.feedback_type !== null ? { feedbackType: dto.feedback_type as FeedbackType } : {}),
    ...(dto.sentiment !== null ? { sentiment: dto.sentiment as Sentiment } : {}),
    ...(dto.rejection_reason_code !== null
      ? { rejectionReasonCode: dto.rejection_reason_code as RejectionReasonCode }
      : {}),
    ...(dto.correlation_id !== null ? { correlationId: dto.correlation_id } : {}),
  };
}


// ── Document DTO → UI model ─────────────────────────────────────────────────

export function mapDocumentDtoToModel(dto: DocumentReadDto): ApplicationDocument {
  return {
    id: dto.id,
    applicationId: dto.application_id,
    kind: dto.kind,
    originalFilename: dto.original_filename,
    contentType: dto.content_type,
    sizeBytes: dto.size_bytes,
    sha256Hash: dto.sha256_hash,
    status: dto.status,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

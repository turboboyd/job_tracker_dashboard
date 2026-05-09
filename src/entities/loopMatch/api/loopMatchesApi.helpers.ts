import { Timestamp } from "firebase/firestore";

import {
  normalizeStatus,
  STATUS,
  type ApplicationDoc,
  type ProcessStatus,
} from "src/entities/application";
import {
  LOOP_PLATFORM_VALUES,
  type LoopPlatform,
} from "src/entities/loop/model";

import type { LoopMatch, UpdateLoopMatchInput } from "../model/types";

export function isoNow(): string {
  return new Date().toISOString();
}

export function normalizeUrl(input: string): string {
  const value = String(input ?? "").trim();

  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) return `https://${value}`;

  return value;
}

export function cleanPatch(patch: UpdateLoopMatchInput["patch"]): UpdateLoopMatchInput["patch"] {
  const out: UpdateLoopMatchInput["patch"] = { ...patch };

  if (typeof out.url === "string") out.url = normalizeUrl(out.url);

  return out;
}

export function statusKeyToProcessStatus(status: LoopMatch["status"]): ProcessStatus {
  const meta = STATUS[status];

  switch (meta.stage) {
    case "ACTIVE":
      return "APPLIED";
    case "INTERVIEW":
      return "INTERVIEW_1";
    case "OFFER":
      return "OFFER";
    case "HIRED":
      return "OFFER";
    case "REJECTED":
      return "REJECTED";
    case "NO_RESPONSE":
      return "NO_RESPONSE";
    case "ARCHIVED":
      return "SAVED";
    default:
      return "SAVED";
  }
}

interface ToDateLike {
  toDate: () => Date;
}

function isToDateLike(value: unknown): value is ToDateLike {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  return typeof record?.toDate === "function";
}

export function tsToIso(value: unknown): string {
  if (!value) return "";
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  if (isToDateLike(value)) return value.toDate().toISOString();
  return "";
}

const LOOP_PLATFORM_SET: ReadonlySet<string> = new Set(LOOP_PLATFORM_VALUES);

function toLoopPlatform(value: unknown): LoopPlatform | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  return LOOP_PLATFORM_SET.has(normalized) ? (normalized as LoopPlatform) : null;
}

function getApplicationLoopPlatform(app: ApplicationDoc): LoopPlatform {
  return (
    toLoopPlatform(app.loopLinkage?.platform) ??
    toLoopPlatform(app.job?.source) ??
    "other"
  );
}

export function mapApplicationToLoopMatch(id: string, app: ApplicationDoc): LoopMatch {
  const matchedAt = tsToIso(app.loopLinkage?.matchedAt) || tsToIso(app.createdAt) || isoNow();
  const createdAt = tsToIso(app.createdAt) || matchedAt;
  const updatedAt = tsToIso(app.updatedAt) || createdAt;
  const normalized = normalizeStatus(app);

  return {
    id,
    loopId: app.loopLinkage?.loopId ?? "",
    title: app.job.roleTitle,
    company: app.job.companyName,
    location: app.job.locationText ?? "",
    platform: getApplicationLoopPlatform(app),
    url: app.job.vacancyUrl ?? "",
    description: app.vacancy?.rawDescription ?? "",
    status: normalized.subStatus,
    matchedAt,
    createdAt,
    updatedAt,
  };
}

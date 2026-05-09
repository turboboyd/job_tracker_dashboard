import { serverTimestamp, type FieldValue } from "firebase/firestore";

import {
  DEFAULT_CANONICAL_FILTERS,
  PLATFORM_BY_ID,
  type CanonicalFilters,
  type Loop,
  type LoopPlatform,
  type RemoteMode,
} from "../../model";

function unknownToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

export function trimStr(value: unknown): string {
  return unknownToString(value).trim();
}

export function trimArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(trimStr).filter(Boolean);
}

const REMOTE_MODE_VALUES = ["any", "remote_only"] as const;

function isRemoteMode(v: unknown): v is RemoteMode {
  return (
    typeof v === "string" &&
    (REMOTE_MODE_VALUES as readonly string[]).includes(v)
  );
}

function isLoopPlatform(v: unknown): v is LoopPlatform {
  return typeof v === "string" && v in PLATFORM_BY_ID;
}

function normalizeOptionalFilters(v: unknown): CanonicalFilters | undefined {
  if (!v || typeof v !== "object") return undefined;
  return {
    ...DEFAULT_CANONICAL_FILTERS,
    ...(v as CanonicalFilters),
  };
}

export function mapLoopRecordToEntity(
  id: string,
  rest: Record<string, unknown>,
): Loop {
  const normalizedFilters = normalizeOptionalFilters(rest.filters ?? undefined);

  return {
    id,
    name: unknownToString(rest.name),
    titles: Array.isArray(rest.titles)
      ? rest.titles.map(unknownToString).filter(Boolean)
      : [],
    location: unknownToString(rest.location),
    radiusKm: Number(rest.radiusKm ?? 30),
    remoteMode: isRemoteMode(rest.remoteMode) ? rest.remoteMode : "any",
    platforms: Array.isArray(rest.platforms)
      ? rest.platforms.filter(isLoopPlatform)
      : [],
    ...(normalizedFilters !== undefined ? { filters: normalizedFilters } : {}),
    createdAtTs: null,
    updatedAtTs: null,
  };
}

export function makeTimestamps(): { iso: string; server: FieldValue } {
  const iso = new Date().toISOString();
  return { iso, server: serverTimestamp() };
}

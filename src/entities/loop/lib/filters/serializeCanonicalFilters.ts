import { DEFAULT_CANONICAL_FILTERS, type CanonicalFilters } from "../../model";

import {
  EMPLOYMENT_TYPE_VALUES,
  LANGUAGE_VALUES,
  POSTED_WITHIN_VALUES,
  RADIUS_VALUES,
  SENIORITY_VALUES,
  WORK_MODE_VALUES,
  isRecord,
  readBool,
  readOneOf,
  readOneOfNumber,
  readString,
} from "./serializeCanonicalFilters.parsers";

/**
 * Serializes canonical filters to a URL-safe query string.
 * Uses stable, predictable keys.
 */
export function serializeCanonicalFilters(filters: CanonicalFilters): string {
  const p = new URLSearchParams();

  if (filters.role.trim()) p.set("role", filters.role.trim());
  if (filters.location.trim()) p.set("loc", filters.location.trim());

  p.set("r", String(filters.radiusKm));
  p.set("wm", filters.workMode);
  p.set("sen", filters.seniority);
  p.set("emp", filters.employmentType);
  p.set("pw", String(filters.postedWithin));

  if (filters.includeKeywords.trim()) p.set("inc", filters.includeKeywords.trim());
  if (filters.excludeKeywords.trim()) p.set("exc", filters.excludeKeywords.trim());

  p.set("ag", filters.excludeAgencies ? "1" : "0");
  p.set("lang", filters.language);

  return p.toString();
}

/**
 * Parses canonical filters from unknown input (URL params object, etc).
 * Accepts both "short keys" and some legacy names.
 */
export function parseCanonicalFilters(input: unknown): CanonicalFilters {
  const out: CanonicalFilters = { ...DEFAULT_CANONICAL_FILTERS };

  if (!isRecord(input)) return out;

  const role = readString(input, ["role", "position"]);
  const loc = readString(input, ["loc", "location", "city"]);

  const radius = readOneOfNumber(
    input,
    ["r", "radiusKm", "radius"],
    RADIUS_VALUES,
    DEFAULT_CANONICAL_FILTERS.radiusKm,
  );
  const wm = readOneOf(
    input,
    ["wm", "workMode"],
    WORK_MODE_VALUES,
    DEFAULT_CANONICAL_FILTERS.workMode,
  );
  const sen = readOneOf(
    input,
    ["sen", "seniority"],
    SENIORITY_VALUES,
    DEFAULT_CANONICAL_FILTERS.seniority,
  );
  const emp = readOneOf(
    input,
    ["emp", "employmentType"],
    EMPLOYMENT_TYPE_VALUES,
    DEFAULT_CANONICAL_FILTERS.employmentType,
  );
  const pw = readOneOfNumber(
    input,
    ["pw", "postedWithin"],
    POSTED_WITHIN_VALUES,
    DEFAULT_CANONICAL_FILTERS.postedWithin,
  );

  const inc = readString(input, ["inc", "includeKeywords"]);
  const exc = readString(input, ["exc", "excludeKeywords"]);

  const ag = readBool(
    input,
    ["ag", "excludeAgencies"],
    DEFAULT_CANONICAL_FILTERS.excludeAgencies,
  );
  const lang = readOneOf(
    input,
    ["lang", "language"],
    LANGUAGE_VALUES,
    DEFAULT_CANONICAL_FILTERS.language,
  );

  if (role) out.role = role;
  if (loc) out.location = loc;

  out.radiusKm = radius;
  out.workMode = wm;
  out.seniority = sen;
  out.employmentType = emp;
  out.postedWithin = pw;

  out.includeKeywords = inc;
  out.excludeKeywords = exc;

  out.excludeAgencies = ag;
  out.language = lang;

  return out;
}

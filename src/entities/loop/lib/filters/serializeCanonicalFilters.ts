import { DEFAULT_CANONICAL_FILTERS, type CanonicalFilters } from "../../model";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const RADIUS_VALUES = [5, 10, 20, 30, 50, 100] as const;
const POSTED_WITHIN_VALUES = [1, 3, 7, 14, 30] as const;

const WORK_MODE_VALUES = ["any", "onsite", "hybrid", "remote", "remote_only"] as const;
const SENIORITY_VALUES = ["intern", "junior", "mid", "senior", "lead"] as const;
const EMPLOYMENT_TYPE_VALUES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "ausbildung",
] as const;

const LANGUAGE_VALUES = ["any", "de", "en"] as const;

type WorkMode = (typeof WORK_MODE_VALUES)[number];
type Seniority = (typeof SENIORITY_VALUES)[number];
type EmploymentType = (typeof EMPLOYMENT_TYPE_VALUES)[number];
type PostedWithin = (typeof POSTED_WITHIN_VALUES)[number];
type RadiusKm = (typeof RADIUS_VALUES)[number];
type Language = (typeof LANGUAGE_VALUES)[number];

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim().length > 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function oneOf<T extends readonly string[]>(
  v: unknown,
  allowed: T,
): T[number] | null {
  const s = asString(v);
  if (!s) return null;
  return (allowed as readonly string[]).includes(s) ? (s as T[number]) : null;
}

function oneOfNumber<T extends readonly number[]>(
  v: unknown,
  allowed: T,
): T[number] | null {
  const n = asNumber(v);
  if (n === null) return null;
  return (allowed as readonly number[]).includes(n) ? (n as T[number]) : null;
}

function asBool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  const s = asString(v);
  if (!s) return null;
  const norm = s.trim().toLowerCase();
  if (norm === "true" || norm === "1" || norm === "yes") return true;
  if (norm === "false" || norm === "0" || norm === "no") return false;
  return null;
}

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

  // Support both short keys and more explicit keys (legacy / debug friendliness)
  const role = asString(input.role) ?? asString(input.position);
  const loc = asString(input.loc) ?? asString(input.location) ?? asString(input.city);

  const radius =
    oneOfNumber(input.r ?? input.radiusKm ?? input.radius, RADIUS_VALUES) ??
    DEFAULT_CANONICAL_FILTERS.radiusKm;

  const wm =
    (oneOf(input.wm ?? input.workMode, WORK_MODE_VALUES) as WorkMode | null) ??
    DEFAULT_CANONICAL_FILTERS.workMode;

  const sen =
    (oneOf(input.sen ?? input.seniority, SENIORITY_VALUES) as Seniority | null) ??
    DEFAULT_CANONICAL_FILTERS.seniority;

  const emp =
    (oneOf(input.emp ?? input.employmentType, EMPLOYMENT_TYPE_VALUES) as
      | EmploymentType
      | null) ?? DEFAULT_CANONICAL_FILTERS.employmentType;

  const pw =
    (oneOfNumber(input.pw ?? input.postedWithin, POSTED_WITHIN_VALUES) as
      | PostedWithin
      | null) ?? DEFAULT_CANONICAL_FILTERS.postedWithin;

  const inc = asString(input.inc ?? input.includeKeywords) ?? "";
  const exc = asString(input.exc ?? input.excludeKeywords) ?? "";

  const ag = asBool(input.ag ?? input.excludeAgencies);
  const lang =
    (oneOf(input.lang ?? input.language, LANGUAGE_VALUES) as Language | null) ??
    DEFAULT_CANONICAL_FILTERS.language;

  if (role) out.role = role;
  if (loc) out.location = loc;

  out.radiusKm = radius as RadiusKm;
  out.workMode = wm;
  out.seniority = sen;
  out.employmentType = emp;
  out.postedWithin = pw as PostedWithin;

  out.includeKeywords = inc;
  out.excludeKeywords = exc;

  out.excludeAgencies =
    ag === null ? DEFAULT_CANONICAL_FILTERS.excludeAgencies : ag;

  out.language = lang;

  return out;
}

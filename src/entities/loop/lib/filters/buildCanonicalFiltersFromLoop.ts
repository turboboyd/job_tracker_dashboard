import type { CanonicalFilters } from "src/entities/loop/model";
import { DEFAULT_CANONICAL_FILTERS } from "src/entities/loop/model";

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function asBoolean(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pickFrom<T extends readonly (string | number)[]>(
  v: unknown,
  allowed: T,
  fallback: T[number]
): T[number] {
   
  return (allowed as readonly unknown[]).includes(v) ? (v as T[number]) : fallback;
}

/**
 * Делает CanonicalFilters безопасными и полными.
 *
 * Важно:
 * - Firestore/URL/localStorage -> всегда unknown
 * - UI и RTK store -> только CanonicalFilters
 */
export function buildCanonicalFiltersFromLoop(loop: unknown): CanonicalFilters {
  const src: UnknownRecord = (() => {
    if (!isRecord(loop)) return {};

    // поддерживаем оба варианта:
    // 1) loop.filters = { ... }
    // 2) прямо объект фильтров
    const maybeFilters = loop.filters;
    if (isRecord(maybeFilters)) return maybeFilters;
    return loop;
  })();

  // Собираем строго по контракту CanonicalFilters.
  // Любые неизвестные значения -> fallback на DEFAULT_CANONICAL_FILTERS.
  return {
    role: asString(src.role, DEFAULT_CANONICAL_FILTERS.role),
    location: asString(src.location, DEFAULT_CANONICAL_FILTERS.location),
    radiusKm: pickFrom(
      asNumber(src.radiusKm, DEFAULT_CANONICAL_FILTERS.radiusKm),
      [5, 10, 20, 30, 50, 100] as const,
      DEFAULT_CANONICAL_FILTERS.radiusKm
    ),

    workMode: pickFrom(
      src.workMode,
      ["any", "onsite", "hybrid", "remote", "remote_only"] as const,
      DEFAULT_CANONICAL_FILTERS.workMode
    ),

    seniority: pickFrom(
      src.seniority,
      ["intern", "junior", "mid", "senior", "lead"] as const,
      DEFAULT_CANONICAL_FILTERS.seniority
    ),

    employmentType: pickFrom(
      src.employmentType,
      ["full_time", "part_time", "contract", "internship", "ausbildung"] as const,
      DEFAULT_CANONICAL_FILTERS.employmentType
    ),

    postedWithin: pickFrom(
      asNumber(src.postedWithin, DEFAULT_CANONICAL_FILTERS.postedWithin),
      [1, 3, 7, 14, 30] as const,
      DEFAULT_CANONICAL_FILTERS.postedWithin
    ),

    includeKeywords: asString(
      src.includeKeywords,
      DEFAULT_CANONICAL_FILTERS.includeKeywords
    ),
    excludeKeywords: asString(
      src.excludeKeywords,
      DEFAULT_CANONICAL_FILTERS.excludeKeywords
    ),

    excludeAgencies: asBoolean(
      src.excludeAgencies,
      DEFAULT_CANONICAL_FILTERS.excludeAgencies
    ),
    language: pickFrom(
      src.language,
      ["any", "de", "en"] as const,
      DEFAULT_CANONICAL_FILTERS.language
    ),
  };
}

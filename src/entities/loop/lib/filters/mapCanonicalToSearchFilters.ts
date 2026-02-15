import type { CanonicalFilters, SearchFilters } from "src/entities/loop/model";

export function mapCanonicalToSearchFilters(
  filters: CanonicalFilters
): SearchFilters {
  const roleWithIncludes = [filters.role, filters.includeKeywords]
    .filter(Boolean)
    .join(" ")
    .trim();

  const excludes = (filters.excludeKeywords || "")
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => (word.startsWith("-") ? word : `-${word}`))
    .join(" ");

  return {
    role: [roleWithIncludes, excludes].filter(Boolean).join(" ").trim(),
    location: filters.location,
    radiusKm: Number(filters.radiusKm),
    workMode: filters.workMode === "remote_only" ? "remote_only" : "any",
  };
}

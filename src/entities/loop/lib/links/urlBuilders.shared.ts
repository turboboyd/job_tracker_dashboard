import { clampRadiusKm } from "../../model/searchFilters";
import type { SearchFilters } from "../../model/types";

export interface UrlBuilderConfig {
  baseUrl: string;
  queryParam?: string;
  locationParam?: string;
  addRemoteKeyword?: boolean;
}

interface SearchUrlPartsOptions {
  addRemoteKeyword?: boolean;
  defaultLocation?: string;
}

interface SearchUrlParts {
  query: string;
  location: string;
  radiusKm: number;
}

export function enc(v: string) {
  return encodeURIComponent(v.trim());
}

export function buildQuery(filters: SearchFilters): string {
  return filters.role.trim();
}

export function addRemoteKeyword(q: string, filters: SearchFilters) {
  if (filters.workMode !== "remote_only") return q;
  return [q, "remote", "home office", "hybrid"].filter(Boolean).join(" ");
}

export function buildSearchUrlParts(
  filters: SearchFilters,
  options: SearchUrlPartsOptions = {},
): SearchUrlParts {
  const queryBase = buildQuery(filters);
  const location = filters.location.trim();
  const query = options.addRemoteKeyword
    ? addRemoteKeyword(queryBase, filters)
    : queryBase;

  return {
    query,
    location: location.length > 0 ? location : options.defaultLocation ?? "",
    radiusKm: clampRadiusKm(filters.radiusKm),
  };
}

export function buildConfiguredUrl(
  filters: SearchFilters,
  config: UrlBuilderConfig,
): string {
  const queryBase = buildQuery(filters);
  const query = config.addRemoteKeyword
    ? addRemoteKeyword(queryBase, filters)
    : queryBase;
  const location = filters.location.trim();

  const sp = new URLSearchParams();
  if (config.queryParam && query) sp.set(config.queryParam, query);
  if (config.locationParam && location) sp.set(config.locationParam, location);

  return `${config.baseUrl}?${sp.toString()}`;
}

function isSlugChar(char: string): boolean {
  return (
    (char >= "a" && char <= "z") ||
    (char >= "0" && char <= "9")
  );
}

export function slugify(value: string) {
  const normalized = value.toLowerCase().trim();
  let slug = "";
  let shouldAddSeparator = false;

  for (const char of normalized) {
    if (!isSlugChar(char)) {
      shouldAddSeparator = slug.length > 0;
      continue;
    }

    if (shouldAddSeparator) slug += "-";
    slug += char;
    shouldAddSeparator = false;
  }

  return slug;
}

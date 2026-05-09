import type { SearchFilters } from "../../model/types";

import {
  addRemoteKeyword,
  buildQuery,
  enc,
  slugify,
} from "./urlBuilders.shared";

export function buildHoneypotUrl(filters: SearchFilters): string {
  const q = addRemoteKeyword(buildQuery(filters), filters);
  const loc = filters.location.trim();
  const full = [q, loc].filter(Boolean).join(" ");
  return `https://www.honeypot.io/search?query=${enc(full)}`;
}

export function buildRemoteOkUrl(filters: SearchFilters): string {
  const q = buildQuery(filters);
  const role = slugify(q || "jobs");
  return `https://remoteok.com/remote-${role}-jobs`;
}

export function buildGoogleSiteUrl(
  site: string,
  filters: SearchFilters,
): string {
  const q = buildQuery(filters);
  const loc = filters.location.trim();
  const full = [q, loc].filter(Boolean).join(" ");
  const query = `site:${site} ${full}`.trim();
  return `https://www.google.com/search?q=${enc(query)}`;
}

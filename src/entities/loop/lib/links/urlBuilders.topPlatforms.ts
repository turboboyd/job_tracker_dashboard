import type { SearchFilters } from "../../model/types";

import {
  addRemoteKeyword,
  buildQuery,
  buildSearchUrlParts,
  enc,
} from "./urlBuilders.shared";

export function buildLinkedInUrl(filters: SearchFilters): string {
  const { query, location, radiusKm } = buildSearchUrlParts(filters);

  const sp = new URLSearchParams();
  if (query) sp.set("keywords", query);
  if (location) sp.set("location", location);
  sp.set("distance", String(radiusKm || 30));
  sp.set("sortBy", "DD");
  if (filters.workMode === "remote_only") sp.set("f_WT", "2");

  return `https://www.linkedin.com/jobs/search/?${sp.toString()}`;
}

export function buildIndeedUrl(filters: SearchFilters): string {
  const { query, location, radiusKm } = buildSearchUrlParts(filters, {
    addRemoteKeyword: true,
  });

  const sp = new URLSearchParams();
  if (query) sp.set("q", query);
  if (location) sp.set("l", location);
  sp.set("radius", String(radiusKm || 30));
  sp.set("sort", "date");
  if (filters.workMode === "remote_only") sp.set("remotejob", "1");

  return `https://de.indeed.com/jobs?${sp.toString()}`;
}

export function buildStepstoneUrl(filters: SearchFilters): string {
  const { query, location, radiusKm } = buildSearchUrlParts(filters, {
    addRemoteKeyword: true,
    defaultLocation: "deutschland",
  });

  const sp = new URLSearchParams();
  if (query) sp.set("what", query);
  sp.set("radius", String(radiusKm || 30));
  sp.set("sort", "2");
  if (filters.workMode === "remote_only") sp.set("wfh", "1");

  return `https://www.stepstone.de/jobs-in-${enc(location)}?${sp.toString()}`;
}

export function buildXingUrl(filters: SearchFilters): string {
  const q0 = buildQuery(filters);
  const q = addRemoteKeyword(q0, filters);
  const loc = filters.location.trim();

  const sp = new URLSearchParams();
  if (q) sp.set("keywords", q);
  if (loc) sp.set("location", loc);
  if (filters.workMode === "remote_only") sp.set("remote", "true");

  return `https://www.xing.com/jobs/search?${sp.toString()}`;
}

export function buildArbeitsagenturUrl(filters: SearchFilters): string {
  const { query, location, radiusKm } = buildSearchUrlParts(filters, {
    addRemoteKeyword: true,
  });

  const sp = new URLSearchParams();
  if (query) sp.set("was", query);
  if (location) sp.set("wo", location);
  if (radiusKm) sp.set("umkreis", String(radiusKm));

  return `https://www.arbeitsagentur.de/jobsuche/suche?${sp.toString()}`;
}

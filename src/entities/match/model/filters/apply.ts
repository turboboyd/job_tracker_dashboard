import { cmpStr } from "../../lib/compare";
import { norm } from "../../lib/normalize";
import type { Match, MatchesFiltersState, MatchSortKey } from "../types";

function toTime(v: unknown): number {
  const d = typeof v === "string" || v instanceof Date ? new Date(v) : null;
  const t = d ? d.getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

export function applyMatchesFilters(matches: Match[], filters: MatchesFiltersState): Match[] {
  const q = norm(filters.q);

  const loopSet = filters.loopIds.length ? new Set(filters.loopIds) : null;
  const platformSet = filters.platforms.length
    ? new Set(filters.platforms.map((p) => norm(p)))
    : null;
  const statusSet = filters.statuses.length ? new Set(filters.statuses) : null;

  return matches.filter((m) => {
    if (loopSet && !loopSet.has(m.loopId)) return false;

    if (platformSet) {
      const p = norm(m.platform ?? "");
      if (!platformSet.has(p)) return false;
    }

    if (statusSet) {
      const s = (m.status ?? null) as any;
      if (!statusSet.has(s)) return false;
    }

    if (q) {
      const hay = `${m.title ?? ""} ${m.company ?? ""} ${m.location ?? ""} ${m.description ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}

export function applyMatchesSort(list: Match[], sort: MatchSortKey): Match[] {
  const arr = [...list];

  if (sort === "matchedAtDesc") arr.sort((a, b) => toTime(b.matchedAt) - toTime(a.matchedAt));
  if (sort === "matchedAtAsc") arr.sort((a, b) => toTime(a.matchedAt) - toTime(b.matchedAt));
  if (sort === "titleAsc") arr.sort((a, b) => cmpStr(a.title ?? "", b.title ?? ""));
  if (sort === "companyAsc") arr.sort((a, b) => cmpStr(a.company ?? "", b.company ?? ""));

  return arr;
}

export function selectVisibleMatches(matches: Match[], filters: MatchesFiltersState): Match[] {
  const filtered = applyMatchesFilters(matches, filters);
  return applyMatchesSort(filtered, filters.sort);
}

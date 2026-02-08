import type { LoopMatch, LoopMatchStatus } from "src/entities/loopMatch";

export type TypeMatch = LoopMatch;

export type MatchesSort = "matchedAtDesc" | "matchedAtAsc" | "titleAsc" | "companyAsc";

export type MatchesFiltersState = {
  q: string;
  sort: MatchesSort;
  loopIds: string[];
  platforms: string[];
  statuses: LoopMatchStatus[];
};

export const matchesFiltersDefaults: MatchesFiltersState = {
  q: "",
  sort: "matchedAtDesc",
  loopIds: [],
  platforms: [],
  statuses: [],
};

export type MatchesFilterChip =
  | { key: "q"; kind: "q"; q: string; patch: Partial<MatchesFiltersState> }
  | { key: "sort"; kind: "sort"; sort: MatchesSort; patch: Partial<MatchesFiltersState> }
  | {
      key: "loops";
      kind: "loops";
      loopNames: string[];
      patch: Partial<MatchesFiltersState>;
    }
  | {
      key: "platforms";
      kind: "platforms";
      platforms: string[];
      patch: Partial<MatchesFiltersState>;
    }
  | {
      key: "statuses";
      kind: "statuses";
      statuses: LoopMatchStatus[];
      patch: Partial<MatchesFiltersState>;
    };

function includesCI(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

function compareIso(a: string, b: string) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function selectVisibleMatches(matches: TypeMatch[], filters: MatchesFiltersState) {
  const q = filters.q.trim();
  const hasQ = q.length > 0;

  const loopIdsSet = new Set(filters.loopIds);
  const platformsSet = new Set(filters.platforms.map((p) => p.toLowerCase()));
  const statusesSet = new Set(filters.statuses);

  const filtered = matches.filter((m) => {
    if (filters.loopIds.length && !loopIdsSet.has(m.loopId)) return false;

    if (filters.platforms.length) {
      const p = String(m.platform ?? "").toLowerCase();
      if (!platformsSet.has(p)) return false;
    }

    if (filters.statuses.length && !statusesSet.has(m.status)) return false;

    if (hasQ) {
      const parts = [m.title, m.company, m.location, m.url, m.description]
        .map((x) => String(x ?? ""))
        .join(" ");
      if (!includesCI(parts, q)) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "matchedAtAsc":
        return compareIso(a.matchedAt, b.matchedAt);
      case "matchedAtDesc":
        return compareIso(b.matchedAt, a.matchedAt);
      case "titleAsc":
        return String(a.title ?? "").localeCompare(String(b.title ?? ""), undefined, {
          sensitivity: "base",
        });
      case "companyAsc":
        return String(a.company ?? "").localeCompare(String(b.company ?? ""), undefined, {
          sensitivity: "base",
        });
      default:
        return 0;
    }
  });

  return sorted;
}

export function deriveMatchesFilterChips(args: {
  filters: MatchesFiltersState;
  loopOptions: Array<{ id: string; name: string }>;
}) {
  const { filters, loopOptions } = args;

  const chips: MatchesFilterChip[] = [];

  if (filters.q.trim()) {
    chips.push({ key: "q", kind: "q", q: filters.q.trim(), patch: { q: "" } });
  }

  if (filters.sort !== matchesFiltersDefaults.sort) {
    chips.push({
      key: "sort",
      kind: "sort",
      sort: filters.sort,
      patch: { sort: matchesFiltersDefaults.sort },
    });
  }

  if (filters.loopIds.length) {
    const nameById = new Map(loopOptions.map((l) => [l.id, l.name]));
    const loopNames = filters.loopIds.map((id) => nameById.get(id) ?? id);
    chips.push({ key: "loops", kind: "loops", loopNames, patch: { loopIds: [] } });
  }

  if (filters.platforms.length) {
    chips.push({
      key: "platforms",
      kind: "platforms",
      platforms: filters.platforms,
      patch: { platforms: [] },
    });
  }

  if (filters.statuses.length) {
    chips.push({
      key: "statuses",
      kind: "statuses",
      statuses: filters.statuses,
      patch: { statuses: [] },
    });
  }

  return chips;
}

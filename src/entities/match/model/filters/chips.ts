import type { MatchesFiltersState } from "../types";

export type ActiveChip = {
  key: string;
  label: string;
  patch: Partial<MatchesFiltersState>;
};

export function deriveMatchesFilterChips(args: {
  filters: MatchesFiltersState;
  loopOptions: Array<{ id: string; name: string }>;
}): ActiveChip[] {
  const { filters, loopOptions } = args;

  const chips: ActiveChip[] = [];

  if (filters.q.trim()) {
    chips.push({ key: "q", label: `Search: ${filters.q}`, patch: { q: "" } });
  }

  if (filters.loopIds.length) {
    const names = filters.loopIds
      .map((id) => loopOptions.find((l) => l.id === id)?.name ?? id)
      .slice(0, 3)
      .join(", ");
    const tail = filters.loopIds.length > 3 ? ` +${filters.loopIds.length - 3}` : "";
    chips.push({ key: "loopIds", label: `Loops: ${names}${tail}`, patch: { loopIds: [] } });
  }

  if (filters.platforms.length) {
    const names = filters.platforms.slice(0, 3).map((p) => String(p).toUpperCase()).join(", ");
    const tail = filters.platforms.length > 3 ? ` +${filters.platforms.length - 3}` : "";
    chips.push({ key: "platforms", label: `Platforms: ${names}${tail}`, patch: { platforms: [] } });
  }

  if (filters.statuses.length) {
    const names = filters.statuses.slice(0, 3).map(String).join(", ");
    const tail = filters.statuses.length > 3 ? ` +${filters.statuses.length - 3}` : "";
    chips.push({ key: "statuses", label: `Statuses: ${names}${tail}`, patch: { statuses: [] } });
  }

  if (filters.sort !== "matchedAtDesc") {
    chips.push({ key: "sort", label: `Sort: ${filters.sort}`, patch: { sort: "matchedAtDesc" } });
  }

  return chips;
}

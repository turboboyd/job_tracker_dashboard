import type { TFunction } from "i18next";

import { getStatusMeta } from "src/entities/application";
import type { LoopMatchStatus } from "src/entities/loopMatch";

import {
  deriveMatchesFilterChips,
  type MatchesFilterChip,
  matchesFiltersDefaults,
  type MatchesFiltersState,
  type MatchesSort,
} from "../model/filters";

export interface MatchesLoopOption {
  id: string;
  name: string;
}

export interface MatchesSortOption {
  label: string;
  value: MatchesSort;
}

export function labelSort(t: TFunction, value: MatchesSort) {
  switch (value) {
    case "matchedAtDesc":
      return t("matches.filters.sort.options.matchedAtDesc");
    case "matchedAtAsc":
      return t("matches.filters.sort.options.matchedAtAsc");
    case "titleAsc":
      return t("matches.filters.sort.options.titleAsc");
    case "companyAsc":
      return t("matches.filters.sort.options.companyAsc");
    default:
      return String(value);
  }
}

export function buildMatchesSortOptions(t: TFunction): MatchesSortOption[] {
  return [
    { value: "matchedAtDesc", label: t("matches.filters.sort.options.matchedAtDesc") },
    { value: "matchedAtAsc", label: t("matches.filters.sort.options.matchedAtAsc") },
    { value: "titleAsc", label: t("matches.filters.sort.options.titleAsc") },
    { value: "companyAsc", label: t("matches.filters.sort.options.companyAsc") },
  ];
}

export function labelStatus(t: TFunction, value: LoopMatchStatus) {
  const meta = getStatusMeta(value);
  const humanizeKey = (key: string) =>
    key
      .split("_")
      .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
      .join(" ");

  return t(meta.labelKey, { defaultValue: humanizeKey(meta.key) });
}

export function buildChipLabel(t: TFunction, chip: MatchesFilterChip) {
  switch (chip.kind) {
    case "q":
      return t("matches.filters.chips.search", { q: chip.q });
    case "sort":
      return t("matches.filters.chips.sort", { value: labelSort(t, chip.sort) });
    case "loops":
      return t("matches.filters.chips.loops", { value: chip.loopNames.join(", ") });
    case "platforms":
      return t("matches.filters.chips.platforms", { value: chip.platforms.map((p) => p.toUpperCase()).join(", ") });
    case "statuses":
      return t("matches.filters.chips.statuses", { value: chip.statuses.map((status) => labelStatus(t, status)).join(", ") });
    default:
      return "";
  }
}

export function buildActiveFilterChips(args: {
  t: TFunction;
  filters: MatchesFiltersState;
  loopOptions: MatchesLoopOption[];
}) {
  const { t, filters, loopOptions } = args;

  return deriveMatchesFilterChips({ filters, loopOptions }).map((chip) => ({
    key: chip.key,
    patch: chip.patch,
    label: buildChipLabel(t, chip),
  }));
}

export function isDefaultMatchesFilters(filters: MatchesFiltersState) {
  return (
    filters.q === matchesFiltersDefaults.q &&
    filters.sort === matchesFiltersDefaults.sort &&
    filters.loopIds.length === 0 &&
    filters.platforms.length === 0 &&
    filters.statuses.length === 0
  );
}

import type { TFunction } from "i18next";

import type { CanonicalFilters } from "../../model";

import type {
  CompactFiltersSelectKey,
  CompactFiltersTextKey,
} from "./compactFilters.types";

export function parseKeywordLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function buildFilterBadges(t: TFunction, value: CanonicalFilters) {
  const badges: string[] = [];
  const role = value.role.trim();
  const location = value.location.trim();

  if (role) {
    badges.push(t("loops.badgeRole", "Role: {{value}}", { value: role }));
  }

  if (location) {
    badges.push(t("loops.badgeLoc", "Loc: {{value}}", { value: location }));
  }

  badges.push(
    t("loops.badgeRadius", "Radius: {{value}}km", {
      value: value.radiusKm,
    }),
  );

  if (value.workMode !== "any") {
    badges.push(
      t("loops.badgeMode", "Mode: {{value}}", { value: value.workMode }),
    );
  }

  badges.push(
    t("loops.badgePosted", "Posted: {{value}}d", {
      value: value.postedWithin,
    }),
  );

  return badges;
}

export function updateFilter<Key extends keyof CanonicalFilters>(
  value: CanonicalFilters,
  onChange: (next: CanonicalFilters) => void,
  key: Key,
  nextValue: CanonicalFilters[Key],
) {
  onChange({ ...value, [key]: nextValue });
}

export function normalizeTextFilterValue<Key extends CompactFiltersTextKey>(
  key: Key,
  rawValue: string,
): CanonicalFilters[Key] {
  if (key === "includeKeywords" || key === "excludeKeywords") {
    return parseKeywordLine(rawValue) as CanonicalFilters[Key];
  }

  return rawValue as CanonicalFilters[Key];
}

export function parseSelectFilterValue<Key extends CompactFiltersSelectKey>(
  key: Key,
  rawValue: string,
): CanonicalFilters[Key] {
  if (key === "radiusKm" || key === "postedWithin") {
    return Number(rawValue) as CanonicalFilters[Key];
  }

  return rawValue as CanonicalFilters[Key];
}

export function getSelectClassName(surface: "input" | "card") {
  const backgroundClass = surface === "card" ? "bg-card" : "bg-input";

  return `h-10 w-full rounded-xl border border-border ${backgroundClass} px-3 text-sm text-foreground`;
}


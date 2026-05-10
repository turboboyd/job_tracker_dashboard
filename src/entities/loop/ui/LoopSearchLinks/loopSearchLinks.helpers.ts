import type { TFunction } from "i18next";

import type { CanonicalFilters } from "../../model";

import type { LoopForLinks } from "./types";

export function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

export function getSafeFilterNumber(
  filters: CanonicalFilters,
  key: "radiusKm" | "postedWithin",
): number {
  const value = filters[key] as unknown;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function buildLoopForLinks(loop: {
  id: string;
  titles: string[];
  location?: string | null;
  radiusKm?: number | null;
  platforms: LoopForLinks["platforms"];
  remoteMode: LoopForLinks["remoteMode"];
  filters?: LoopForLinks["filters"];
}): LoopForLinks {
  return {
    id: loop.id,
    titles: loop.titles,
    location: loop.location ?? null,
    radiusKm: loop.radiusKm ?? null,
    platforms: loop.platforms,
    remoteMode: loop.remoteMode,
    ...(loop.filters !== undefined ? { filters: loop.filters } : {}),
  };
}

export function buildAppliedBadges(
  filters: CanonicalFilters,
  t: TFunction,
): string[] {
  const out: string[] = [];

  const role = filters.role.trim();
  const location = filters.location.trim();
  const radiusKm = getSafeFilterNumber(filters, "radiusKm");
  const workMode = filters.workMode;
  const postedWithin = getSafeFilterNumber(filters, "postedWithin");

  if (isNonEmptyString(role)) {
    out.push(t("loops.badgeRole", "Role: {{value}}", { value: role }));
  }

  if (isNonEmptyString(location)) {
    out.push(t("loops.badgeLoc", "Loc: {{value}}", { value: location }));
  }

  out.push(t("loops.badgeRadius", "Radius: {{value}}km", { value: radiusKm }));

  if (workMode !== "any") {
    out.push(t("loops.badgeMode", "Mode: {{value}}", { value: workMode }));
  }

  out.push(t("loops.badgePosted", "Posted: {{value}}d", { value: postedWithin }));

  return out;
}

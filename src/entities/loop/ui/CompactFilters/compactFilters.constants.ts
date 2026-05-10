import type { CanonicalFilters } from "../../model";

export const RADIUS_OPTIONS: CanonicalFilters["radiusKm"][] = [
  5,
  10,
  20,
  30,
  50,
  100,
];

export const POSTED_WITHIN_OPTIONS: CanonicalFilters["postedWithin"][] = [
  1,
  3,
  7,
  14,
  30,
];

export const ADVANCED_SELECT_COL_SPAN_CLASS = "md:col-span-3";


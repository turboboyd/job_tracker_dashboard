import { CanonicalFilters } from "./types";

export const DEFAULT_CANONICAL_FILTERS: CanonicalFilters = {
  role: "",
  location: "",
  radiusKm: 30,

  workMode: "any",
  seniority: "junior",
  employmentType: "full_time",
  postedWithin: 7,

  includeKeywords: "",
  excludeKeywords: "",

  excludeAgencies: true,
  language: "any",
};

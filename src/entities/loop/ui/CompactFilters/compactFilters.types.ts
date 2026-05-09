import type { CanonicalFilters } from "../../model";

export interface Option<T> {
  label: string;
  value: T;
}

export interface CompactFiltersLabels {
  advancedInfo: string;
  apply: string;
  employmentType: string;
  excludeAgencies: string;
  excludeKeywords: string;
  excludeKeywordsHint: string;
  excludeKeywordsPlaceholder: string;
  filtersSubtitle: string;
  filtersTitle: string;
  includeKeywords: string;
  includeKeywordsHint: string;
  includeKeywordsPlaceholder: string;
  languageTitle: string;
  less: string;
  location: string;
  locationPlaceholder: string;
  more: string;
  postedWithin: string;
  professionRole: string;
  professionRolePlaceholder: string;
  radius: string;
  reset: string;
  seniorityTitle: string;
  workModeTitle: string;
}

export interface CompactFiltersSelectOptions {
  employmentType: Option<CanonicalFilters["employmentType"]>[];
  language: Option<CanonicalFilters["language"]>[];
  postedWithin: Option<CanonicalFilters["postedWithin"]>[];
  radiusKm: Option<CanonicalFilters["radiusKm"]>[];
  seniority: Option<CanonicalFilters["seniority"]>[];
  workMode: Option<CanonicalFilters["workMode"]>[];
}

export type CompactFiltersSelectKey = keyof CompactFiltersSelectOptions;

export type CompactFiltersTextKey =
  | "excludeKeywords"
  | "includeKeywords"
  | "location"
  | "role";

export interface CompactFiltersTextFieldConfig {
  hint?: string;
  key: CompactFiltersTextKey;
  label: string;
  placeholder: string;
  colSpanClass: string;
}

export interface CompactFiltersSelectFieldConfig {
  key: CompactFiltersSelectKey;
  label: string;
  colSpanClass: string;
  surface?: "card" | "input";
}


import { ADVANCED_SELECT_COL_SPAN_CLASS } from "./compactFilters.constants";
import type {
  CompactFiltersLabels,
  CompactFiltersSelectFieldConfig,
  CompactFiltersTextFieldConfig,
} from "./compactFilters.types";

export function buildCoreTextFieldConfigs(
  labels: CompactFiltersLabels,
): CompactFiltersTextFieldConfig[] {
  return [
    {
      colSpanClass: "md:col-span-5",
      key: "role",
      label: labels.professionRole,
      placeholder: labels.professionRolePlaceholder,
    },
    {
      colSpanClass: "md:col-span-4",
      key: "location",
      label: labels.location,
      placeholder: labels.locationPlaceholder,
    },
  ];
}

export function buildAdvancedTextFieldConfigs(
  labels: CompactFiltersLabels,
): CompactFiltersTextFieldConfig[] {
  return [
    {
      colSpanClass: "md:col-span-6",
      hint: labels.includeKeywordsHint,
      key: "includeKeywords",
      label: labels.includeKeywords,
      placeholder: labels.includeKeywordsPlaceholder,
    },
    {
      colSpanClass: "md:col-span-6",
      hint: labels.excludeKeywordsHint,
      key: "excludeKeywords",
      label: labels.excludeKeywords,
      placeholder: labels.excludeKeywordsPlaceholder,
    },
  ];
}

export function buildCoreSelectFieldConfigs(
  labels: CompactFiltersLabels,
): CompactFiltersSelectFieldConfig[] {
  return [
    {
      colSpanClass: "md:col-span-2",
      key: "radiusKm",
      label: labels.radius,
      surface: "input",
    },
  ];
}

export function buildAdvancedSelectFieldConfigs(
  labels: CompactFiltersLabels,
): CompactFiltersSelectFieldConfig[] {
  return [
    {
      colSpanClass: ADVANCED_SELECT_COL_SPAN_CLASS,
      key: "workMode",
      label: labels.workModeTitle,
    },
    {
      colSpanClass: ADVANCED_SELECT_COL_SPAN_CLASS,
      key: "seniority",
      label: labels.seniorityTitle,
    },
    {
      colSpanClass: ADVANCED_SELECT_COL_SPAN_CLASS,
      key: "employmentType",
      label: labels.employmentType,
    },
    {
      colSpanClass: ADVANCED_SELECT_COL_SPAN_CLASS,
      key: "postedWithin",
      label: labels.postedWithin,
    },
  ];
}


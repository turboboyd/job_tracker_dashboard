import type { TFunction } from "i18next";

import type { CompactFiltersLabels } from "./compactFilters.types";

export function buildCompactFiltersLabels(t: TFunction): CompactFiltersLabels {
  return {
    advancedInfo: t(
      "loops.advancedInfo",
      "Advanced filters are stored in loop.filters. URL builders can be extended later per platform.",
    ),
    apply: t("loops.apply", "Apply"),
    employmentType: t("loops.employmentType", "Employment type"),
    excludeAgencies: t("loops.excludeAgencies", "Exclude agencies / Zeitarbeit"),
    excludeKeywords: t("loops.excludeKeywords", "Exclude keywords"),
    excludeKeywordsHint: t(
      "loops.excludeKeywordsHint",
      "Optional, will be appended as exclusions",
    ),
    excludeKeywordsPlaceholder: t(
      "loops.excludeKeywordsPlaceholder",
      "senior lead manager zeitarbeit",
    ),
    filtersSubtitle: t(
      "loops.filtersSubtitle",
      "Update -> Apply -> links refresh & saved to loop.",
    ),
    filtersTitle: t("loops.filtersTitle", "Filters"),
    includeKeywords: t("loops.includeKeywords", "Include keywords"),
    includeKeywordsHint: t(
      "loops.includeKeywordsHint",
      "Optional, will be appended to search query",
    ),
    includeKeywordsPlaceholder: t(
      "loops.includeKeywordsPlaceholder",
      "react typescript next",
    ),
    languageTitle: t("loops.languageTitle", "Language"),
    less: t("loops.less", "Less"),
    location: t("loops.location", "Location"),
    locationPlaceholder: t("loops.locationPlaceholder", "Berlin"),
    more: t("loops.more", "More"),
    postedWithin: t("loops.postedWithin", "Posted within"),
    professionRole: t("loops.professionRole", "Profession / Role"),
    professionRolePlaceholder: t(
      "loops.professionRolePlaceholder",
      "Fachinformatiker OR React Developer",
    ),
    radius: t("loops.radius", "Radius"),
    reset: t("loops.reset", "Reset"),
    seniorityTitle: t("loops.seniorityTitle", "Seniority"),
    workModeTitle: t("loops.workModeTitle", "Work mode"),
  };
}


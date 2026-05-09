import type { TFunction } from "i18next";

import {
  POSTED_WITHIN_OPTIONS,
  RADIUS_OPTIONS,
} from "./compactFilters.constants";
import type { CompactFiltersSelectOptions } from "./compactFilters.types";

export function buildCompactFiltersSelectOptions(
  t: TFunction,
): CompactFiltersSelectOptions {
  return {
    employmentType: [
      { value: "full_time", label: t("loops.employment.fullTime", "Full-time") },
      { value: "part_time", label: t("loops.employment.partTime", "Part-time") },
      { value: "contract", label: t("loops.employment.contract", "Contract") },
      { value: "internship", label: t("loops.employment.internship", "Internship") },
      { value: "ausbildung", label: t("loops.employment.ausbildung", "Ausbildung") },
    ],
    language: [
      { value: "any", label: t("loops.language.any", "Any") },
      { value: "de", label: t("loops.language.de", "DE") },
      { value: "en", label: t("loops.language.en", "EN") },
    ],
    postedWithin: POSTED_WITHIN_OPTIONS.map((days) => ({
      value: days,
      label: t("loops.days", "{{value}} days", { value: days }),
    })),
    radiusKm: RADIUS_OPTIONS.map((radius) => ({
      value: radius,
      label: t("loops.km", "{{value}} km", { value: radius }),
    })),
    seniority: [
      { value: "intern", label: t("loops.seniority.intern", "Intern") },
      { value: "junior", label: t("loops.seniority.junior", "Junior") },
      { value: "mid", label: t("loops.seniority.mid", "Mid") },
      { value: "senior", label: t("loops.seniority.senior", "Senior") },
      { value: "lead", label: t("loops.seniority.lead", "Lead") },
    ],
    workMode: [
      { value: "any", label: t("loops.workMode.any", "Any") },
      { value: "onsite", label: t("loops.workMode.onsite", "On-site") },
      { value: "hybrid", label: t("loops.workMode.hybrid", "Hybrid") },
      { value: "remote", label: t("loops.workMode.remote", "Remote") },
      { value: "remote_only", label: t("loops.workMode.remoteOnly", "Remote-only") },
    ],
  };
}


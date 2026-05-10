import type { TFunction } from "i18next";

import type {
  AddMatchModalLabels,
  AddMatchTextFieldConfig,
} from "./addMatchModal.types";

export function buildAddMatchLabels(t: TFunction): AddMatchModalLabels {
  return {
    addMatch: t("loops.addMatch", { defaultValue: "Add match" }),
    addMatchDescription: t("loops.addMatchDescription", {
      defaultValue: "Paste the job URL and fill details. This saves a match to your loop.",
    }),
    cancel: t("loops.cancel", { defaultValue: "Cancel" }),
    company: t("loops.company", { defaultValue: "Company" }),
    companyPlaceholder: t("loops.companyPlaceholder", { defaultValue: "Acme GmbH" }),
    description: t("loops.description", { defaultValue: "Description" }),
    descriptionPlaceholder: t("loops.descriptionPlaceholder", {
      defaultValue: "Paste key parts of the job description here...",
    }),
    failedToSaveMatch: t("loops.failedToSaveMatch", {
      defaultValue: "Failed to save match",
    }),
    jobTitle: t("loops.jobTitle", { defaultValue: "Job title" }),
    jobTitlePlaceholder: t("loops.jobTitlePlaceholder", {
      defaultValue: "Frontend Developer",
    }),
    jobUrl: t("loops.jobUrl", { defaultValue: "Job URL" }),
    jobUrlHint: t("loops.jobUrlHint", {
      defaultValue: "You can paste without https:// (it will be normalized on save).",
    }),
    jobUrlPlaceholder: t("loops.jobUrlPlaceholder", {
      defaultValue: "company.com/job",
    }),
    location: t("loops.location", { defaultValue: "Location" }),
    locationPlaceholder: t("loops.locationJobPlaceholder", {
      defaultValue: "Berlin / Remote",
    }),
    platform: t("loops.platform", { defaultValue: "Platform" }),
    saveMatch: t("loops.saveMatch", { defaultValue: "Save match" }),
    saving: t("loops.saving", { defaultValue: "Saving..." }),
    status: t("loops.statusLabel", { defaultValue: "Status" }),
  };
}

export function buildAddMatchTextFieldConfigs(
  labels: AddMatchModalLabels,
): AddMatchTextFieldConfig[] {
  return [
    {
      label: labels.jobTitle,
      name: "title",
      placeholder: labels.jobTitlePlaceholder,
    },
    {
      label: labels.company,
      name: "company",
      placeholder: labels.companyPlaceholder,
    },
    {
      label: labels.location,
      name: "location",
      placeholder: labels.locationPlaceholder,
    },
  ];
}

import type { ProcessStatus } from "src/features/applications/firestoreApplications";

/**
 * View modes for Applications page
 */
export type ViewMode = "pipeline" | "today" | "followups";

/**
 * Pipeline filter status (UI-level).
 * We keep domain ProcessStatus, but add ALL for full list view.
 */
export type PipelineFilterStatus = "ALL" | ProcessStatus;

/**
 * Create form state for creating new application
 */
export type CreateFormState = {
  companyName: string;
  roleTitle: string;
  vacancyUrl: string;
  source: string;
  rawDescription: string;
};

export const EMPTY_CREATE_FORM: CreateFormState = {
  companyName: "",
  roleTitle: "",
  vacancyUrl: "",
  source: "",
  rawDescription: "",
};

/**
 * Pipeline statuses order
 */
export type PipelineStatusTab = { key: string; status: PipelineFilterStatus };

/**
 * Tabs for pipeline view.
 * Keys must match i18n: applicationsPage.pipeline.<key>
 */
export const PIPELINE_STATUSES: PipelineStatusTab[] = [
  { key: "all", status: "ALL" },
  { key: "saved", status: "SAVED" },
  { key: "applied", status: "APPLIED" },
  { key: "interview", status: "INTERVIEW_1" },
  { key: "offer", status: "OFFER" },
  { key: "rejected", status: "REJECTED" },
];

/**
 * i18n key builder for process statuses.
 * Use with t(processStatusKey(status))
 */
export function processStatusKey(status: PipelineFilterStatus): string {
  if (status === "ALL") return "applicationsPage.pipeline.all";
  return `applicationsPage.statuses.${status.toLowerCase()}`;
}
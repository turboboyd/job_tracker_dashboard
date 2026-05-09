import { normalizeStatusKey, type StatusKey } from "src/entities/application";

import {
  PIPELINE_STATUSES,
  processStatusKey,
  type PipelineFilterStatus,
  type ViewMode,
} from "../model/types";

export type ApplicationsPageTranslator = (
  key: string,
  defaultValue: string,
  options?: Record<string, unknown>,
) => string;

interface ApplicationsPageTranslationOptions extends Record<string, unknown> {
  defaultValue: string;
  returnObjects: false;
}

type ApplicationsPageTranslationFunction = (
  key: string,
  options: ApplicationsPageTranslationOptions,
) => unknown;

export interface ApplicationsPageHeaderLabels {
  subtitle: string;
  title: string;
}

export interface ApplicationsViewModeOption {
  label: string;
  value: ViewMode;
}

export interface ApplicationsPipelineStatusOption {
  key: string;
  label: string;
  status: PipelineFilterStatus;
  statusKey: StatusKey | null;
}

const VIEW_MODE_DEFAULT_LABELS: Record<ViewMode, string> = {
  followups: "Follow-ups",
  pipeline: "Pipeline",
  today: "Today",
};

export function createApplicationsPageTranslator(
  translate: ApplicationsPageTranslationFunction,
): ApplicationsPageTranslator {
  return (key, defaultValue, options) =>
    String(translate(key, { defaultValue, returnObjects: false, ...options }));
}

export function buildApplicationsHeaderLabels(
  text: ApplicationsPageTranslator,
): ApplicationsPageHeaderLabels {
  return {
    subtitle: text(
      "applicationsPage.subtitle",
      "Create and track your job applications in one place.",
    ),
    title: text("applicationsPage.title", "My applications"),
  };
}

export function buildApplicationsViewModeOptions(
  text: ApplicationsPageTranslator,
): ApplicationsViewModeOption[] {
  return (Object.entries(VIEW_MODE_DEFAULT_LABELS) as [ViewMode, string][]).map(
    ([value, defaultLabel]) => ({
      label: text(`applicationsPage.views.${value}`, defaultLabel),
      value,
    }),
  );
}

export function buildApplicationsPipelineStatusOptions(
  text: ApplicationsPageTranslator,
): ApplicationsPipelineStatusOption[] {
  return PIPELINE_STATUSES.map((statusTab) => {
    const fallback = text(processStatusKey(statusTab.status), String(statusTab.status));

    return {
      key: statusTab.key,
      label: text(`applicationsPage.pipeline.${statusTab.key}`, fallback),
      status: statusTab.status,
      statusKey: statusTab.status === "ALL" ? null : normalizeStatusKey(statusTab.status),
    };
  });
}

export function getApplicationsCountLabel(
  text: ApplicationsPageTranslator,
  isLoading: boolean,
  count: number,
): string {
  if (isLoading) {
    return text("applicationsPage.pipeline.loading", "Loading...");
  }

  return text("applicationsPage.pipeline.count", "Count: {{count}}", { count });
}

export function getApplicationsViewHint(
  text: ApplicationsPageTranslator,
  view: ViewMode,
): string {
  if (view === "today") {
    return text("applicationsPage.todayHint", "Sorted by priority.score");
  }

  return text("applicationsPage.followupsHint", "Needs follow-up ordered by due date");
}

export function getApplicationsEmptyStateText(
  text: ApplicationsPageTranslator,
  view: ViewMode,
): string {
  if (view === "today") {
    return text("applicationsPage.empty.today", "Nothing for today.");
  }

  if (view === "followups") {
    return text("applicationsPage.empty.followups", "No follow-ups due.");
  }

  return text("applicationsPage.empty.pipeline", "No applications yet.");
}

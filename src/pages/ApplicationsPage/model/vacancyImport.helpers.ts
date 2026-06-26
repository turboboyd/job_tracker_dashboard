import type { VacancyImportPreview } from "src/features/applications/rest/queries";
import { ApiError } from "src/shared/api/rest/restClient";

import type { CreateFormState } from "./types";

/**
 * Classification of an import-preview failure. The UI maps the code to a
 * localized message (`applicationsPage.import.<code>`); the helper itself stays
 * presentation-free so it has no hardcoded user-facing copy.
 */
export type VacancyImportFailureCode = "invalidUrl" | "fallback";

function valueOrCurrent(previewValue: string | null | undefined, currentValue: string): string {
  const normalized = previewValue?.trim();
  return normalized && normalized.length > 0 ? normalized : currentValue;
}

export function canRunVacancyImportPreview(params: {
  loopId: string;
  url: string;
  isImporting?: boolean;
}): boolean {
  return (
    params.loopId.trim().length > 0 &&
    params.url.trim().length > 0 &&
    params.isImporting !== true
  );
}

export function applyVacancyImportPreviewToForm(
  form: CreateFormState,
  preview: VacancyImportPreview,
): CreateFormState {
  return {
    ...form,
    vacancyUrl: preview.sourceUrl,
    source: valueOrCurrent(preview.source, form.source),
    companyName: valueOrCurrent(preview.companyName, form.companyName),
    roleTitle: valueOrCurrent(preview.roleTitle, form.roleTitle),
    locationText: valueOrCurrent(preview.locationText, form.locationText),
    rawDescription: valueOrCurrent(preview.vacancyDescription, form.rawDescription),
  };
}

export function deriveSourceFromVacancyUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

export function applyVacancyImportFallbackToForm(
  form: CreateFormState,
  url: string,
): CreateFormState {
  const trimmedUrl = url.trim();
  const derivedSource = deriveSourceFromVacancyUrl(trimmedUrl);

  return {
    ...form,
    vacancyUrl: trimmedUrl || form.vacancyUrl,
    source: form.source.trim() ? form.source : derivedSource,
  };
}

export function getVacancyImportFailureCode(error: unknown): VacancyImportFailureCode {
  if (error instanceof ApiError && (error.status === 400 || error.status === 422)) {
    return "invalidUrl";
  }

  return "fallback";
}

export type CreateApplicationInitialMode = "manual" | "import";

export function normalizeCreateApplicationInitialMode(
  value: string | null | undefined,
): CreateApplicationInitialMode {
  return value === "import" ? "import" : "manual";
}

export function shouldPreselectCreateApplicationLoop(params: {
  currentLoopId: string;
  initialLoopId: string | null | undefined;
  selectableLoopIds: readonly string[];
}): boolean {
  const initialLoopId = params.initialLoopId?.trim();
  if (!initialLoopId) return false;
  if (params.currentLoopId === initialLoopId) return false;

  return params.selectableLoopIds.includes(initialLoopId);
}

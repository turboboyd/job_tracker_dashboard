import type { AdminVocabularyBulkImportResponse } from "src/entities/admin-vocabulary";
import { getErrorMessage } from "src/shared/lib";

export function getSubmitButtonLabel(
  isLoading: boolean,
  isDryRun: boolean,
): string {
  if (isLoading) return "Submitting…";
  if (isDryRun) return "Run dry-run";
  return "Import words";
}

export function getSuccessToastTitle(isDryRun: boolean): string {
  return isDryRun ? "Dry-run completed" : "Import completed";
}

export function getSuccessToastDescription(
  result: AdminVocabularyBulkImportResponse,
): string {
  return `Created ${result.createdCount}, existing ${result.existingCount}, duplicates in request ${result.duplicateInRequestCount}.`;
}

export function getFailureToastDescription(error: unknown): string {
  return getErrorMessage(error, "Could not complete the bulk import.");
}


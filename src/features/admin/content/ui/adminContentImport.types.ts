import type { AdminVocabularyBulkImportResponse } from "src/entities/admin-vocabulary";

export interface AdminContentImportToastPayload {
  title: string;
  description: string;
  tone: "success" | "error";
}

export interface AdminContentImportSectionProps {
  lastImportResult: AdminVocabularyBulkImportResponse | null;
  isLoading: boolean;
  onImportResult: (result: AdminVocabularyBulkImportResponse) => void;
  onToast: (payload: AdminContentImportToastPayload) => void;
  onSubmitImport: (payload: {
    items: Record<string, unknown>[];
    dryRun: boolean;
  }) => Promise<AdminVocabularyBulkImportResponse>;
}


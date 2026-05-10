export interface AdminVocabularyBulkImportResultItem {
  word: string;
  normalizedWord: string;
  translation: string;
  wordId?: string;
  created?: boolean;
  existing?: boolean;
  reason?: string;
}

export interface AdminVocabularyBulkImportResponse {
  requestedCount: number;
  creatableCount: number;
  createdCount: number;
  existingCount: number;
  duplicateInRequestCount: number;
  items: AdminVocabularyBulkImportResultItem[];
}

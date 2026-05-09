import type {
  AdminVocabularyBulkImportResponse,
  AdminVocabularyBulkImportResultItem,
} from "src/entities/admin-vocabulary";
import { DataTable, StatCard, StatusBadge } from "src/shared/ui/system";

import {
  EMPTY_REASON_TEXT,
  EMPTY_RESULTS_TEXT,
} from "./adminContentImport.constants";

function getImportResultTone(item: AdminVocabularyBulkImportResultItem) {
  if (item.created) return "success";
  if (item.existing) return "info";
  return "warning";
}

function getImportResultLabel(item: AdminVocabularyBulkImportResultItem) {
  if (item.created) return "created";
  if (item.existing) return "existing";
  return "skipped";
}

function ImportResultStats({
  result,
}: {
  result: AdminVocabularyBulkImportResponse;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Requested" value={result.requestedCount} />
      <StatCard title="Creatable" value={result.creatableCount} />
      <StatCard
        title="Created"
        value={result.createdCount}
        tone={result.createdCount > 0 ? "success" : "default"}
      />
      <StatCard title="Existing" value={result.existingCount} />
      <StatCard
        title="Duplicate in request"
        value={result.duplicateInRequestCount}
        tone={result.duplicateInRequestCount > 0 ? "warning" : "default"}
      />
    </div>
  );
}

function ImportResultTable({
  result,
}: {
  result: AdminVocabularyBulkImportResponse;
}) {
  return (
    <DataTable<AdminVocabularyBulkImportResultItem>
      ariaLabel="Bulk import result"
      rows={result.items}
      getRowKey={(item) => `${item.normalizedWord}-${item.wordId ?? item.word}`}
      emptyText={EMPTY_RESULTS_TEXT}
      columns={[
        {
          key: "word",
          title: "Word",
          width: "180px",
          render: (item) => item.word,
        },
        {
          key: "translation",
          title: "Translation",
          width: "180px",
          render: (item) => item.translation,
        },
        {
          key: "status",
          title: "Result",
          width: "130px",
          render: (item) => (
            <StatusBadge tone={getImportResultTone(item)}>
              {getImportResultLabel(item)}
            </StatusBadge>
          ),
        },
        {
          key: "reason",
          title: "Reason",
          width: "240px",
          render: (item) => item.reason ?? EMPTY_REASON_TEXT,
        },
      ]}
    />
  );
}

export function ImportResultPanel({
  result,
}: {
  result: AdminVocabularyBulkImportResponse;
}) {
  return (
    <div className="space-y-5">
      <ImportResultStats result={result} />
      <ImportResultTable result={result} />
    </div>
  );
}


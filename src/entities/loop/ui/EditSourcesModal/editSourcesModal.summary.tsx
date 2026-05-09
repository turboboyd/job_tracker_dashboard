import { Button } from "src/shared/ui/Button";

import type { EditSourcesSummaryProps } from "./editSourcesModal.types";

export function EditSourcesSummary({
  disabled,
  isSaving,
  labels,
  onSelectAll,
  onSelectRecommended,
  totalSelected,
}: EditSourcesSummaryProps) {
  const isInteractionDisabled = disabled || isSaving;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="text-sm text-muted-foreground">
        {labels.selected}:{" "}
        <span className="font-medium text-foreground">{totalSelected}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          shape="lg"
          onClick={onSelectRecommended}
          disabled={isInteractionDisabled}
        >
          {labels.recommended}
        </Button>
        <Button
          variant="outline"
          shape="lg"
          onClick={onSelectAll}
          disabled={isInteractionDisabled}
        >
          {labels.selectAll}
        </Button>
      </div>
    </div>
  );
}


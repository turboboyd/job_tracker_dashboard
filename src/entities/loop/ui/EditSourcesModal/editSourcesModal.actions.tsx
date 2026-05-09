import { Button } from "src/shared/ui/Button";

import type { EditSourcesActionsProps } from "./editSourcesModal.types";

export function EditSourcesActions({
  canSave,
  disabled,
  isSaving,
  labels,
  onCancel,
  onSave,
}: EditSourcesActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        shadow="sm"
        shape="lg"
        onClick={onSave}
        disabled={!canSave}
      >
        {isSaving ? labels.saving : labels.save}
      </Button>
      <Button
        variant="outline"
        shape="lg"
        onClick={onCancel}
        disabled={disabled || isSaving}
      >
        {labels.cancel}
      </Button>
    </div>
  );
}


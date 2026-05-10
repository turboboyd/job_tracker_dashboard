import { EditSourcesActions } from "./editSourcesModal.actions";
import { EditSourcesGroupSection } from "./editSourcesModal.groups";
import { EditSourcesPlatformsSection } from "./editSourcesModal.platforms";
import { EditSourcesSummary } from "./editSourcesModal.summary";
import type { EditSourcesModalContentProps } from "./editSourcesModal.types";

export function EditSourcesModalContent({
  canSave,
  disabled,
  groupRows,
  isSaving,
  labels,
  onCancel,
  onSave,
  onSelectAll,
  onSelectRecommended,
  onToggleGroup,
  onTogglePlatform,
  platformRows,
  totalSelected,
}: EditSourcesModalContentProps) {
  return (
    <div className="space-y-4">
      <EditSourcesSummary
        disabled={disabled}
        isSaving={isSaving}
        labels={labels}
        onSelectAll={onSelectAll}
        onSelectRecommended={onSelectRecommended}
        totalSelected={totalSelected}
      />

      <EditSourcesGroupSection
        disabled={disabled}
        isSaving={isSaving}
        labels={labels}
        onToggleGroup={onToggleGroup}
        rows={groupRows}
      />

      <EditSourcesPlatformsSection
        disabled={disabled}
        isSaving={isSaving}
        labels={labels}
        onTogglePlatform={onTogglePlatform}
        rows={platformRows}
      />

      <EditSourcesActions
        canSave={canSave}
        disabled={disabled}
        isSaving={isSaving}
        labels={labels}
        onCancel={onCancel}
        onSave={onSave}
      />
    </div>
  );
}

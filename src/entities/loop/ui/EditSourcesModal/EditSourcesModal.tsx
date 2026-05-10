import { useTranslation } from "react-i18next";

import { Modal } from "src/shared/ui";

import type { LoopPlatform } from "../../model";

import { buildEditSourcesModalLabels } from "./editSourcesModal.helpers";
import { EditSourcesModalContent } from "./editSourcesModal.sections";
import { useEditSourcesModalController } from "./useEditSourcesModalController";

interface Props {
  disabled?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (next: LoopPlatform[]) => Promise<void> | void;
  open: boolean;
  value: LoopPlatform[];
}

export function EditSourcesModal({
  disabled,
  onOpenChange,
  onSave,
  open,
  value,
}: Props) {
  const { t } = useTranslation();
  const isDisabled = disabled === true;
  const labels = buildEditSourcesModalLabels(t);
  const controller = useEditSourcesModalController({
    disabled: isDisabled,
    onOpenChange,
    onSave,
    open,
    value,
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={labels.editSources}
      description={labels.description}
      size="lg"
    >
      <EditSourcesModalContent
        canSave={controller.canSave}
        disabled={isDisabled}
        groupRows={controller.groupRows}
        isSaving={controller.isSaving}
        labels={labels}
        onCancel={controller.close}
        onSave={controller.handleSave}
        onSelectAll={controller.selectAll}
        onSelectRecommended={controller.selectRecommended}
        onToggleGroup={controller.toggleGroup}
        onTogglePlatform={controller.togglePlatform}
        platformRows={controller.platformRows}
        totalSelected={controller.totalSelected}
      />
    </Modal>
  );
}

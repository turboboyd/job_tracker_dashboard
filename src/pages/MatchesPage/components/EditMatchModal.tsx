import React from "react";

import type { UpdateMatchInput } from "src/entities/loopMatch";
import { Modal } from "src/shared/ui";

import type { EditMatchModalMatchLike } from "./editMatchModal.helpers";
import { EditMatchModalContent } from "./editMatchModal.sections";
import { useEditMatchModalController } from "./useEditMatchModalController";

export interface EditMatchModalProps {
  busy: boolean;
  loopName: string;
  match: EditMatchModalMatchLike | null;
  onClose: () => void;
  onSave: (matchId: string, patch: UpdateMatchInput["patch"]) => Promise<void>;
  open: boolean;
}

export function EditMatchModal({
  open,
  busy,
  match,
  loopName,
  onClose,
  onSave,
}: EditMatchModalProps) {
  const controller = useEditMatchModalController({
    busy,
    loopName,
    match,
    onClose,
    onSave,
    open,
  });

  if (!match) {
    return null;
  }

  return (
    <Modal
      open={open}
      onOpenChange={controller.handleOpenChange}
      title={controller.labels.editTitle}
      {...(controller.modalDescription
        ? { description: controller.modalDescription }
        : {})}
      size="lg"
    >
      <EditMatchModalContent
        disabled={controller.disabled}
        labels={controller.labels}
        onChange={controller.setFieldValue}
        onClose={onClose}
        onSave={controller.handleSave}
        values={controller.formValues}
      />
    </Modal>
  );
}

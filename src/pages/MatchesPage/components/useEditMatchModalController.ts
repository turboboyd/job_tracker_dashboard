import React from "react";
import { useTranslation } from "react-i18next";

import type { UpdateMatchInput } from "src/entities/loopMatch";

import {
  buildEditMatchModalDescription,
  buildEditMatchModalLabels,
  buildEditMatchPatch,
  createEditMatchModalFormValues,
  createEmptyEditMatchModalFormValues,
  type EditMatchModalFormValues,
  type EditMatchModalMatchLike,
} from "./editMatchModal.helpers";

interface UseEditMatchModalControllerArgs {
  busy: boolean;
  loopName: string;
  match: EditMatchModalMatchLike | null;
  onClose: () => void;
  onSave: (matchId: string, patch: UpdateMatchInput["patch"]) => Promise<void>;
  open: boolean;
}

export function useEditMatchModalController({
  busy,
  loopName,
  match,
  onClose,
  onSave,
  open,
}: UseEditMatchModalControllerArgs) {
  const { t } = useTranslation();
  const [localBusy, setLocalBusy] = React.useState(false);
  const [formValues, setFormValues] = React.useState<EditMatchModalFormValues>(
    createEmptyEditMatchModalFormValues,
  );

  React.useEffect(() => {
    if (!open || !match) {
      return;
    }

    setFormValues(createEditMatchModalFormValues(match));
  }, [match, open]);

  const disabled = busy || localBusy;
  const labels = React.useMemo(() => buildEditMatchModalLabels(t), [t]);
  const modalDescription = React.useMemo(
    () => buildEditMatchModalDescription(t, loopName),
    [loopName, t],
  );
  const patch = React.useMemo(
    () => buildEditMatchPatch(formValues),
    [formValues],
  );

  const setFieldValue = React.useCallback(
    (field: keyof EditMatchModalFormValues, value: string) => {
      setFormValues((previous) => ({
        ...previous,
        [field]: value,
      }));
    },
    [],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSave = React.useCallback(async () => {
    if (!match) {
      return;
    }

    try {
      setLocalBusy(true);
      await onSave(match.id, patch);
      onClose();
    } finally {
      setLocalBusy(false);
    }
  }, [match, onClose, onSave, patch]);

  return {
    disabled,
    formValues,
    handleOpenChange,
    handleSave,
    labels,
    modalDescription,
    setFieldValue,
  };
}

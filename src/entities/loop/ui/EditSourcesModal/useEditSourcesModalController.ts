import { useEffect, useMemo, useState } from "react";

import {
  ALL_PLATFORMS,
  RECOMMENDED_PLATFORMS,
  platformsByGroup,
  type GROUPS,
  type LoopPlatform,
} from "../../model";

import {
  buildEditSourcesGroupRows,
  buildEditSourcesPlatformRows,
  dedupePlatforms,
  toggleGroupSelection,
  togglePlatformSelection,
} from "./editSourcesModal.helpers";

interface UseEditSourcesModalControllerParams {
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (next: LoopPlatform[]) => Promise<void> | void;
  open: boolean;
  value: LoopPlatform[];
}

export function useEditSourcesModalController({
  disabled,
  onOpenChange,
  onSave,
  open,
  value,
}: UseEditSourcesModalControllerParams) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<LoopPlatform[]>(() =>
    dedupePlatforms(value),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedPlatforms(dedupePlatforms(value));
    }
  }, [open, value]);

  const selectedSet = useMemo(
    () => new Set<LoopPlatform>(selectedPlatforms),
    [selectedPlatforms],
  );

  const groupRows = useMemo(
    () => buildEditSourcesGroupRows(selectedSet),
    [selectedSet],
  );
  const platformRows = useMemo(
    () => buildEditSourcesPlatformRows(selectedSet),
    [selectedSet],
  );

  const totalSelected = selectedPlatforms.length;
  const canSave = !disabled && !isSaving;

  const togglePlatform = (platform: LoopPlatform) => {
    setSelectedPlatforms((currentPlatforms) =>
      togglePlatformSelection(currentPlatforms, platform),
    );
  };

  const toggleGroup = (groupId: (typeof GROUPS)[number]["id"]) => {
    const groupPlatforms = platformsByGroup(groupId);
    setSelectedPlatforms((currentPlatforms) =>
      toggleGroupSelection(currentPlatforms, groupPlatforms),
    );
  };

  const selectRecommended = () => {
    setSelectedPlatforms(RECOMMENDED_PLATFORMS);
  };

  const selectAll = () => {
    setSelectedPlatforms(ALL_PLATFORMS);
  };

  const close = () => {
    onOpenChange(false);
  };

  async function handleSave() {
    setIsSaving(true);

    try {
      await onSave(dedupePlatforms(selectedPlatforms));
      close();
    } finally {
      setIsSaving(false);
    }
  }

  return {
    canSave,
    close,
    groupRows,
    handleSave,
    isSaving,
    platformRows,
    selectAll,
    selectRecommended,
    toggleGroup,
    togglePlatform,
    totalSelected,
  };
}

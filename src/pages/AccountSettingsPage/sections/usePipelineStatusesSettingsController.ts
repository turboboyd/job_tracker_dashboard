import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type PipelineConfig,
  type PipelineStage,
  type PipelineSubStatus,
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} from "src/entities/userSettings";
import { useAuthSelectors } from "src/features/auth/model";
import { selectRtkqErrorMessage } from "src/shared/api";

import {
  addStageToPipeline,
  addSubStatusToPipeline,
  deleteStageFromPipeline,
  deleteSubStatusFromPipeline,
  isPipelineDirty,
  moveStageInPipeline,
  moveSubStatusInPipeline,
  sortByOrder,
  updateStagePatch,
  updateSubStatusPatch,
} from "./pipelineStatuses.mutations";
import {
  clonePipeline,
  extractSavedPipeline,
  getDefaultPipeline,
} from "./pipelineStatuses.normalize";

export function usePipelineStatusesSettingsController() {
  const { userId } = useAuthSelectors();
  const uid = userId ?? "";

  const userSettingsQuery = useGetUserSettingsQuery({ uid }, { skip: !uid });
  const [updateSettings, updateState] = useUpdateUserSettingsMutation();
  const isFetching = userSettingsQuery.isFetching;
  const isSaving = updateState.isLoading;

  const savedPipeline = useMemo<PipelineConfig>(
    () => extractSavedPipeline(userSettingsQuery.data),
    [userSettingsQuery.data],
  );
  const [draft, setDraft] = useState<PipelineConfig>(() =>
    clonePipeline(savedPipeline),
  );

  useEffect(() => {
    setDraft(clonePipeline(savedPipeline));
  }, [savedPipeline]);

  const stagesSorted = useMemo(() => sortByOrder(draft.stages), [draft.stages]);
  const error = selectRtkqErrorMessage(updateState.error);
  const isDirty = useMemo(
    () => isPipelineDirty(savedPipeline, draft),
    [savedPipeline, draft],
  );
  const canSave = Boolean(uid) && !isFetching && !isSaving && isDirty;

  const setStage = useCallback(
    (stageId: string, patch: Partial<PipelineStage>) => {
      setDraft((prev) => updateStagePatch(prev, stageId, patch));
    },
    [],
  );

  const setSubStatus = useCallback(
    (
      stageId: string,
      subStatusId: string,
      patch: Partial<PipelineSubStatus>,
    ) => {
      setDraft((prev) =>
        updateSubStatusPatch(prev, stageId, subStatusId, patch),
      );
    },
    [],
  );

  const addStage = useCallback(() => {
    setDraft(addStageToPipeline);
  }, []);

  const deleteStage = useCallback((stageId: string) => {
    setDraft((prev) => deleteStageFromPipeline(prev, stageId));
  }, []);

  const moveStage = useCallback((stageId: string, direction: -1 | 1) => {
    setDraft((prev) => moveStageInPipeline(prev, stageId, direction));
  }, []);

  const addSubStatus = useCallback((stageId: string) => {
    setDraft((prev) => addSubStatusToPipeline(prev, stageId));
  }, []);

  const deleteSubStatus = useCallback(
    (stageId: string, subStatusId: string) => {
      setDraft((prev) =>
        deleteSubStatusFromPipeline(prev, stageId, subStatusId),
      );
    },
    [],
  );

  const moveSubStatus = useCallback(
    (stageId: string, subStatusId: string, direction: -1 | 1) => {
      setDraft((prev) =>
        moveSubStatusInPipeline(prev, stageId, subStatusId, direction),
      );
    },
    [],
  );

  const save = useCallback(async () => {
    if (!uid) {
      return;
    }

    await updateSettings({
      uid,
      patch: { pipeline: draft },
    }).unwrap();
  }, [draft, uid, updateSettings]);

  const reset = useCallback(() => {
    setDraft(clonePipeline(savedPipeline));
  }, [savedPipeline]);

  const resetToDefaults = useCallback(() => {
    setDraft(clonePipeline(getDefaultPipeline()));
  }, []);

  return {
    draft,
    stagesSorted,
    error,
    isDirty,
    isFetching,
    isSaving,
    canSave,
    setDraft,
    setStage,
    setSubStatus,
    addStage,
    deleteStage,
    moveStage,
    addSubStatus,
    deleteSubStatus,
    moveSubStatus,
    save,
    reset,
    resetToDefaults,
  };
}

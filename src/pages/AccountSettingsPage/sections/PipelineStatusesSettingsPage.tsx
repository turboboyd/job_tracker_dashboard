import { AccountSettingsLayout } from "../ui/AccountSettingsLayout";

import { PipelineStatusesContent } from "./pipelineStatuses.sections";
import { usePipelineStatusesSettingsController } from "./usePipelineStatusesSettingsController";

export default function PipelineStatusesSettingsPage() {
  const {
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
  } = usePipelineStatusesSettingsController();

  return (
    <AccountSettingsLayout
      title="Account settings"
      subtitle="Pipeline/Statuses"
      content={
        <PipelineStatusesContent
          error={error}
          draft={draft}
          stagesSorted={stagesSorted}
          isDirty={isDirty}
          isFetching={isFetching}
          isSaving={isSaving}
          canSave={canSave}
          onDraftChange={setDraft}
          onAddStage={addStage}
          onReset={reset}
          onResetToDefaults={resetToDefaults}
          onSave={save}
          onSetStage={setStage}
          onSetSubStatus={setSubStatus}
          onMoveStage={moveStage}
          onAddSubStatus={addSubStatus}
          onDeleteStage={deleteStage}
          onMoveSubStatus={moveSubStatus}
          onDeleteSubStatus={deleteSubStatus}
        />
      }
    />
  );
}

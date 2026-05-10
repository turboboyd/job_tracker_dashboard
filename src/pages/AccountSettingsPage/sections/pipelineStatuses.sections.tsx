import { InlineError } from "src/shared/ui/InlineError";

import { PipelineNotesCard } from "./pipelineStatuses.notes";
import { PipelineStageList } from "./pipelineStatuses.stageCard";
import { PipelineToolbar } from "./pipelineStatuses.toolbar";
import type { PipelineStatusesContentProps } from "./pipelineStatuses.types";

export function PipelineStatusesContent({
  error,
  draft,
  stagesSorted,
  isDirty,
  isFetching,
  isSaving,
  canSave,
  onDraftChange,
  onAddStage,
  onReset,
  onResetToDefaults,
  onSave,
  onSetStage,
  onSetSubStatus,
  onMoveStage,
  onAddSubStatus,
  onDeleteStage,
  onMoveSubStatus,
  onDeleteSubStatus,
}: PipelineStatusesContentProps) {
  return (
    <div className="space-y-md">
      {error ? <InlineError message={error} /> : null}

      <PipelineToolbar
        draft={draft}
        stagesSorted={stagesSorted}
        isDirty={isDirty}
        isFetching={isFetching}
        isSaving={isSaving}
        canSave={canSave}
        onDraftChange={onDraftChange}
        onAddStage={onAddStage}
        onReset={onReset}
        onResetToDefaults={onResetToDefaults}
        onSave={onSave}
      />

      <PipelineStageList
        stagesSorted={stagesSorted}
        isSaving={isSaving}
        onSetStage={onSetStage}
        onSetSubStatus={onSetSubStatus}
        onMoveStage={onMoveStage}
        onAddSubStatus={onAddSubStatus}
        onDeleteStage={onDeleteStage}
        onMoveSubStatus={onMoveSubStatus}
        onDeleteSubStatus={onDeleteSubStatus}
      />

      <PipelineNotesCard />
    </div>
  );
}

import type { PipelineStage, PipelineSubStatus } from "src/entities/userSettings";
import { Button } from "src/shared/ui/Button";

import { sortByOrder } from "./pipelineStatuses.mutations";
import type {
  DeleteSubStatusCallback,
  MoveSubStatusCallback,
  SetStageCallback,
  SetSubStatusCallback,
} from "./pipelineStatuses.types";
import {
  PIPELINE_COPY,
  PipelineLabelInput,
  PipelineMoveButtons,
  PipelineVisibilityToggle,
} from "./pipelineStatuses.ui";

interface PipelineSubStatusRowProps {
  stageId: string;
  subStatus: PipelineSubStatus;
  subStatusIndex: number;
  subStatusesCount: number;
  isSaving: boolean;
  onSetStage: SetStageCallback;
  onSetSubStatus: SetSubStatusCallback;
  onMoveSubStatus: MoveSubStatusCallback;
  onDeleteSubStatus: DeleteSubStatusCallback;
}

function PipelineSubStatusRow({
  stageId,
  subStatus,
  subStatusIndex,
  subStatusesCount,
  isSaving,
  onSetStage,
  onSetSubStatus,
  onMoveSubStatus,
  onDeleteSubStatus,
}: PipelineSubStatusRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-sm rounded-xl border border-border bg-background p-sm">
      <PipelineLabelInput
        className="max-w-[320px]"
        disabled={isSaving}
        value={subStatus.label}
        placeholder={PIPELINE_COPY.subStatusLabelPlaceholder}
        onChange={(label) => onSetSubStatus(stageId, subStatus.id, { label })}
      />

      <PipelineVisibilityToggle
        checked={subStatus.visible}
        disabled={isSaving}
        onChange={(visible) =>
          onSetSubStatus(stageId, subStatus.id, { visible })
        }
      />

      <div className="ml-auto flex flex-wrap items-center gap-sm">
        <PipelineMoveButtons
          canMoveUp={subStatusIndex > 0}
          canMoveDown={subStatusIndex < subStatusesCount - 1}
          disabled={isSaving}
          onMoveUp={() => onMoveSubStatus(stageId, subStatus.id, -1)}
          onMoveDown={() => onMoveSubStatus(stageId, subStatus.id, 1)}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onSetStage(stageId, { defaultSubStatusId: subStatus.id })
          }
          disabled={isSaving}
        >
          {PIPELINE_COPY.setDefault}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDeleteSubStatus(stageId, subStatus.id)}
          disabled={subStatusesCount <= 1 || isSaving}
        >
          {PIPELINE_COPY.delete}
        </Button>
      </div>
    </div>
  );
}

interface PipelineSubStatusRowsProps {
  stage: PipelineStage;
  isSaving: boolean;
  onSetStage: SetStageCallback;
  onSetSubStatus: SetSubStatusCallback;
  onMoveSubStatus: MoveSubStatusCallback;
  onDeleteSubStatus: DeleteSubStatusCallback;
}

export function PipelineSubStatusRows({
  stage,
  isSaving,
  onSetStage,
  onSetSubStatus,
  onMoveSubStatus,
  onDeleteSubStatus,
}: PipelineSubStatusRowsProps) {
  const subStatuses = sortByOrder(stage.subStatuses);

  return (
    <div className="space-y-2">
      {subStatuses.map((subStatus, subStatusIndex) => (
        <PipelineSubStatusRow
          key={subStatus.id}
          stageId={stage.id}
          subStatus={subStatus}
          subStatusIndex={subStatusIndex}
          subStatusesCount={subStatuses.length}
          isSaving={isSaving}
          onSetStage={onSetStage}
          onSetSubStatus={onSetSubStatus}
          onMoveSubStatus={onMoveSubStatus}
          onDeleteSubStatus={onDeleteSubStatus}
        />
      ))}
    </div>
  );
}

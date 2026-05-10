import type { PipelineStage } from "src/entities/userSettings";
import { Button } from "src/shared/ui/Button";

import {
  getStageDefaultSubStatusId,
} from "./pipelineStatuses.mutations";
import { buildSubStatusOptions } from "./pipelineStatuses.options";
import type {
  AddSubStatusCallback,
  DeleteStageCallback,
  MoveStageCallback,
  SetStageCallback,
} from "./pipelineStatuses.types";
import {
  PIPELINE_COPY,
  PipelineLabelInput,
  PipelineMoveButtons,
  PipelineNativeSelect,
  PipelineVisibilityToggle,
} from "./pipelineStatuses.ui";

interface PipelineStageHeaderProps {
  stage: PipelineStage;
  stageIndex: number;
  stagesCount: number;
  isSaving: boolean;
  onSetStage: SetStageCallback;
  onMoveStage: MoveStageCallback;
  onAddSubStatus: AddSubStatusCallback;
  onDeleteStage: DeleteStageCallback;
}

export function PipelineStageHeader({
  stage,
  stageIndex,
  stagesCount,
  isSaving,
  onSetStage,
  onMoveStage,
  onAddSubStatus,
  onDeleteStage,
}: PipelineStageHeaderProps) {
  const defaultSubStatusId = getStageDefaultSubStatusId(stage) ?? "";
  const subStatusOptions = buildSubStatusOptions(stage);

  return (
    <div className="flex flex-wrap items-center justify-between gap-md">
      <div className="flex flex-wrap items-center gap-sm">
        <PipelineLabelInput
          className="max-w-[320px]"
          disabled={isSaving}
          value={stage.label}
          placeholder={PIPELINE_COPY.stageLabelPlaceholder}
          onChange={(label) => onSetStage(stage.id, { label })}
        />

        <PipelineVisibilityToggle
          checked={stage.visible}
          disabled={isSaving}
          onChange={(visible) => onSetStage(stage.id, { visible })}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {PIPELINE_COPY.defaultSubStatus}
          <PipelineNativeSelect
            disabled={isSaving || subStatusOptions.length === 0}
            options={subStatusOptions}
            value={defaultSubStatusId}
            onChange={(nextDefaultSubStatusId) =>
              onSetStage(stage.id, {
                defaultSubStatusId: nextDefaultSubStatusId,
              })
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-sm">
        <PipelineMoveButtons
          canMoveUp={stageIndex > 0}
          canMoveDown={stageIndex < stagesCount - 1}
          disabled={isSaving}
          onMoveUp={() => onMoveStage(stage.id, -1)}
          onMoveDown={() => onMoveStage(stage.id, 1)}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddSubStatus(stage.id)}
          disabled={isSaving}
        >
          + {PIPELINE_COPY.addSubStatus}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDeleteStage(stage.id)}
          disabled={stagesCount <= 1 || isSaving}
        >
          {PIPELINE_COPY.deleteStage}
        </Button>
      </div>
    </div>
  );
}

import { Card } from "src/shared/ui/Card";

import { PipelineStageHeader } from "./pipelineStatuses.stageHeader";
import { PipelineSubStatusRows } from "./pipelineStatuses.subStatusRows";
import type {
  PipelineStageCardProps,
  PipelineStageListProps,
} from "./pipelineStatuses.types";

export function PipelineStageCard({
  stage,
  stageIndex,
  stagesCount,
  isSaving,
  onSetStage,
  onSetSubStatus,
  onMoveStage,
  onAddSubStatus,
  onDeleteStage,
  onMoveSubStatus,
  onDeleteSubStatus,
}: PipelineStageCardProps) {
  return (
    <Card padding="md" shadow="sm" className="space-y-3">
      <PipelineStageHeader
        stage={stage}
        stageIndex={stageIndex}
        stagesCount={stagesCount}
        isSaving={isSaving}
        onSetStage={onSetStage}
        onMoveStage={onMoveStage}
        onAddSubStatus={onAddSubStatus}
        onDeleteStage={onDeleteStage}
      />

      <PipelineSubStatusRows
        stage={stage}
        isSaving={isSaving}
        onSetStage={onSetStage}
        onSetSubStatus={onSetSubStatus}
        onMoveSubStatus={onMoveSubStatus}
        onDeleteSubStatus={onDeleteSubStatus}
      />
    </Card>
  );
}

export function PipelineStageList({
  stagesSorted,
  isSaving,
  onSetStage,
  onSetSubStatus,
  onMoveStage,
  onAddSubStatus,
  onDeleteStage,
  onMoveSubStatus,
  onDeleteSubStatus,
}: PipelineStageListProps) {
  return (
    <div className="space-y-md">
      {stagesSorted.map((stage, stageIndex) => (
        <PipelineStageCard
          key={stage.id}
          stage={stage}
          stageIndex={stageIndex}
          stagesCount={stagesSorted.length}
          isSaving={isSaving}
          onSetStage={onSetStage}
          onSetSubStatus={onSetSubStatus}
          onMoveStage={onMoveStage}
          onAddSubStatus={onAddSubStatus}
          onDeleteStage={onDeleteStage}
          onMoveSubStatus={onMoveSubStatus}
          onDeleteSubStatus={onDeleteSubStatus}
        />
      ))}
    </div>
  );
}

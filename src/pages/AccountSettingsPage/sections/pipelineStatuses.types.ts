import type {
  PipelineConfig,
  PipelineStage,
  PipelineSubStatus,
} from "src/entities/userSettings";

export type SetStageCallback = (
  stageId: string,
  patch: Partial<PipelineStage>,
) => void;

export type SetSubStatusCallback = (
  stageId: string,
  subStatusId: string,
  patch: Partial<PipelineSubStatus>,
) => void;

export type MoveStageCallback = (stageId: string, direction: -1 | 1) => void;

export type MoveSubStatusCallback = (
  stageId: string,
  subStatusId: string,
  direction: -1 | 1,
) => void;

export type DeleteStageCallback = (stageId: string) => void;

export type DeleteSubStatusCallback = (
  stageId: string,
  subStatusId: string,
) => void;

export type AddSubStatusCallback = (stageId: string) => void;

export interface PipelineToolbarProps {
  draft: PipelineConfig;
  stagesSorted: PipelineStage[];
  isDirty: boolean;
  isFetching: boolean;
  isSaving: boolean;
  canSave: boolean;
  onDraftChange: (next: PipelineConfig) => void;
  onAddStage: () => void;
  onReset: () => void;
  onResetToDefaults: () => void;
  onSave: () => Promise<void>;
}

export interface PipelineStageCardProps {
  stage: PipelineStage;
  stageIndex: number;
  stagesCount: number;
  isSaving: boolean;
  onSetStage: SetStageCallback;
  onSetSubStatus: SetSubStatusCallback;
  onMoveStage: MoveStageCallback;
  onAddSubStatus: AddSubStatusCallback;
  onDeleteStage: DeleteStageCallback;
  onMoveSubStatus: MoveSubStatusCallback;
  onDeleteSubStatus: DeleteSubStatusCallback;
}

export interface PipelineStageListProps {
  stagesSorted: PipelineStage[];
  isSaving: boolean;
  onSetStage: SetStageCallback;
  onSetSubStatus: SetSubStatusCallback;
  onMoveStage: MoveStageCallback;
  onAddSubStatus: AddSubStatusCallback;
  onDeleteStage: DeleteStageCallback;
  onMoveSubStatus: MoveSubStatusCallback;
  onDeleteSubStatus: DeleteSubStatusCallback;
}

export interface PipelineStatusesContentProps
  extends PipelineToolbarProps,
    PipelineStageListProps {
  error: string | null;
}

import type {
  PipelineConfig,
  PipelineStage,
  PipelineSubStatus,
} from "src/entities/userSettings";

import { createSubStatusDraft } from "./pipelineStatuses.drafts";
import {
  moveItem,
  resequence,
  sortByOrder,
} from "./pipelineStatuses.ordering";

export function updateSubStatusPatch(
  pipeline: PipelineConfig,
  stageId: string,
  subStatusId: string,
  patch: Partial<PipelineSubStatus>,
): PipelineConfig {
  return {
    ...pipeline,
    stages: pipeline.stages.map((stage) => {
      if (stage.id !== stageId) {
        return stage;
      }

      return {
        ...stage,
        subStatuses: stage.subStatuses.map((subStatus) =>
          subStatus.id === subStatusId
            ? { ...subStatus, ...patch }
            : subStatus,
        ),
      };
    }),
  };
}

export function addSubStatusToPipeline(
  pipeline: PipelineConfig,
  stageId: string,
): PipelineConfig {
  return {
    ...pipeline,
    stages: pipeline.stages.map((stage) => {
      if (stage.id !== stageId) {
        return stage;
      }

      const subStatuses = resequence(
        sortByOrder([
          ...stage.subStatuses,
          createSubStatusDraft((stage.subStatuses.length + 1) * 10),
        ]),
      );
      const defaultSubStatusId = stage.defaultSubStatusId ?? subStatuses[0]?.id;

      return {
        ...stage,
        subStatuses,
        ...(defaultSubStatusId ? { defaultSubStatusId } : {}),
      };
    }),
  };
}

export function deleteSubStatusFromPipeline(
  pipeline: PipelineConfig,
  stageId: string,
  subStatusId: string,
): PipelineConfig {
  return {
    ...pipeline,
    stages: pipeline.stages.map((stage) => {
      if (stage.id !== stageId) {
        return stage;
      }

      const subStatuses = resequence(
        sortByOrder(
          stage.subStatuses.filter((subStatus) => subStatus.id !== subStatusId),
        ),
      );
      const defaultSubStatusId =
        stage.defaultSubStatusId === subStatusId
          ? subStatuses[0]?.id
          : stage.defaultSubStatusId;

      return {
        ...stage,
        subStatuses,
        ...(defaultSubStatusId ? { defaultSubStatusId } : {}),
      };
    }),
  };
}

export function moveSubStatusInPipeline(
  pipeline: PipelineConfig,
  stageId: string,
  subStatusId: string,
  direction: -1 | 1,
): PipelineConfig {
  return {
    ...pipeline,
    stages: pipeline.stages.map((stage) => {
      if (stage.id !== stageId) {
        return stage;
      }

      const sorted = sortByOrder(stage.subStatuses);
      const index = sorted.findIndex(
        (subStatus) => subStatus.id === subStatusId,
      );

      if (index === -1) {
        return stage;
      }

      return {
        ...stage,
        subStatuses: resequence(moveItem(sorted, index, direction)),
      };
    }),
  };
}

export function getStageDefaultSubStatusId(stage: PipelineStage) {
  const subStatuses = sortByOrder(stage.subStatuses);

  return stage.defaultSubStatusId &&
    subStatuses.some((subStatus) => subStatus.id === stage.defaultSubStatusId)
    ? stage.defaultSubStatusId
    : subStatuses[0]?.id;
}


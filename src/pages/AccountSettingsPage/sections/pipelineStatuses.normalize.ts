import {
  DEFAULT_USER_SETTINGS,
  type PipelineConfig,
  type PipelineStage,
  type PipelineSubStatus,
} from "src/entities/userSettings";

export function uidLike(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();

  const bytes = new Uint8Array(16);
  c?.getRandomValues?.(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `id_${hex}`;
}

export function getDefaultPipeline(): PipelineConfig {
  const pipeline = DEFAULT_USER_SETTINGS.pipeline;
  if (!pipeline) {
    throw new Error("DEFAULT_USER_SETTINGS.pipeline is required");
  }
  return pipeline;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function readBoolean(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toPipelineSubStatus(
  value: unknown,
  orderFallback: number,
): PipelineSubStatus | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id).trim();
  if (!id) return null;

  const legacyStatus = readString(value.legacyStatus).trim();
  const base: PipelineSubStatus = {
    id,
    label: readString(value.label, id).trim() || id,
    order: readNumber(value.order, orderFallback),
    visible: readBoolean(value.visible, true),
  };

  return legacyStatus ? { ...base, legacyStatus } : base;
}

function toPipelineStage(
  value: unknown,
  orderFallback: number,
): PipelineStage | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id).trim();
  if (!id) return null;

  const subStatusesRaw = Array.isArray(value.subStatuses)
    ? value.subStatuses
    : [];
  const subStatuses = subStatusesRaw
    .map((item, index) => toPipelineSubStatus(item, (index + 1) * 10))
    .filter((item): item is PipelineSubStatus => item !== null);

  const requestedDefaultSubStatusId =
    readString(value.defaultSubStatusId).trim();
  const defaultSubStatusId =
    requestedDefaultSubStatusId &&
    subStatuses.some((item) => item.id === requestedDefaultSubStatusId)
      ? requestedDefaultSubStatusId
      : subStatuses[0]?.id;

  const base: PipelineStage = {
    id,
    label: readString(value.label, id).trim() || id,
    order: readNumber(value.order, orderFallback),
    visible: readBoolean(value.visible, true),
    subStatuses,
  };

  return defaultSubStatusId ? { ...base, defaultSubStatusId } : base;
}

function normalizePipelineFromUnknown(value: unknown): PipelineConfig {
  const fallback = getDefaultPipeline();
  if (!isRecord(value)) {
    return clonePipeline(fallback);
  }

  const stagesRaw = Array.isArray(value.stages)
    ? value.stages
    : fallback.stages;
  const stages = stagesRaw
    .map((item, index) => toPipelineStage(item, (index + 1) * 10))
    .filter((item): item is PipelineStage => item !== null);

  const requestedDefaultStageId = readString(
    value.defaultStageId,
    fallback.defaultStageId,
  ).trim();
  const defaultStageId =
    requestedDefaultStageId &&
    stages.some((item) => item.id === requestedDefaultStageId)
      ? requestedDefaultStageId
      : (stages[0]?.id ?? fallback.defaultStageId);

  return {
    version: readNumber(value.version, fallback.version),
    defaultStageId,
    stages,
  };
}

export function extractSavedPipeline(value: unknown): PipelineConfig {
  if (!isRecord(value)) {
    return clonePipeline(getDefaultPipeline());
  }

  return normalizePipelineFromUnknown(value.pipeline);
}

export function clonePipeline(pipeline: PipelineConfig): PipelineConfig {
  return {
    version: pipeline.version,
    defaultStageId: pipeline.defaultStageId,
    stages: pipeline.stages.map((stage) => ({
      ...stage,
      subStatuses: stage.subStatuses.map((subStatus) => ({ ...subStatus })),
    })),
  };
}

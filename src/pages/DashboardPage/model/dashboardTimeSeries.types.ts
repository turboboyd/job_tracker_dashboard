import type { StatusKey } from "src/entities/application";

export interface MatchTimestampsLike {
  status: StatusKey;
  createdAt: unknown;
  updatedAt: unknown;
  loopId?: string | undefined;
}

export interface Bucket {
  label: string;
  startMs: number;
  endMs: number;
  counts: Record<StatusKey, number>;
}

export interface PipelineLinePoint {
  label: string;
  value: number;
}

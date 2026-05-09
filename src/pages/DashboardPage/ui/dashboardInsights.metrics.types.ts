import type { BoardColumnKey } from "src/entities/application";

export interface TimelineItem {
  column: BoardColumnKey;
  timestamp: number | null;
}

export interface PipelineIndexes {
  active: number;
  hired: number;
  interview: number;
  offer: number;
}

export interface TransitionCounters {
  activeEntered: number;
  activeToInterview: number;
  interviewEntered: number;
  interviewToOffer: number;
  offerEntered: number;
  offerToHired: number;
}

export interface TransitionDurations {
  interview: number[];
  offer: number[];
}

export interface MatchInsightsSummary {
  counters: TransitionCounters;
  durations: TransitionDurations;
  staleColumn: BoardColumnKey | null;
}

export interface InsightsAccumulator {
  counters: TransitionCounters;
  durations: TransitionDurations;
  staleCounts: Record<BoardColumnKey, number>;
}


import { diffDays } from "../model/dashboardTimeSeries";

import type {
  PipelineIndexes,
  TimelineItem,
  TransitionCounters,
  TransitionDurations,
} from "./dashboardInsights.metrics.types";

export function createTransitionCounters(): TransitionCounters {
  return {
    activeEntered: 0,
    activeToInterview: 0,
    interviewEntered: 0,
    interviewToOffer: 0,
    offerEntered: 0,
    offerToHired: 0,
  };
}

export function createTransitionDurations(): TransitionDurations {
  return {
    interview: [],
    offer: [],
  };
}

export function summarizeTransitionCounters(
  indexes: PipelineIndexes,
): TransitionCounters {
  return {
    activeEntered: enteredCount(indexes.active),
    activeToInterview: completedTransitionCount(indexes.active, indexes.interview),
    interviewEntered: enteredCount(indexes.interview),
    interviewToOffer: completedTransitionCount(indexes.interview, indexes.offer),
    offerEntered: enteredCount(indexes.offer),
    offerToHired: completedTransitionCount(indexes.offer, indexes.hired),
  };
}

export function summarizeTransitionDurations(
  timeline: TimelineItem[],
  indexes: PipelineIndexes,
): TransitionDurations {
  return {
    interview: buildTransitionDuration(timeline, indexes.active, indexes.interview),
    offer: buildTransitionDuration(timeline, indexes.interview, indexes.offer),
  };
}

export function mergeTransitionCounters(
  target: TransitionCounters,
  source: TransitionCounters,
): void {
  target.activeEntered += source.activeEntered;
  target.activeToInterview += source.activeToInterview;
  target.interviewEntered += source.interviewEntered;
  target.interviewToOffer += source.interviewToOffer;
  target.offerEntered += source.offerEntered;
  target.offerToHired += source.offerToHired;
}

export function mergeTransitionDurations(
  target: TransitionDurations,
  source: TransitionDurations,
): void {
  target.interview.push(...source.interview);
  target.offer.push(...source.offer);
}

function buildTransitionDuration(
  timeline: TimelineItem[],
  fromIndex: number,
  toIndex: number,
): number[] {
  if (!isForwardTransition(fromIndex, toIndex)) return [];

  const fromMs = timeline[fromIndex]?.timestamp;
  const toMs = timeline[toIndex]?.timestamp;
  if (fromMs == null || toMs == null) return [];

  return [diffDays(fromMs, toMs)];
}

function enteredCount(index: number): number {
  return isFound(index) ? 1 : 0;
}

function completedTransitionCount(fromIndex: number, toIndex: number): number {
  return isForwardTransition(fromIndex, toIndex) ? 1 : 0;
}

function isFound(index: number): boolean {
  return index !== -1;
}

function isForwardTransition(fromIndex: number, toIndex: number): boolean {
  return isFound(fromIndex) && isFound(toIndex) && toIndex > fromIndex;
}


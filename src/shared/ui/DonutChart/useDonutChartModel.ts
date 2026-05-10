import { useMemo, useState } from 'react';

import {
  buildSegmentsArc,
  toNumberOrNull,
  type DonutChartSegment,
  type DonutChartSlice,
} from './donutChart.helpers';

interface UseDonutChartModelParams {
  centerTop: string;
  gapPx: number;
  hitSlop: number;
  padPx?: number | undefined;
  size: number;
  slices: DonutChartSlice[];
  stroke: number;
  zOrderBySlices: boolean;
}

export interface DonutChartGeometry {
  circumference: number;
  cx: number;
  cy: number;
  outer: number;
  radius: number;
}

export interface DonutChartModel {
  active: DonutChartSegment | null;
  activeKey: string | null;
  centerTopMaybeNumber: number | null;
  geometry: DonutChartGeometry;
  hasData: boolean;
  segmentsForRender: DonutChartSegment[];
  setActiveKey: (next: string | null) => void;
  total: number;
}

export function useDonutChartModel({
  centerTop,
  gapPx,
  hitSlop,
  padPx,
  size,
  slices,
  stroke,
  zOrderBySlices,
}: UseDonutChartModelParams): DonutChartModel {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const geometry = useMemo(
    () => buildDonutChartGeometry({ hitSlop, padPx, size, stroke }),
    [hitSlop, padPx, size, stroke],
  );

  const total = useMemo(() => sumPositiveSlices(slices), [slices]);
  const baseZByLabel = useMemo(() => buildBaseZByLabel(slices), [slices]);

  const segments = useMemo(
    () =>
      buildSegmentsArc({
        baseZByLabel,
        circumference: geometry.circumference,
        gapPx,
        slices,
        total,
      }),
    [baseZByLabel, gapPx, geometry.circumference, slices, total],
  );

  const active = useMemo(
    () => findActiveSegment(segments, activeKey),
    [activeKey, segments],
  );

  const segmentsForRender = useMemo(
    () => orderSegmentsForRender({ activeKey, segments, zOrderBySlices }),
    [activeKey, segments, zOrderBySlices],
  );

  return {
    active,
    activeKey,
    centerTopMaybeNumber: toNumberOrNull(centerTop),
    geometry,
    hasData: total > 0,
    segmentsForRender,
    setActiveKey,
    total,
  };
}

function buildDonutChartGeometry({
  hitSlop,
  padPx,
  size,
  stroke,
}: {
  hitSlop: number;
  padPx?: number | undefined;
  size: number;
  stroke: number;
}): DonutChartGeometry {
  const pad = padPx ?? Math.ceil(hitSlop / 2 + 10);

  return {
    circumference: 2 * Math.PI * ((size - stroke) / 2),
    cx: pad + size / 2,
    cy: pad + size / 2,
    outer: size + pad * 2,
    radius: (size - stroke) / 2,
  };
}

function sumPositiveSlices(slices: DonutChartSlice[]): number {
  return slices.reduce((total, slice) => total + (slice.value > 0 ? slice.value : 0), 0);
}

function buildBaseZByLabel(slices: DonutChartSlice[]): Map<string, number> {
  const baseZByLabel = new Map<string, number>();

  slices.forEach((slice, index) => {
    baseZByLabel.set(slice.label, index);
  });

  return baseZByLabel;
}

function findActiveSegment(
  segments: DonutChartSegment[],
  activeKey: string | null,
): DonutChartSegment | null {
  if (!activeKey) return null;

  return segments.find((segment) => segment.label === activeKey) ?? null;
}

function orderSegmentsForRender({
  activeKey,
  segments,
  zOrderBySlices,
}: {
  activeKey: string | null;
  segments: DonutChartSegment[];
  zOrderBySlices: boolean;
}): DonutChartSegment[] {
  const base = zOrderBySlices
    ? [...segments].sort((left, right) => left.baseZ - right.baseZ)
    : [...segments];

  if (!activeKey) return base;

  const activeSegment = base.find((segment) => segment.label === activeKey);
  if (!activeSegment) return base;

  return [
    ...base.filter((segment) => segment.label !== activeKey),
    activeSegment,
  ];
}

export interface DonutChartSlice {
  label: string;
  value: number;
  /**
   * Tailwind / CSS classes applied to the segment.
   * If you pass `color`, this can be an empty string.
   */
  className: string;
  /** Optional direct stroke color (e.g. hex). */
  color?: string;
}

export interface DonutChartSegment extends DonutChartSlice {
  idx: number;
  frac: number;
  rawDash: number;
  visibleDash: number;
  dasharray: string;
  dashoffset: number;
  baseZ: number;
}

export function buildSegmentsArc(args: {
  slices: DonutChartSlice[];
  total: number;
  circumference: number;
  gapPx: number;
  baseZByLabel: Map<string, number>;
}): DonutChartSegment[] {
  const { slices, total, circumference, gapPx, baseZByLabel } = args;
  const nonZero = slices.filter((slice) => slice.value > 0);
  const startFromTop = circumference * 0.25;

  const rawDashes = nonZero.map((slice) => {
    const fraction = total > 0 ? slice.value / total : 0;
    return Math.max(0, fraction * circumference);
  });

  const offsets = rawDashes.reduce<number[]>((acc, dash, index) => {
    if (index === 0) return [0];
    return [...acc, (acc[index - 1] ?? 0) + (rawDashes[index - 1] ?? 0)];
  }, []);

  return nonZero.map((slice, arcIndex) => {
    const frac = total > 0 ? slice.value / total : 0;
    const rawDash = rawDashes[arcIndex] ?? 0;
    const visibleDash = Math.max(0, rawDash - gapPx);
    const dasharray = `${visibleDash} ${Math.max(0, circumference - visibleDash)}`;
    const offsetAcc = offsets[arcIndex] ?? 0;
    const dashoffset = startFromTop - offsetAcc + gapPx / 2;
    const baseZ = baseZByLabel.get(slice.label) ?? 0;

    return {
      ...slice,
      idx: arcIndex,
      frac,
      rawDash,
      visibleDash,
      dasharray,
      dashoffset,
      baseZ,
    };
  });
}

export function toNumberOrNull(value: string) {
  const numberValue = Number(String(value).trim());
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function strokeColorFromClass(strokeClass: string) {
  if (strokeClass.includes('stroke-blue')) return '#3b82f6';
  if (strokeClass.includes('stroke-indigo')) return '#6366f1';
  if (strokeClass.includes('stroke-violet')) return '#8b5cf6';
  if (strokeClass.includes('stroke-purple')) return '#a855f7';
  if (strokeClass.includes('stroke-amber')) return '#f59e0b';
  if (strokeClass.includes('stroke-emerald')) return '#10b981';
  if (strokeClass.includes('stroke-rose')) return '#f43f5e';
  if (strokeClass.includes('stroke-red')) return '#ef4444';
  if (strokeClass.includes('stroke-slate')) return '#64748b';
  return 'currentColor';
}

export function withAlpha(color: string, alpha: number) {
  const safeAlpha = Math.max(0, Math.min(1, alpha));

  const rgbMatch = /^rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)$/i.exec(
    color.replace(/\s+/g, '')
  );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }

  const hex = color.trim();
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (hexMatch) {
    const raw = hexMatch[1];
    if (!raw) return color;
    const full = raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  }

  return color;
}

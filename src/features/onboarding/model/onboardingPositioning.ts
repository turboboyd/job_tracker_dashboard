// Pure geometry for the tour overlay. No DOM — takes plain rects/sizes so it is
// unit-testable. The UI layer feeds in measured rects and applies the result.

export type PopoverSide = "top" | "right" | "bottom" | "left";

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface PopoverPlacement {
  top: number;
  left: number;
  side: PopoverSide;
}

export interface PlacementInput {
  targetRect: Rect;
  popoverWidth: number;
  popoverHeight: number;
  viewport: Viewport;
  /** Gap between target and popover. */
  margin?: number;
  /** Minimum gap from the viewport edges. */
  edgeMargin?: number;
  preferredSide?: PopoverSide;
}

const SIDE_ORDER: readonly PopoverSide[] = ["right", "left", "bottom", "top"];

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/** The spotlight cutout = the target rect grown by `padding` on every side. */
export function computeSpotlightRect(target: Rect, padding: number): Rect {
  return {
    top: target.top - padding,
    left: target.left - padding,
    width: target.width + padding * 2,
    height: target.height + padding * 2,
  };
}

/** Centered placement used as the fallback when no target is available. */
export function centeredPosition(
  popoverWidth: number,
  popoverHeight: number,
  viewport: Viewport,
): { top: number; left: number } {
  return {
    top: Math.max(0, Math.round((viewport.height - popoverHeight) / 2)),
    left: Math.max(0, Math.round((viewport.width - popoverWidth) / 2)),
  };
}

type FilledInput = Required<PlacementInput>;

function rawPlacement(side: PopoverSide, input: FilledInput): { top: number; left: number } {
  const { targetRect: r, popoverWidth: pw, popoverHeight: ph, margin } = input;
  const centerY = r.top + (r.height - ph) / 2;
  const centerX = r.left + (r.width - pw) / 2;
  switch (side) {
    case "right":
      return { left: r.left + r.width + margin, top: centerY };
    case "left":
      return { left: r.left - margin - pw, top: centerY };
    case "bottom":
      return { left: centerX, top: r.top + r.height + margin };
    case "top":
    default:
      return { left: centerX, top: r.top - margin - ph };
  }
}

function fitsOnSide(side: PopoverSide, input: FilledInput): boolean {
  const { viewport, popoverWidth: pw, popoverHeight: ph, edgeMargin } = input;
  const { top, left } = rawPlacement(side, input);
  return (
    top >= edgeMargin &&
    left >= edgeMargin &&
    top + ph <= viewport.height - edgeMargin &&
    left + pw <= viewport.width - edgeMargin
  );
}

/**
 * Picks the first side (preferred first, then right/left/bottom/top) where the
 * popover fits, then clamps the result inside the viewport so it is always fully
 * visible even when no side fits cleanly.
 */
export function computePopoverPlacement(input: PlacementInput): PopoverPlacement {
  const filled: FilledInput = {
    margin: 12,
    edgeMargin: 12,
    preferredSide: "right",
    ...input,
  };

  const order: PopoverSide[] = [
    filled.preferredSide,
    ...SIDE_ORDER.filter((s) => s !== filled.preferredSide),
  ];
  const side = order.find((s) => fitsOnSide(s, filled)) ?? filled.preferredSide;

  const raw = rawPlacement(side, filled);
  const maxLeft = filled.viewport.width - filled.popoverWidth - filled.edgeMargin;
  const maxTop = filled.viewport.height - filled.popoverHeight - filled.edgeMargin;

  return {
    side,
    left: Math.round(clamp(raw.left, filled.edgeMargin, maxLeft)),
    top: Math.round(clamp(raw.top, filled.edgeMargin, maxTop)),
  };
}

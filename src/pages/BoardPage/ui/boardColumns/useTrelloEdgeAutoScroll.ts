import * as React from "react";

type Point = Readonly<{ x: number; y: number }>;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function closestLaneScrollEl(start: Element | null): HTMLElement | null {
  let el: Element | null = start;
  while (el) {
    if (el instanceof HTMLElement && el.dataset.boardLaneScroll === "1") return el;
    el = el.parentElement;
  }
  return null;
}

export type TrelloEdgeAutoScrollOptions = Readonly<{
  boardScrollEl: HTMLElement | null;
  enabled: boolean;
  /** Pixel distance from edge where autoscroll starts. */
  edgeThreshold?: number;
  /** Max px per frame (roughly). */
  maxSpeed?: number;
}>;

export type TrelloEdgeAutoScrollApi = Readonly<{
  /** Feed latest client pointer position from DndContext drag-move events. */
  setClientPoint: (p: Point) => void;
}>;

/**
 * Trello-like edge autoscroll:
 * - horizontal scroll for the board when pointer is near left/right edges
 * - vertical scroll for the lane under the pointer when near top/bottom edges
 *
 * This intentionally runs its own RAF loop to feel "1-to-1" like Trello.
 */
export function useTrelloEdgeAutoScroll({
  boardScrollEl,
  enabled,
  // Slightly wider edge and higher speed feels much closer to Trello on phones.
  edgeThreshold = 112,
  maxSpeed = 34,
}: TrelloEdgeAutoScrollOptions): TrelloEdgeAutoScrollApi {
  const pointRef = React.useRef<Point | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const setClientPoint = React.useCallback((p: Point) => {
    pointRef.current = p;
  }, []);

  const stop = React.useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    const tick = () => {
      const p = pointRef.current;
      if (!p) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // 1) Horizontal board scroll
      const board = boardScrollEl;
      if (board) {
        const r = board.getBoundingClientRect();
        const leftDist = p.x - r.left;
        const rightDist = r.right - p.x;
        let dx = 0;
        if (leftDist < edgeThreshold) {
          // closer to the edge => faster
          const t = clamp01(1 - leftDist / edgeThreshold);
          dx = -Math.ceil(1 + t * maxSpeed);
        } else if (rightDist < edgeThreshold) {
          const t = clamp01(1 - rightDist / edgeThreshold);
          dx = Math.ceil(1 + t * maxSpeed);
        }
        if (dx !== 0) board.scrollLeft += dx;
      }

      // 2) Vertical lane scroll (under pointer)
      const elUnderPointer = document.elementFromPoint(p.x, p.y);
      const lane = closestLaneScrollEl(elUnderPointer);
      if (lane) {
        const r = lane.getBoundingClientRect();
        const topDist = p.y - r.top;
        const bottomDist = r.bottom - p.y;
        let dy = 0;
        if (topDist < edgeThreshold) {
          const t = clamp01(1 - topDist / edgeThreshold);
          dy = -Math.ceil(1 + t * maxSpeed);
        } else if (bottomDist < edgeThreshold) {
          const t = clamp01(1 - bottomDist / edgeThreshold);
          dy = Math.ceil(1 + t * maxSpeed);
        }
        if (dy !== 0) lane.scrollTop += dy;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      stop();
    };
  }, [enabled, boardScrollEl, edgeThreshold, maxSpeed, stop]);

  return { setClientPoint };
}

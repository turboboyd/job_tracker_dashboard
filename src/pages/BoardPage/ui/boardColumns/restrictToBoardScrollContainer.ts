import type { Modifier } from "@dnd-kit/core";

/**
 * Restrict the drag overlay so it can't leave the visible board scroll container.
 *
 * Why this exists:
 * - Using restrictToFirstScrollableAncestor traps the drag inside the lane (vertical scroller),
 *   which breaks cross-column dragging on desktop.
 * - Trello keeps the dragged card within the board viewport while still allowing horizontal moves.
 */
export function restrictToBoardScrollContainer(boardEl: HTMLElement): Modifier {
  return ({ transform, activeNodeRect }) => {
    if (!activeNodeRect) return transform;

    const r = boardEl.getBoundingClientRect();
    const padding = 8; // a tiny bit of overlap feels nicer

    const nextLeft = activeNodeRect.left + transform.x;
    const nextTop = activeNodeRect.top + transform.y;
    const nextRight = nextLeft + activeNodeRect.width;
    const nextBottom = nextTop + activeNodeRect.height;

    let x = transform.x;
    let y = transform.y;

    if (nextLeft < r.left + padding) x += (r.left + padding) - nextLeft;
    if (nextRight > r.right - padding) x -= nextRight - (r.right - padding);
    if (nextTop < r.top + padding) y += (r.top + padding) - nextTop;
    if (nextBottom > r.bottom - padding) y -= nextBottom - (r.bottom - padding);

    return { ...transform, x, y };
  };
}

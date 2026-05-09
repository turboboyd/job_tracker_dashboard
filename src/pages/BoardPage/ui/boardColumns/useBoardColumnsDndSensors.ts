import {
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { isMousePointerEvent } from "./boardColumnsDnd.helpers";

export function useBoardColumnsDndSensors() {
  return useSensors(
    /**
     * Cross-browser (especially iOS Safari) reliability:
     * Use a single PointerSensor for both mouse + touch.
     *
     * Why not TouchSensor?
     * - iOS Safari can be flaky with touch event streams when nested scroll containers exist.
     * - Pointer events + proper touch-action styles are significantly more consistent.
     *
     * UX:
     * - Touch: long-press to start dragging (so users can scroll the lane normally).
     * - Mouse: drag starts immediately (no long-press delay).
     */
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 280,
        tolerance: 10,
      },
      bypassActivationConstraint: ({ event }) => {
        // Make mouse feel instant like Trello.
        return isMousePointerEvent(event);
      },
    }),
  );
}


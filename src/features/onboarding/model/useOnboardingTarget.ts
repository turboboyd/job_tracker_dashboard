import { useEffect, useState } from "react";

import type { Rect } from "./onboardingPositioning";

export interface OnboardingTargetState {
  found: boolean;
  rect: Rect | null;
}

const EMPTY: OnboardingTargetState = { found: false, rect: null };

function readRect(anchorId: string): Rect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(`[data-onboarding-id="${anchorId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // Zero-size ⇒ hidden / off-canvas (e.g. collapsed mobile sidebar) → fallback.
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

/**
 * Resolves a `[data-onboarding-id]` target and keeps its viewport rect live while
 * the tour step is active (handles scroll/resize/layout shifts via rAF). Returns
 * `found: false` when the anchor is absent or hidden, so the caller can fall back
 * to a centered card.
 */
export function useOnboardingTarget(
  anchorId: string | undefined,
  active: boolean,
): OnboardingTargetState {
  const [state, setState] = useState<OnboardingTargetState>(EMPTY);
  const enabled = active && Boolean(anchorId);

  useEffect(() => {
    // When inactive we don't subscribe (and the hook returns EMPTY below), so we
    // never setState synchronously in the effect body.
    if (!enabled || !anchorId) return;

    let frame = 0;
    const tick = () => {
      const rect = readRect(anchorId);
      setState((prev) =>
        prev.found === (rect !== null) && sameRect(prev.rect, rect)
          ? prev
          : { found: rect !== null, rect },
      );
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [enabled, anchorId]);

  return enabled ? state : EMPTY;
}

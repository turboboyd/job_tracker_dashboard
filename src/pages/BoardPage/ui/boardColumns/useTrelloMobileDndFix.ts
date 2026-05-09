import * as React from "react";

export type TrelloMobileDndFixOptions = Readonly<{
  /** Enable while a drag is active. */
  enabled: boolean;
}>;

const DRAGGING_CLASS_NAME = "dnd-dragging";

function isIOSLike(): boolean {
  // iPadOS 13+ reports as Mac, so we also check for touch points.
  const nav = navigator as unknown as {
    platform?: string;
    userAgent?: string;
    maxTouchPoints?: number;
  };

  const ua = (nav.userAgent ?? "").toLowerCase();
  const platform = (nav.platform ?? "").toLowerCase();
  const touch = (nav.maxTouchPoints ?? 0) > 1;

  const isiPhoneiPad = /iphone|ipad|ipod/.test(ua);
  const isIpadOS = platform.includes("mac") && touch;

  return isiPhoneiPad || isIpadOS;
}

/**
 * Trello-grade mobile Safari fixes:
 * - lock page scroll (prevent rubber-band + accidental page scroll during drag)
 * - add non-passive touchmove listener to preventDefault during drag
 * - toggle a body class to let CSS disable touch-action on lanes/board during drag
 */
export function useTrelloMobileDndFix({ enabled }: TrelloMobileDndFixOptions): void {
  const lockedRef = React.useRef(false);
  const savedRef = React.useRef<{ scrollY: number; bodyTop: string } | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    // Apply fixes broadly on touch devices, but especially important on iOS Safari.
    const shouldLock = isIOSLike() || ("ontouchstart" in window);
    if (!shouldLock) return;

    if (lockedRef.current) return;
    lockedRef.current = true;

    document.documentElement.classList.add(DRAGGING_CLASS_NAME);
    document.body.classList.add(DRAGGING_CLASS_NAME);

    // Scroll lock via position: fixed keeps viewport stable on iOS.
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    savedRef.current = { scrollY, bodyTop: document.body.style.top };

    const bodyStyle = document.body.style;
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.left = "0";
    bodyStyle.right = "0";
    bodyStyle.width = "100%";

    // Prevent Safari from treating the drag as a scroll/gesture.
    const onTouchMove = (e: TouchEvent) => {
      // When dragging, we manage scrolling ourselves (edge autoscroll).
      // Preventing default avoids Safari stealing the gesture.
      e.preventDefault();
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [enabled]);

  React.useEffect(() => {
    if (enabled) return;

    if (!lockedRef.current) return;
    lockedRef.current = false;

    document.documentElement.classList.remove(DRAGGING_CLASS_NAME);
    document.body.classList.remove(DRAGGING_CLASS_NAME);

    const saved = savedRef.current;
    savedRef.current = null;

    const bodyStyle = document.body.style;
    const top = bodyStyle.top;

    bodyStyle.position = "";
    bodyStyle.top = saved?.bodyTop ?? "";
    bodyStyle.left = "";
    bodyStyle.right = "";
    bodyStyle.width = "";

    // Restore scroll position.
    const y = saved?.scrollY ?? (top ? Math.abs(parseInt(top, 10)) : 0);
    window.scrollTo(0, y);
  }, [enabled]);
}

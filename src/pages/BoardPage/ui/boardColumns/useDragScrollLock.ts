import * as React from "react";

/**
 * iOS Safari (and mobile browsers in general) will often steal the touch stream
 * for page scrolling / rubber-banding while a drag is in progress.
 *
 * Trello-style fix:
 * - lock body scrolling using position:fixed (so the page doesn't move)
 * - preventDefault on touchmove while dragging (must be passive:false)
 * - restore scroll position after drag ends
 */
export function useDragScrollLock(enabled: boolean): void {
  const scrollYRef = React.useRef(0);

  React.useEffect(() => {
    if (!enabled) return;

    const body = document.body;
    const html = document.documentElement;

    scrollYRef.current = window.scrollY || window.pageYOffset || 0;

    // Lock page scroll.
    body.classList.add("dnd-dragging");
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    // Prevent iOS overscroll bounce.
    html.style.overscrollBehavior = "none";

    const onTouchMove = (e: TouchEvent) => {
      // While dragging, we drive scrolling ourselves (edge-autoscroll).
      // Prevent the browser from converting touch to scroll.
      e.preventDefault();
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("touchmove", onTouchMove);

      body.classList.remove("dnd-dragging");
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";

      html.style.overscrollBehavior = "";

      // Restore scroll position.
      window.scrollTo(0, scrollYRef.current);
    };
  }, [enabled]);
}

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { OnboardingButtons } from "../model/onboardingNav";
import {
  centeredPosition,
  computePopoverPlacement,
  computeSpotlightRect,
  type Rect,
} from "../model/onboardingPositioning";

import { OnboardingPopover } from "./OnboardingPopover";
import { OnboardingSpotlight } from "./OnboardingSpotlight";

interface OnboardingTourOverlayProps {
  /** Spotlight target, or null to render the centered fallback. */
  targetRect: Rect | null;
  isFallback: boolean;
  stepIndex: number;
  total: number;
  buttons: OnboardingButtons;
  onSkip: () => void;
  onEsc: () => void;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
}

interface Size {
  width: number;
  height: number;
}

function readViewport(): Size {
  if (typeof window === "undefined") return { width: 1024, height: 768 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export function OnboardingTourOverlay({
  targetRect,
  isFallback,
  stepIndex,
  total,
  buttons,
  onSkip,
  onEsc,
  onBack,
  onNext,
  onFinish,
}: OnboardingTourOverlayProps) {
  const titleId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverSize, setPopoverSize] = useState<Size | null>(null);
  const [viewport, setViewport] = useState<Size>(readViewport);

  // Measure the popover (border-box) so placement uses its real size. The
  // ResizeObserver fires asynchronously, so we never setState during render.
  useEffect(() => {
    const node = popoverRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const r = node.getBoundingClientRect();
      setPopoverSize((prev) =>
        prev && prev.width === r.width && prev.height === r.height
          ? prev
          : { width: r.width, height: r.height },
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEsc();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onEsc]);

  const position = useMemo(() => {
    const width = popoverSize?.width ?? 320;
    const height = popoverSize?.height ?? 220;
    if (isFallback || !targetRect) {
      return centeredPosition(width, height, viewport);
    }
    const placement = computePopoverPlacement({
      targetRect,
      popoverWidth: width,
      popoverHeight: height,
      viewport,
    });
    return { top: placement.top, left: placement.left };
  }, [popoverSize, isFallback, targetRect, viewport]);

  const spotlight = !isFallback && targetRect ? computeSpotlightRect(targetRect, 6) : null;

  return createPortal(
    // Full-screen catcher: blocks background interaction during the tour. Clicking
    // the dim does nothing (Esc/Skip dismiss). The spotlight provides the dim in
    // anchored mode; the fallback uses a plain dim layer.
    <div className="fixed inset-0 z-[1000]">
      {spotlight ? (
        <OnboardingSpotlight rect={spotlight} />
      ) : (
        <div className="absolute inset-0 bg-foreground/55 backdrop-blur-[1px]" />
      )}
      <div
        ref={popoverRef}
        className="fixed"
        style={{
          top: position.top,
          left: position.left,
          visibility: popoverSize ? "visible" : "hidden",
        }}
      >
        <OnboardingPopover
          stepIndex={stepIndex}
          total={total}
          buttons={buttons}
          onSkip={onSkip}
          onBack={onBack}
          onNext={onNext}
          onFinish={onFinish}
          titleId={titleId}
        />
      </div>
    </div>,
    document.body,
  );
}

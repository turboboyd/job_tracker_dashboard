import { useNavigate } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/shared/config/routes";

import { ONBOARDING_STEPS } from "../model/onboardingSteps";
import { useOnboardingTarget } from "../model/useOnboardingTarget";

import { useOnboardingContext } from "./onboardingContext";
import { OnboardingTourOverlay } from "./OnboardingTourOverlay";

/**
 * Drives the active tour step: resolves its anchor target, decides anchored vs.
 * centered-fallback, and renders the overlay. Finish persists completion and
 * deep-links to Loops; Esc/Skip persist "skipped".
 */
export function OnboardingController() {
  const navigate = useNavigate();
  const { isOpen, stepIndex, total, buttons, skip, next, back, finish } = useOnboardingContext();
  const step = ONBOARDING_STEPS[stepIndex];
  const { found, rect } = useOnboardingTarget(step?.anchorId, isOpen);

  if (!isOpen || !step) return null;

  const isFallback = !step.anchorId || !found || !rect;

  return (
    <OnboardingTourOverlay
      targetRect={isFallback ? null : rect}
      isFallback={isFallback}
      stepIndex={stepIndex}
      total={total}
      buttons={buttons}
      onSkip={skip}
      onEsc={skip}
      onBack={back}
      onNext={next}
      onFinish={() => {
        finish();
        navigate(RoutePath[AppRoutes.LOOPS]);
      }}
    />
  );
}

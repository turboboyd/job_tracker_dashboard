import { useCallback, useMemo, useState } from "react";

import { getStepButtons, nextStep, prevStep, type OnboardingButtons } from "./onboardingNav";
import {
  markOnboardingCompleted,
  markOnboardingSkipped,
  resetOnboarding,
} from "./onboardingState";
import { ONBOARDING_TOTAL_STEPS } from "./onboardingSteps";

export interface UseOnboardingResult {
  isOpen: boolean;
  stepIndex: number;
  total: number;
  buttons: OnboardingButtons;
  /** Open at the first step (does not change persistence). */
  open: () => void;
  /** Skip + persist "skipped" so the tour won't auto-open again. */
  skip: () => void;
  next: () => void;
  back: () => void;
  /** Persist "completed" and close. */
  finish: () => void;
  /** Clear persistence and re-open from the first step (restart entry). */
  restart: () => void;
}

/**
 * Owns the onboarding stepper's transient UI state and writes the persisted
 * completion flag. Auto-open (first dashboard visit) is decided by the provider,
 * which calls `open()` — this hook stays free of route/auth concerns.
 */
export function useOnboarding(): UseOnboardingResult {
  const total = ONBOARDING_TOTAL_STEPS;
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const open = useCallback(() => {
    setStepIndex(0);
    setIsOpen(true);
  }, []);

  const next = useCallback(() => setStepIndex((i) => nextStep(i, total)), [total]);
  const back = useCallback(() => setStepIndex((i) => prevStep(i, total)), [total]);

  const skip = useCallback(() => {
    markOnboardingSkipped();
    setIsOpen(false);
  }, []);

  const finish = useCallback(() => {
    markOnboardingCompleted();
    setIsOpen(false);
  }, []);

  const restart = useCallback(() => {
    resetOnboarding();
    setStepIndex(0);
    setIsOpen(true);
  }, []);

  const buttons = useMemo(() => getStepButtons(stepIndex, total), [stepIndex, total]);

  return { isOpen, stepIndex, total, buttons, open, skip, next, back, finish, restart };
}

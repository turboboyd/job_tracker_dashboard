// Pure step-navigation logic for the onboarding stepper. No React, no storage —
// trivially unit-testable.

export interface OnboardingButtons {
  /** First step shows "Skip"; later steps show "Back". */
  showSkip: boolean;
  showBack: boolean;
  /** Last step's primary button is "Finish" instead of "Next". */
  isLast: boolean;
}

export function clampStep(index: number, total: number): number {
  if (total <= 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  const max = total - 1;
  return index > max ? max : Math.trunc(index);
}

export function nextStep(index: number, total: number): number {
  return clampStep(index + 1, total);
}

export function prevStep(index: number, total: number): number {
  return clampStep(index - 1, total);
}

export function isLastStep(index: number, total: number): boolean {
  return total > 0 && index >= total - 1;
}

export function getStepButtons(index: number, total: number): OnboardingButtons {
  return {
    showSkip: index <= 0,
    showBack: index > 0,
    isLast: isLastStep(index, total),
  };
}

export { OnboardingProvider } from "./ui/OnboardingProvider";
export { OnboardingHint } from "./ui/OnboardingHint";
export { RestartOnboardingButton } from "./ui/RestartOnboardingButton";

export { useOnboarding, type UseOnboardingResult } from "./model/useOnboarding";
export { useOnboardingHint } from "./model/useOnboardingHint";

export {
  ONBOARDING_VERSION,
  isOnboardingPending,
  markOnboardingCompleted,
  markOnboardingSkipped,
  resetOnboarding,
  readOnboardingState,
  type OnboardingState,
  type OnboardingStatus,
} from "./model/onboardingState";

export {
  ONBOARDING_STEPS,
  ONBOARDING_TOTAL_STEPS,
  type OnboardingStepConfig,
} from "./model/onboardingSteps";

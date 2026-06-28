import { useEffect, type ReactNode } from "react";

import { isOnboardingPending, readOnboardingState } from "../model/onboardingState";
import { useOnboarding } from "../model/useOnboarding";

import { OnboardingContext } from "./onboardingContext";
import { OnboardingController } from "./OnboardingController";

/**
 * Holds the single onboarding instance + tour overlay and exposes it via context
 * (so RestartOnboardingButton can re-open it). Mount where the first-run tour
 * should trigger — currently the Dashboard, so it fires on the first dashboard
 * visit after login (the route is auth-guarded). Auto-open runs once per mount;
 * skip/finish persist, so it never re-opens on its own.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboarding();
  const { open } = onboarding;

  useEffect(() => {
    if (isOnboardingPending(readOnboardingState())) open();
  }, [open]);

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
      <OnboardingController />
    </OnboardingContext.Provider>
  );
}

import { createContext, useContext } from "react";

import type { UseOnboardingResult } from "../model/useOnboarding";

export const OnboardingContext = createContext<UseOnboardingResult | null>(null);

export function useOnboardingContext(): UseOnboardingResult {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboardingContext must be used within an OnboardingProvider");
  }
  return ctx;
}

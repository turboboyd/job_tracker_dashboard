// Pure step config (no icons / no React here, so it stays test-friendly). Icons
// are resolved in the UI layer (ui/OnboardingStepIcon). Titles/bodies are i18n
// key references only — never inline copy. `anchorId` points at a real UI element
// via its `data-onboarding-id`; runtime falls back to a centered card when the
// target is missing or off-screen (e.g. `finish`, or a collapsed mobile sidebar).

export interface OnboardingStepConfig {
  id: string;
  titleKey: string;
  bodyKey: string;
  /** `data-onboarding-id` of the element to spotlight; absent ⇒ centered card. */
  anchorId?: string;
  /** Marks an area that is not built yet (e.g. calendar) — renders a badge. */
  comingSoon?: boolean;
}

function step(
  id: string,
  opts: { anchorId?: string; comingSoon?: boolean } = {},
): OnboardingStepConfig {
  return {
    id,
    titleKey: `onboarding.steps.${id}.title`,
    bodyKey: `onboarding.steps.${id}.body`,
    ...(opts.anchorId ? { anchorId: opts.anchorId } : {}),
    ...(opts.comingSoon ? { comingSoon: true } : {}),
  };
}

export const ONBOARDING_STEPS: readonly OnboardingStepConfig[] = [
  step("welcome", { anchorId: "nav" }),
  step("loops", { anchorId: "nav-loops" }),
  step("matches", { anchorId: "nav-matches" }),
  step("applications", { anchorId: "nav-applications" }),
  step("board", { anchorId: "nav-board" }),
  step("calendar", { anchorId: "nav-calendar", comingSoon: true }),
  step("finish"),
];

export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEPS.length;

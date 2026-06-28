import assert from "node:assert/strict";

import { ONBOARDING_STEPS, ONBOARDING_TOTAL_STEPS } from "../onboardingSteps";

// The 7 steps from the onboarding script, in order.
assert.equal(ONBOARDING_TOTAL_STEPS, 7);
assert.deepEqual(
  ONBOARDING_STEPS.map((s) => s.id),
  ["welcome", "loops", "matches", "applications", "board", "calendar", "finish"],
);

// Ids are unique.
assert.equal(new Set(ONBOARDING_STEPS.map((s) => s.id)).size, ONBOARDING_STEPS.length);

// Each step references its own stable i18n keys (no inline copy in config).
for (const step of ONBOARDING_STEPS) {
  assert.equal(step.titleKey, `onboarding.steps.${step.id}.title`);
  assert.equal(step.bodyKey, `onboarding.steps.${step.id}.body`);
}

// Only the calendar step is flagged "coming soon".
assert.deepEqual(
  ONBOARDING_STEPS.filter((s) => s.comingSoon).map((s) => s.id),
  ["calendar"],
);

// Each step's anchor maps to a sidebar data-onboarding-id; finish has none
// (renders the centered fallback card).
assert.deepEqual(
  ONBOARDING_STEPS.map((s) => s.anchorId),
  ["nav", "nav-loops", "nav-matches", "nav-applications", "nav-board", "nav-calendar", undefined],
);
assert.equal(ONBOARDING_STEPS.find((s) => s.id === "finish")?.anchorId, undefined);

console.log("onboardingSteps.test passed");

import assert from "node:assert/strict";

import { clampStep, getStepButtons, isLastStep, nextStep, prevStep } from "../onboardingNav";

const TOTAL = 7;

// clampStep keeps the index within [0, total-1] and truncates fractions.
assert.equal(clampStep(-3, TOTAL), 0);
assert.equal(clampStep(0, TOTAL), 0);
assert.equal(clampStep(6, TOTAL), 6);
assert.equal(clampStep(99, TOTAL), 6);
assert.equal(clampStep(2.9, TOTAL), 2);
assert.equal(clampStep(0, 0), 0);

// next/prev clamp at the boundaries (no wrap-around).
assert.equal(nextStep(0, TOTAL), 1);
assert.equal(nextStep(6, TOTAL), 6);
assert.equal(prevStep(0, TOTAL), 0);
assert.equal(prevStep(3, TOTAL), 2);

assert.equal(isLastStep(6, TOTAL), true);
assert.equal(isLastStep(5, TOTAL), false);

// Button config: first = Skip+Next, middle = Back+Next, last = Back+Finish.
assert.deepEqual(getStepButtons(0, TOTAL), { showSkip: true, showBack: false, isLast: false });
assert.deepEqual(getStepButtons(3, TOTAL), { showSkip: false, showBack: true, isLast: false });
assert.deepEqual(getStepButtons(6, TOTAL), { showSkip: false, showBack: true, isLast: true });

console.log("onboardingNav.test passed");

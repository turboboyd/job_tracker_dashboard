import assert from "node:assert/strict";

import {
  centeredPosition,
  computePopoverPlacement,
  computeSpotlightRect,
} from "../onboardingPositioning";

const VIEWPORT = { width: 1280, height: 800 };
const POPOVER = { popoverWidth: 320, popoverHeight: 200 };

// Spotlight = target grown by padding on all sides.
assert.deepEqual(computeSpotlightRect({ top: 100, left: 10, width: 200, height: 40 }, 6), {
  top: 94,
  left: 4,
  width: 212,
  height: 52,
});

// Centered fallback.
assert.deepEqual(centeredPosition(320, 200, VIEWPORT), { top: 300, left: 480 });

// A left-edge target (e.g. sidebar item) places the popover on the right,
// vertically centered to the target.
assert.deepEqual(
  computePopoverPlacement({
    targetRect: { top: 100, left: 10, width: 200, height: 40 },
    ...POPOVER,
    viewport: VIEWPORT,
  }),
  { side: "right", left: 222, top: 20 },
);

// A right-edge target flips the popover to the left side.
assert.deepEqual(
  computePopoverPlacement({
    targetRect: { top: 100, left: 1100, width: 120, height: 40 },
    ...POPOVER,
    viewport: VIEWPORT,
  }),
  { side: "left", left: 768, top: 20 },
);

// When no side fits cleanly (target near the top edge), it still clamps fully
// into the viewport (top never goes above the edge margin).
{
  const placement = computePopoverPlacement({
    targetRect: { top: 5, left: 10, width: 200, height: 40 },
    ...POPOVER,
    viewport: VIEWPORT,
  });
  assert.equal(placement.top, 12);
  assert.equal(placement.left, 222);
  assert.ok(placement.top >= 12);
  assert.ok(placement.left + 320 <= VIEWPORT.width - 12);
}

console.log("onboardingPositioning.test passed");

import assert from "node:assert/strict";

import {
  ONBOARDING_VERSION,
  dismissHint,
  isHintDismissed,
  isOnboardingPending,
  markOnboardingCompleted,
  markOnboardingSkipped,
  readOnboardingState,
  resetHints,
  resetOnboarding,
  writeOnboardingState,
  type StorageLike,
} from "../onboardingState";

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

// Default (empty storage) is "pending" and onboarding should show.
{
  const s = createMemoryStorage();
  const state = readOnboardingState(s);
  assert.equal(state.status, "pending");
  assert.equal(isOnboardingPending(state), true);
}

// Completed roundtrip persists status + current version and stops showing.
{
  const s = createMemoryStorage();
  markOnboardingCompleted(s);
  const state = readOnboardingState(s);
  assert.equal(state.status, "completed");
  assert.equal(state.version, ONBOARDING_VERSION);
  assert.equal(isOnboardingPending(state), false);
}

// Skipped also stops it from auto-opening.
{
  const s = createMemoryStorage();
  markOnboardingSkipped(s);
  assert.equal(isOnboardingPending(readOnboardingState(s)), false);
}

// A stored version older than the current one re-onboards (even if completed).
{
  const s = createMemoryStorage();
  writeOnboardingState(
    { status: "completed", version: ONBOARDING_VERSION - 1, updatedAt: "2020-01-01T00:00:00.000Z" },
    s,
  );
  assert.equal(isOnboardingPending(readOnboardingState(s)), true);
}

// Restart clears the flag back to pending.
{
  const s = createMemoryStorage();
  markOnboardingCompleted(s);
  resetOnboarding(s);
  assert.equal(readOnboardingState(s).status, "pending");
}

// Corrupt JSON degrades to the safe default, never throws.
{
  const s = createMemoryStorage();
  s.setItem("loopboard.onboarding.v1", "{not json");
  assert.equal(readOnboardingState(s).status, "pending");
}

// Missing storage (SSR/private mode) is handled gracefully.
assert.equal(readOnboardingState(null).status, "pending");
assert.doesNotThrow(() => markOnboardingCompleted(null));
assert.equal(isHintDismissed("x", null), false);

// Contextual-hint dismissal is per-id and resettable.
{
  const s = createMemoryStorage();
  assert.equal(isHintDismissed("welcome-hint", s), false);
  dismissHint("welcome-hint", s);
  assert.equal(isHintDismissed("welcome-hint", s), true);
  assert.equal(isHintDismissed("other-hint", s), false);
  resetHints(s);
  assert.equal(isHintDismissed("welcome-hint", s), false);
}

console.log("onboardingState.test passed");

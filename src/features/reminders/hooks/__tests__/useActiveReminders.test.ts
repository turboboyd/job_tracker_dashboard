import assert from "node:assert/strict";

import type { ActiveReminder } from "../../model/activeReminder.types";
import {
  selectActiveRemindersState,
  startActiveRemindersSubscription,
  type ActiveRemindersLifecycleKey,
  type ActiveRemindersSubscriber,
  type ActiveRemindersSubscriptionState,
} from "../useActiveReminders";

function test(_name: string, run: () => void) {
  run();
}

function reminder(id: string): ActiveReminder {
  return {
    id,
    appId: `app-${id}`,
    companyName: "Example",
    roleTitle: "Engineer",
    dueAt: new Date("2026-06-19T09:00:00Z"),
    text: `Reminder ${id}`,
  };
}

function createSubscriberHarness() {
  const listeners = new Map<
    string,
    {
      onError: (error: Error) => void;
      onUpdate: (reminders: ActiveReminder[]) => void;
    }
  >();
  const unsubscribed: string[] = [];
  const subscribe: ActiveRemindersSubscriber = (
    userId,
    onUpdate,
    onError,
  ) => {
    listeners.set(userId, { onError, onUpdate });
    return () => {
      unsubscribed.push(userId);
    };
  };

  return { listeners, subscribe, unsubscribed };
}

test("absent user exposes empty reminders and is not ready", () => {
  const previousLifecycle: ActiveRemindersLifecycleKey = { userId: "user-a" };
  const previousState: ActiveRemindersSubscriptionState = {
    lifecycle: previousLifecycle,
    isReady: true,
    reminders: [reminder("a")],
  };

  const selected = selectActiveRemindersState(
    { userId: null },
    previousState,
  );

  assert.equal(selected.isReady, false);
  assert.deepEqual(selected.reminders, []);
});

test("initial snapshot populates reminders and marks the lifecycle ready", () => {
  const lifecycle = { userId: "user-a" };
  const harness = createSubscriberHarness();
  let state: ActiveRemindersSubscriptionState | null = null;
  const cleanup = startActiveRemindersSubscription(
    lifecycle,
    (next) => {
      state = next;
    },
    harness.subscribe,
  );

  assert.equal(selectActiveRemindersState(lifecycle, state).isReady, false);
  harness.listeners.get("user-a")?.onUpdate([reminder("a")]);

  const selected = selectActiveRemindersState(lifecycle, state);
  assert.equal(selected.isReady, true);
  assert.deepEqual(
    selected.reminders.map((item) => item.id),
    ["a"],
  );
  cleanup();
});

test("direct user switch hides the previous user's reminders before a snapshot", () => {
  const lifecycleA = { userId: "user-a" };
  const lifecycleB = { userId: "user-b" };
  const previousState: ActiveRemindersSubscriptionState = {
    lifecycle: lifecycleA,
    isReady: true,
    reminders: [reminder("a")],
  };

  const selected = selectActiveRemindersState(lifecycleB, previousState);

  assert.equal(selected.isReady, false);
  assert.deepEqual(selected.reminders, []);
});

test("current-user subscription error becomes ready without stale reminders", () => {
  const lifecycleA = { userId: "user-a" };
  const lifecycleB = { userId: "user-b" };
  const harness = createSubscriberHarness();
  let state: ActiveRemindersSubscriptionState | null = {
    lifecycle: lifecycleA,
    isReady: true,
    reminders: [reminder("a")],
  };
  const cleanup = startActiveRemindersSubscription(
    lifecycleB,
    (next) => {
      state = next;
    },
    harness.subscribe,
  );

  harness.listeners.get("user-b")?.onError(new Error("subscription failed"));

  const selected = selectActiveRemindersState(lifecycleB, state);
  assert.equal(selected.isReady, true);
  assert.deepEqual(selected.reminders, []);
  cleanup();
});

test("cleanup unsubscribes on user change and unmount and ignores late callbacks", () => {
  const harness = createSubscriberHarness();
  let state: ActiveRemindersSubscriptionState | null = null;
  const cleanupA = startActiveRemindersSubscription(
    { userId: "user-a" },
    (next) => {
      state = next;
    },
    harness.subscribe,
  );

  cleanupA();
  harness.listeners.get("user-a")?.onUpdate([reminder("late-a")]);
  assert.equal(state, null);

  const cleanupB = startActiveRemindersSubscription(
    { userId: "user-b" },
    (next) => {
      state = next;
    },
    harness.subscribe,
  );
  cleanupB();

  assert.deepEqual(harness.unsubscribed, ["user-a", "user-b"]);
});

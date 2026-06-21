import { useEffect, useMemo, useState } from "react";

import { db } from "src/shared/config/firebase/firestore";

import { subscribeActiveReminders } from "../api/subscribeActiveReminders";
import type {
  ActiveReminder,
  ActiveRemindersBuckets,
} from "../model/activeReminder.types";
import { bucketizeReminders } from "../model/bucketize";

export interface ActiveRemindersLifecycleKey {
  userId: string | null;
}

export interface ActiveRemindersSubscriptionState {
  lifecycle: ActiveRemindersLifecycleKey;
  isReady: boolean;
  reminders: ActiveReminder[];
}

export type ActiveRemindersSubscriber = (
  userId: string,
  onUpdate: (reminders: ActiveReminder[]) => void,
  onError: (error: Error) => void,
) => () => void;

const EMPTY_REMINDERS: ActiveReminder[] = [];

function subscribeForUser(
  userId: string,
  onUpdate: (reminders: ActiveReminder[]) => void,
  onError: (error: Error) => void,
): () => void {
  return subscribeActiveReminders(db, userId, onUpdate, onError);
}

export function selectActiveRemindersState(
  lifecycle: ActiveRemindersLifecycleKey,
  state: ActiveRemindersSubscriptionState | null,
): Pick<ActiveRemindersSubscriptionState, "isReady" | "reminders"> {
  if (!lifecycle.userId || state?.lifecycle !== lifecycle) {
    return { isReady: false, reminders: EMPTY_REMINDERS };
  }

  return state;
}

export function startActiveRemindersSubscription(
  lifecycle: ActiveRemindersLifecycleKey & { userId: string },
  publish: (state: ActiveRemindersSubscriptionState) => void,
  subscribe: ActiveRemindersSubscriber = subscribeForUser,
): () => void {
  let isActive = true;
  const unsubscribe = subscribe(
    lifecycle.userId,
    (reminders) => {
      if (isActive) {
        publish({ lifecycle, isReady: true, reminders });
      }
    },
    () => {
      if (isActive) {
        publish({ lifecycle, isReady: true, reminders: [] });
      }
    },
  );

  return () => {
    isActive = false;
    unsubscribe();
  };
}

/**
 * Live-updated buckets of active reminders for the current user.
 *
 * Returns `{ overdue, upcoming }` derived from the reminder list and a
 * "now" tick that re-bucketizes once a minute (so an item flipping from
 * upcoming → overdue happens visually without a navigation).
 */
export function useActiveReminders(userId: string | null): {
  isReady: boolean;
  reminders: ActiveReminder[];
  buckets: ActiveRemindersBuckets;
  total: number;
} {
  const lifecycle = useMemo<ActiveRemindersLifecycleKey>(
    () => ({ userId }),
    [userId],
  );
  const [subscriptionState, setSubscriptionState] =
    useState<ActiveRemindersSubscriptionState | null>(null);
  // Lazy init so Date.now() is not called during render (react-hooks/purity).
  // The minute-interval below keeps this fresh; the initial value is identical.
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!lifecycle.userId) {
      return undefined;
    }

    return startActiveRemindersSubscription(
      lifecycle as ActiveRemindersLifecycleKey & { userId: string },
      setSubscriptionState,
    );
  }, [lifecycle]);

  // Re-bucketize every minute so overdue threshold updates without action.
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { isReady, reminders } = selectActiveRemindersState(
    lifecycle,
    subscriptionState,
  );
  const buckets = useMemo(
    () => bucketizeReminders(reminders, new Date(nowTick)),
    [reminders, nowTick],
  );

  return {
    isReady,
    reminders,
    buckets,
    total: reminders.length,
  };
}

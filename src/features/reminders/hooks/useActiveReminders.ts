import { useEffect, useMemo, useState } from "react";

import { db } from "src/shared/config/firebase/firestore";

import { subscribeActiveReminders } from "../api/subscribeActiveReminders";
import type {
  ActiveReminder,
  ActiveRemindersBuckets,
} from "../model/activeReminder.types";
import { bucketizeReminders } from "../model/bucketize";

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
  const [reminders, setReminders] = useState<ActiveReminder[]>([]);
  const [isReady, setIsReady] = useState(false);
  // Lazy init so Date.now() is not called during render (react-hooks/purity).
  // The minute-interval below keeps this fresh; the initial value is identical.
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!userId) {
      setReminders([]);
      setIsReady(false);
      return undefined;
    }

    setIsReady(false);
    const unsubscribe = subscribeActiveReminders(
      db,
      userId,
      (next) => {
        setReminders(next);
        setIsReady(true);
      },
      () => setIsReady(true),
    );

    return unsubscribe;
  }, [userId]);

  // Re-bucketize every minute so overdue threshold updates without action.
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

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

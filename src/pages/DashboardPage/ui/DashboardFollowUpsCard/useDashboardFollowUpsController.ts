import { useCallback, useEffect, useState } from "react";

import type { InteractionDoc } from "src/entities/contact";
import { useAuthSelectors } from "src/features/auth/model";
import {
  clearInteractionNextStep,
  getPendingNextStepInteractions,
} from "src/features/contacts";
import { db } from "src/shared/config/firebase/firestore";

export interface FollowUpItem {
  interactionId: string;
  nextStepAtMs: number;
  nextStepText: string;
  contactDisplayName: string;
  applicationDisplayTitle: string;
  type: InteractionDoc["type"];
  /** Bucket for grouping */
  bucket: "overdue" | "today" | "tomorrow" | "upcoming";
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
}

function getBucket(
  nextStepAtMs: number,
  nowMs: number,
): FollowUpItem["bucket"] {
  const nowDay = new Date(nowMs);
  nowDay.setHours(0, 0, 0, 0);
  const tomorrowDay = new Date(nowDay.getTime() + 86_400_000);
  const afterTomorrow = new Date(nowDay.getTime() + 2 * 86_400_000);

  if (nextStepAtMs < nowMs) return "overdue";
  if (nextStepAtMs < tomorrowDay.getTime()) return "today";
  if (nextStepAtMs < afterTomorrow.getTime()) return "tomorrow";
  return "upcoming";
}

function toFollowUpItem(
  id: string,
  data: InteractionDoc,
  nowMs: number,
): FollowUpItem | null {
  const ts = data.nextStepAt as { toMillis?: () => number; seconds?: number } | null | undefined;
  if (!ts) return null;

  let nextStepAtMs: number | null = null;
  if (typeof ts.toMillis === "function") {
    nextStepAtMs = ts.toMillis();
  } else if (ts.seconds) {
    nextStepAtMs = ts.seconds * 1000;
  }

  if (!nextStepAtMs) return null;

  const bucket = getBucket(nextStepAtMs, nowMs);

  return {
    interactionId: id,
    nextStepAtMs,
    nextStepText: data.nextStepText ?? "",
    contactDisplayName: data.contactDisplayName ?? "",
    applicationDisplayTitle: data.applicationDisplayTitle ?? "",
    type: data.type,
    bucket,
    isOverdue: bucket === "overdue",
    isToday: bucket === "today",
    isTomorrow: bucket === "tomorrow",
  };
}

export type FollowUpFilter = "overdue" | "today" | "tomorrow" | "upcoming" | "all";

export function useDashboardFollowUpsController() {
  const { userId } = useAuthSelectors();
  const [allItems, setAllItems] = useState<FollowUpItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FollowUpFilter>("today");

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const rows = await getPendingNextStepInteractions(db, userId, 100);
      const nowMs = Date.now();
      const items = rows
        .map((r) => toFollowUpItem(r.id, r.data, nowMs))
        .filter((i): i is FollowUpItem => i !== null)
        .sort((a, b) => a.nextStepAtMs - b.nextStepAtMs);
      setAllItems(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load follow-ups.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const handleClearNextStep = useCallback(
    async (interactionId: string) => {
      if (!userId) return;
      await clearInteractionNextStep(db, userId, interactionId);
      setAllItems((prev) => prev.filter((i) => i.interactionId !== interactionId));
    },
    [userId],
  );

  const counts: Record<FollowUpFilter, number> = {
    overdue: allItems.filter((i) => i.isOverdue).length,
    today: allItems.filter((i) => i.isToday).length,
    tomorrow: allItems.filter((i) => i.isTomorrow).length,
    upcoming: allItems.filter((i) => i.bucket === "upcoming").length,
    all: allItems.length,
  };

  const visibleItems =
    filter === "all" ? allItems : allItems.filter((i) => i.bucket === filter);

  return {
    allItems,
    visibleItems,
    counts,
    filter,
    setFilter,
    isLoading,
    error,
    handleClearNextStep,
    reload: load,
  };
}

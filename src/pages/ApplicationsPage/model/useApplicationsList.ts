import { useCallback, useEffect, useState } from "react";

import {
  type ApplicationDoc,
  type ProcessStatus,
  queryFollowUpsDue,
  queryPipelineByStatus,
  queryTodayTopPriority,
} from "src/features/applications/firestoreApplications";
import { db } from "src/shared/config/firebase/firebase";


import type { ViewMode } from "./types";

export interface AppRow { id: string; data: ApplicationDoc }

interface ListResult {
  rows: AppRow[];
}

async function fetchList(params: {
  userId: string;
  view: ViewMode;
  activeStatus: ProcessStatus;
  limit: number;
}): Promise<ListResult> {
  const { userId, view, activeStatus, limit } = params;

  if (view === "pipeline") {
    return { rows: await queryPipelineByStatus(db, userId, activeStatus, limit) };
  }

  if (view === "today") {
    return { rows: await queryTodayTopPriority(db, userId, limit) };
  }

  return { rows: await queryFollowUpsDue(db, userId, limit) };
}

export function useApplicationsList(params: {
  userId: string | null;
  isAuthReady: boolean;
  view: ViewMode;
  activeStatus: ProcessStatus;
  limit?: number;
  onError?: (message: string) => void;
}) {
  const {
    userId,
    isAuthReady,
    view,
    activeStatus,
    limit = 50,
    onError,
  } = params;

  const [list, setList] = useState<AppRow[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;

    setIsLoadingList(true);
    try {
      const res = await fetchList({ userId, view, activeStatus, limit });
      setList(res.rows);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      onError?.(message);
    } finally {
      setIsLoadingList(false);
    }
  }, [userId, view, activeStatus, limit, onError]);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    void load();
  }, [isAuthReady, userId, load]);

  return { list, setList, isLoadingList, load };
}

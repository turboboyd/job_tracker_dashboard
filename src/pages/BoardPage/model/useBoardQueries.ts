import React from "react";

import { normalizeStatusKey } from "src/entities/application/model/status";
import type { Loop } from "src/entities/loop";
import {
  listApplicationsViaRest,
  type ApplicationListResult,
} from "src/features/applications/rest/queries";
import { useAuthSelectors } from "src/features/auth/model";
import { useBackendLoopsQuery } from "src/features/loops";

import type { BoardCardItem, BoardMatchesQueryState } from "./types";

type ApplicationRow = ApplicationListResult["items"][number];

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

export type BoardQueries = Readonly<{
  items: readonly BoardCardItem[];
  loops: readonly Loop[];
  queryState: BoardMatchesQueryState;
  reload: () => Promise<void>;
}>;

function readTimestampMs(value: unknown): number | null {
  const ts = value as { toDate?: () => Date } | null | undefined;
  if (!ts || typeof ts.toDate !== "function") return null;
  const time = ts.toDate().getTime();
  return Number.isFinite(time) ? time : null;
}

function toBoardCardItem(row: ApplicationRow): BoardCardItem {
  const { data } = row;
  const score = data.matching?.score;

  return {
    id: row.id,
    status: normalizeStatusKey(data.process.status) ?? "SAVED",
    loopId: data.loopLinkage?.loopId ?? "",
    roleTitle: data.job.roleTitle,
    companyName: data.job.companyName,
    location: data.job.locationText ?? "",
    matchScore: typeof score === "number" ? score : null,
    createdAtMs: readTimestampMs(data.createdAt),
    isFavorite: data.isFavorite === true,
  };
}

async function loadActiveApplications(userId: string): Promise<ApplicationRow[]> {
  const first = await listApplicationsViaRest(userId, {
    archived: false,
    limit: PAGE_SIZE,
    offset: 0,
    sort: "updated_at_desc",
  });

  const rows = [...first.items];
  let nextOffset = first.offset + first.limit;
  let pages = 1;

  while (nextOffset < first.total && pages < MAX_PAGES) {
    const page = await listApplicationsViaRest(userId, {
      archived: false,
      limit: PAGE_SIZE,
      offset: nextOffset,
      sort: "updated_at_desc",
    });
    if (page.items.length === 0) break;
    rows.push(...page.items);
    nextOffset = page.offset + page.limit;
    pages += 1;
  }

  return rows;
}

export function useBoardQueries(): BoardQueries {
  const { userId, isAuthReady, isAuthenticated } = useAuthSelectors();
  const ready = isAuthReady && isAuthenticated && Boolean(userId);

  const loopsQ = useBackendLoopsQuery({
    includeArchived: true,
    skip: !ready,
  });
  const loops = React.useMemo(() => loopsQ.data ?? [], [loopsQ.data]);

  const [items, setItems] = React.useState<readonly BoardCardItem[]>([]);
  const [queryState, setQueryState] = React.useState<BoardMatchesQueryState>({
    isLoading: false,
    isError: false,
  });

  const reload = React.useCallback(async () => {
    if (!ready || !userId) {
      setItems([]);
      return;
    }

    setQueryState({ isLoading: true, isError: false });
    try {
      const rows = await loadActiveApplications(userId);
      setItems(rows.map(toBoardCardItem));
      setQueryState({ isLoading: false, isError: false });
    } catch (error) {
      setQueryState({ isLoading: false, isError: true, error });
    }
  }, [ready, userId]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loops, queryState, reload };
}

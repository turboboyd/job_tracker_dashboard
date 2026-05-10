import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo, useState } from "react";

import {
  useGetLoopsPageQuery,
} from "src/entities/loop";

import {
  getLoopsTotalPages,
  getLoopsVisibleRange,
} from "./loopsListController.helpers";
import { PAGE_SIZE } from "./loopsListView.helpers";
import { useLoopsListCursor } from "./useLoopsListCursor";
import { useLoopsListPageNavigation } from "./useLoopsListPageNavigation";

interface UseLoopsListControllerParams {
  userId: string;
  onOpenLoop: (id: string) => void;
}

export function useLoopsListController({
  userId,
  onOpenLoop,
}: UseLoopsListControllerParams) {
  const [createOpen, setCreateOpen] = useState(false);
  const {
    cursorId,
    rememberNextCursor,
    resetCursor,
    syncCursorForPage,
  } = useLoopsListCursor(userId);

  const loopsPageQuery = useGetLoopsPageQuery(
    userId ? { pageSize: PAGE_SIZE, cursorId } : skipToken,
  );

  const data = loopsPageQuery.data;
  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const nextCursor = data?.nextCursor ?? null;
  const totalPages = useMemo(() => {
    return getLoopsTotalPages(total);
  }, [total]);

  const { goToPage, handleLoopCreated, page } = useLoopsListPageNavigation({
    hasData: Boolean(data),
    nextCursor,
    onOpenLoop,
    rememberNextCursor,
    resetCursor,
    syncCursorForPage,
    totalPages,
  });

  const { showFrom, showTo } = useMemo(
    () => getLoopsVisibleRange({ itemCount: items.length, page, total }),
    [items.length, page, total],
  );

  return {
    createOpen,
    setCreateOpen,
    page,
    items,
    total,
    totalPages,
    showFrom,
    showTo,
    loopsPageQuery,
    goToPage,
    handleLoopCreated,
  };
}

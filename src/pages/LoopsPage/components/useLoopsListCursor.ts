import { useCallback, useRef, useState } from "react";

import { useLazyGetLoopsPageQuery } from "src/entities/loop";

import {
  PAGE_SIZE,
  type CursorMap,
} from "./loopsListView.helpers";

export function useLoopsListCursor(userId: string) {
  const cursorByPageRef = useRef<CursorMap>({ 1: null });
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [fetchLoopsPage] = useLazyGetLoopsPageQuery();

  const syncCursorForPage = useCallback(
    async (targetPage: number) => {
      if (!userId) {
        setCursorId(null);
        return;
      }

      if (targetPage <= 1) {
        cursorByPageRef.current[1] = null;
        setCursorId(null);
        return;
      }

      const cache = cursorByPageRef.current;

      if (cache[targetPage] !== undefined) {
        setCursorId(cache[targetPage] ?? null);
        return;
      }

      if (cache[1] === undefined) {
        cache[1] = null;
      }

      for (let currentPage = 1; currentPage < targetPage; currentPage += 1) {
        if (cache[currentPage] === undefined) {
          break;
        }

        const response = await fetchLoopsPage({
          pageSize: PAGE_SIZE,
          cursorId: cache[currentPage] ?? null,
        }).unwrap();

        cache[currentPage + 1] = response.nextCursor ?? null;

        if (!response.nextCursor) {
          break;
        }
      }

      setCursorId(cache[targetPage] ?? null);
    },
    [fetchLoopsPage, userId],
  );

  const rememberNextCursor = useCallback(
    (page: number, nextCursor: string | null) => {
      const cache = cursorByPageRef.current;
      const nextPage = page + 1;

      if (cache[nextPage] === undefined) {
        cache[nextPage] = nextCursor;
      }
    },
    [],
  );

  const resetCursor = useCallback(() => {
    cursorByPageRef.current = { 1: null };
    setCursorId(null);
  }, []);

  return {
    cursorId,
    rememberNextCursor,
    resetCursor,
    syncCursorForPage,
  };
}


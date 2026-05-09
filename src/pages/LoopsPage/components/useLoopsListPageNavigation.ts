import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import {
  setLastLoopsUrl,
  setLoopsListPage,
  type LoopsUiState,
} from "src/entities/loop";
import { clampPage } from "src/shared/lib";

import { getLoopsListPage } from "./loopsListController.helpers";
import { writePageToSearch } from "./loopsListView.helpers";

interface UseLoopsListPageNavigationParams {
  hasData: boolean;
  nextCursor: string | null;
  onOpenLoop: (id: string) => void;
  rememberNextCursor: (page: number, nextCursor: string | null) => void;
  resetCursor: () => void;
  syncCursorForPage: (page: number) => Promise<void>;
  totalPages: number;
}

export function useLoopsListPageNavigation({
  hasData,
  nextCursor,
  onOpenLoop,
  rememberNextCursor,
  resetCursor,
  syncCursorForPage,
  totalPages,
}: UseLoopsListPageNavigationParams) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const savedListPage = useSelector((state: { loopsUi: LoopsUiState }) =>
    state.loopsUi.listPage,
  );

  const page = useMemo(() => {
    return getLoopsListPage(location.search, savedListPage);
  }, [location.search, savedListPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      syncCursorForPage(page).catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [page, syncCursorForPage]);

  useEffect(() => {
    if (hasData) {
      rememberNextCursor(page, nextCursor);
    }
  }, [hasData, nextCursor, page, rememberNextCursor]);

  useEffect(() => {
    if (!hasData) return;

    const clampedPage = Math.max(1, Math.min(totalPages, page));
    if (clampedPage === page) return;

    Promise.resolve(
      navigate(
        {
          pathname: location.pathname,
          search: writePageToSearch(location.search, clampedPage),
        },
        { replace: true },
      ),
    ).catch(() => undefined);
  }, [
    hasData,
    location.pathname,
    location.search,
    navigate,
    page,
    totalPages,
  ]);

  useEffect(() => {
    dispatch(setLoopsListPage(page));
    dispatch(setLastLoopsUrl(`${location.pathname}${location.search}`));
  }, [dispatch, location.pathname, location.search, page]);

  const goToPage = useCallback(
    (targetPage: number) => {
      const nextPage = clampPage(targetPage);

      syncCursorForPage(nextPage)
        .then(() => {
          return Promise.resolve(
            navigate(
              {
                pathname: location.pathname,
                search: writePageToSearch(location.search, nextPage),
              },
              { replace: false },
            ),
          );
        })
        .catch(() => undefined);
    },
    [location.pathname, location.search, navigate, syncCursorForPage],
  );

  const handleLoopCreated = useCallback(
    (id: string) => {
      resetCursor();

      Promise.resolve(
        navigate(
          {
            pathname: location.pathname,
            search: writePageToSearch(location.search, 1),
          },
          { replace: true },
        ),
      ).catch(() => undefined);

      onOpenLoop(id);
    },
    [location.pathname, location.search, navigate, onOpenLoop, resetCursor],
  );

  return {
    goToPage,
    handleLoopCreated,
    page,
  };
}

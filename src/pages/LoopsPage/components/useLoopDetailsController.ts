import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import {
  setLastLoopsUrl,
  setLoopDetailsPage,
  type Loop,
  type LoopsUiState,
  useGetLoopQuery,
} from "src/entities/loop";
import { updateURLParams } from "src/shared/lib";

import { readPageParam } from "./loopsListView.helpers";

interface UseLoopDetailsControllerParams {
  loopId: string;
}

export function useLoopDetailsController({
  loopId,
}: UseLoopDetailsControllerParams) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const savedDetailsPage = useSelector((state: { loopsUi: LoopsUiState }) =>
    state.loopsUi.detailsPageByLoopId[loopId],
  );
  const urlPage = useMemo(() => readPageParam(location.search), [location.search]);
  const detailsPage = urlPage ?? savedDetailsPage ?? 1;

  useEffect(() => {
    if (urlPage !== null) {
      return;
    }

    updateURLParams(
      navigate,
      location,
      { page: String(detailsPage) },
      { replace: true },
    );
  }, [detailsPage, location, navigate, urlPage]);

  useEffect(() => {
    dispatch(setLoopDetailsPage({ loopId, page: detailsPage }));
    dispatch(setLastLoopsUrl(`${location.pathname}${location.search}`));
  }, [detailsPage, dispatch, location.pathname, location.search, loopId]);

  const loopQuery = useGetLoopQuery({ loopId });
  const loop: Loop | null = loopQuery.data ?? null;

  const changePage = useCallback(
    (page: number) => {
      dispatch(setLoopDetailsPage({ loopId, page }));
      updateURLParams(
        navigate,
        location,
        { page: String(page) },
        { replace: true },
      );
    },
    [dispatch, location, loopId, navigate],
  );

  return {
    detailsPage,
    loop,
    loopQuery,
    changePage,
  };
}

import { useMemo, useReducer } from "react";

export type UsePaginationOptions = {
  totalItems: number;
  pageSize: number;
  initialPage?: number;
  resetKey?: string | number;
};

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type State = {
  requestedPage: number;
};

type Action =
  | { type: "SET_PAGE"; page: number }
  | { type: "DELTA"; delta: number }
  | { type: "FIRST" }
  | { type: "LAST"; totalPages: number };

function assertNever(value: never): never {
  throw new Error(`Unexpected action: ${JSON.stringify(value)}`);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_PAGE":
      return { requestedPage: action.page };
    case "DELTA":
      return { requestedPage: state.requestedPage + action.delta };
    case "FIRST":
      return { requestedPage: 1 };
    case "LAST":
      return { requestedPage: action.totalPages };
    default: {
      return assertNever(action);
    }
  }
}

export function usePagination(options: UsePaginationOptions) {
  const { totalItems, pageSize, initialPage = 1, resetKey } = options;

  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));

  const key = resetKey ?? "__no_reset__";

  const [state, dispatch] = useReducer(
    reducer,
    { requestedPage: initialPage },
    (init) => ({
      requestedPage: clamp(init.requestedPage, 1, totalPages),
    }),
  );

  const page = clamp(state.requestedPage, 1, totalPages);

  const setPage = (next: number | ((prev: number) => number)) => {
    const nextValue = typeof next === "function" ? next(page) : next;
    dispatch({ type: "SET_PAGE", page: nextValue });
  };

  const prev = () => dispatch({ type: "DELTA", delta: -1 });
  const next = () => dispatch({ type: "DELTA", delta: 1 });
  const first = () => dispatch({ type: "FIRST" });
  const last = () => dispatch({ type: "LAST", totalPages });

  const offset = (page - 1) * safePageSize;
  const limit = safePageSize;

  const info = useMemo(() => {
    if (totalItems === 0) return { from: 0, to: 0 };
    const from = offset + 1;
    const to = Math.min(totalItems, offset + limit);
    return { from, to };
  }, [totalItems, offset, limit]);

  return {
    resetKey: key,
    page,
    setPage,
    totalPages,
    pageSize: safePageSize,
    offset,
    limit,
    info,
    canPrev: page > 1,
    canNext: page < totalPages,
    prev,
    next,
    first,
    last,
  };
}

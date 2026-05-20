import { useCallback, useEffect, useState } from "react";

import type { Loop } from "src/entities/loop";

import { listLoopsViaRest } from "./queries";

export interface BackendLoopsQueryOptions {
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
  skip?: boolean;
}

export interface BackendLoopsQueryResult {
  data: Loop[] | undefined;
  error: unknown;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
  refetch: () => void;
}

interface BackendLoopsState {
  data: Loop[] | undefined;
  error: unknown;
  isFetching: boolean;
  isLoading: boolean;
}

export function useBackendLoopsQuery(
  options: BackendLoopsQueryOptions = {},
): BackendLoopsQueryResult {
  const {
    includeArchived = true,
    limit = 100,
    offset = 0,
    skip = false,
  } = options;
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<BackendLoopsState>({
    data: undefined,
    error: null,
    isFetching: false,
    isLoading: !skip,
  });

  const refetch = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (skip) {
      setState({
        data: undefined,
        error: null,
        isFetching: false,
        isLoading: false,
      });
      return;
    }

    let cancelled = false;

    setState((current) => ({
      ...current,
      error: null,
      isFetching: true,
      isLoading: current.data === undefined,
    }));

    async function loadLoops() {
      try {
        const response = await listLoopsViaRest({
          includeArchived,
          limit,
          offset,
        });

        if (!cancelled) {
          setState({
            data: response.items,
            error: null,
            isFetching: false,
            isLoading: false,
          });
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            error,
            isFetching: false,
            isLoading: false,
          }));
        }
      }
    }

    void loadLoops();

    return () => {
      cancelled = true;
    };
  }, [includeArchived, limit, offset, reloadToken, skip]);

  return {
    data: state.data,
    error: state.error,
    isError: state.error != null,
    isFetching: state.isFetching,
    isLoading: state.isLoading,
    refetch,
  };
}

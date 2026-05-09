import { useCallback, useEffect, useRef, useState } from "react";

import type {
  LoadState,
  LoadingTarget,
} from "./cvChecker.helpers";

export function useCvCheckerLoadState() {
  const [loadState, setLoadState] = useState<LoadState>({ kind: "idle" });
  const infoResetTimeoutRef = useRef<number | null>(null);

  const clearInfoResetTimer = useCallback(() => {
    if (infoResetTimeoutRef.current === null) return;

    window.clearTimeout(infoResetTimeoutRef.current);
    infoResetTimeoutRef.current = null;
  }, []);

  useEffect(() => clearInfoResetTimer, [clearInfoResetTimer]);

  const setLoadingState = useCallback(
    (which: LoadingTarget) => {
      clearInfoResetTimer();
      setLoadState({ kind: "loading", which });
    },
    [clearInfoResetTimer],
  );

  const setErrorState = useCallback(
    (message: string) => {
      clearInfoResetTimer();
      setLoadState({ kind: "error", message });
    },
    [clearInfoResetTimer],
  );

  const setInfoState = useCallback(
    (message: string, delayMs: number) => {
      clearInfoResetTimer();
      setLoadState({ kind: "info", message });
      infoResetTimeoutRef.current = window.setTimeout(() => {
        setLoadState({ kind: "idle" });
        infoResetTimeoutRef.current = null;
      }, delayMs);
    },
    [clearInfoResetTimer],
  );

  const setIdleState = useCallback(() => {
    clearInfoResetTimer();
    setLoadState({ kind: "idle" });
  }, [clearInfoResetTimer]);

  return {
    loadState,
    setErrorState,
    setIdleState,
    setInfoState,
    setLoadingState,
  };
}


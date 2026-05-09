import { useEffect, useState } from "react";

import { ensureUserDoc } from "src/features/applications/firestoreApplications";
import { db } from "src/shared/config/firebase/firebase";

export function useEnsureUserDoc(params: {
  userId: string | null;
  isAuthReady: boolean;
  onError?: (message: string) => void;
}) {
  const { userId, isAuthReady, onError } = params;
  const [isEnsuringUser, setIsEnsuringUser] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !userId) return;

    let cancelled = false;
    void (async () => {
      try {
        setIsEnsuringUser(true);
        await ensureUserDoc(db, userId);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        if (!cancelled) onError?.(message);
      } finally {
        if (!cancelled) setIsEnsuringUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, userId, onError]);

  return { isEnsuringUser };
}

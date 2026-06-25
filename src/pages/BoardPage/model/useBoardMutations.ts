import React from "react";

import type { BoardColumnKey } from "src/entities/application";
import {
  changeApplicationStatusViaRest,
  deleteApplicationViaRest,
} from "src/features/applications/rest/queries";
import { useAuthSelectors } from "src/features/auth/model";

import { COLUMN_TO_PROCESS_STATUS } from "./boardStatusMap";

export type BoardMutations = Readonly<{
  busy: boolean;
  updateStatus: (args: Readonly<{ itemId: string; status: BoardColumnKey }>) => Promise<void>;
  archive: (itemId: string) => Promise<void>;
}>;

export function useBoardMutations(): BoardMutations {
  const { userId } = useAuthSelectors();
  const [pending, setPending] = React.useState(0);
  const busy = pending > 0;

  const run = React.useCallback(async (op: () => Promise<unknown>) => {
    setPending((n) => n + 1);
    try {
      await op();
    } finally {
      setPending((n) => Math.max(0, n - 1));
    }
  }, []);

  const updateStatus = React.useCallback(
    async (args: Readonly<{ itemId: string; status: BoardColumnKey }>) => {
      if (!userId) return;
      const toStatus = COLUMN_TO_PROCESS_STATUS[args.status];
      if (!toStatus) return;

      await run(() =>
        changeApplicationStatusViaRest(userId, args.itemId, {
          toStatus,
          subStatus: null,
          comment: null,
          correlationId: null,
        }),
      );
    },
    [run, userId],
  );

  const archive = React.useCallback(
    async (itemId: string) => {
      await run(() => deleteApplicationViaRest(itemId));
    },
    [run],
  );

  return { busy, updateStatus, archive };
}

export function fireAndForgetMutation(p: Promise<unknown>): void {
  p.catch(() => {
    // Errors are surfaced via query state on the next reload.
  });
}

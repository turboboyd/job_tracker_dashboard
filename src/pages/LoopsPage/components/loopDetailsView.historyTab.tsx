import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";
import {
  listDiscoveryRunHistoryViaRest,
  type DiscoveryRunHistoryItem,
} from "src/features/discoveryRuns";

import { timeAgoFromIso } from "./loopDetailsView.helpers";
import { useTimeAgoLabel } from "./loopDetailsView.hooks";
import { HistoryRow } from "./loopDetailsView.parts";
import { isBackendLoopId } from "./loopsPage.helpers";

export function LoopHistoryTab({ loop }: { loop: Loop }) {
  const { t } = useTranslation();
  const formatTimeAgo = useTimeAgoLabel();
  const lastAgo = formatTimeAgo(timeAgoFromIso(loop.lastDiscoveryAt));
  const isBackendId = isBackendLoopId(loop.id);
  const [history, setHistory] = useState<DiscoveryRunHistoryItem[]>([]);
  const [loading, setLoading] = useState(isBackendId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBackendId) return;
    let cancelled = false;
    setLoading(true);
    listDiscoveryRunHistoryViaRest({ loopId: loop.id, limit: 50 })
      .then((envelope) => {
        if (!cancelled) {
          setHistory(envelope.items);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setHistory([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loop.id, isBackendId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[12px] border border-border bg-card p-5">
        <div className="text-[13.5px] font-medium text-foreground">
          {t("loops.historyLastSyncTitle", "Last discovery sync")}
        </div>
        <div className="mt-1 text-[20px] font-semibold tracking-[-0.025em] text-foreground">
          {lastAgo}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          {loop.lastDiscoveryAt
            ? new Date(loop.lastDiscoveryAt).toLocaleString()
            : t("loops.historyNeverRun", "This loop has never run a discovery sync.")}
        </p>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <div className="text-[13.5px] font-medium text-foreground">
              {t("loops.historyTimelineTitle", "Run history")}
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              {t("loops.historyTimelineSub", "Chronological log of discovery runs for this loop")}
            </div>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
            {history.length}
          </span>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-[12.5px] text-muted-foreground">
            {t("loops.loading", "Loading…")}
          </div>
        ) : error ? (
          <div className="px-5 py-6 text-[12.5px] text-rose-600 dark:text-rose-400">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-[16px]">
              ↻
            </div>
            <div className="text-[13px] font-medium text-foreground">
              {t("loops.historyEmptyShort", "No runs yet")}
            </div>
            <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted-foreground">
              {t(
                "loops.historyEmptyHint",
                "Trigger a manual run from the Sources tab — entries will appear here as soon as the first run completes.",
              )}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((row) => (
              <HistoryRow key={row.id} row={row} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

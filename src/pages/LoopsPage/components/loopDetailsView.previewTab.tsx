import { useEffect, useMemo, useState } from "react";

import type { Loop } from "src/entities/loop";
import {
  getDiscoverySourceRuntimeStatusViaRest,
  type DiscoverySourceRuntimeStatus,
} from "src/features/discoveryRuns";

import { DiscoveryPreviewFeed, type FeedSource } from "./DiscoveryPreviewFeed";
import { DISCOVERY_SOURCE_OPTIONS } from "./loopSettingsPanel.helpers";
import { isBackendLoopId } from "./loopsPage.helpers";

export function LoopPreviewTab({
  loop,
  onRefreshSourceStats,
  onMatchSaved,
}: {
  loop: Loop;
  onRefreshSourceStats: () => void;
  onMatchSaved: () => void;
}) {
  const isBackendId = isBackendLoopId(loop.id);
  const sources = loop.selectedSources ?? [];
  const [runtimeStatuses, setRuntimeStatuses] = useState<DiscoverySourceRuntimeStatus[]>([]);
  const [runtimeStatusesLoading, setRuntimeStatusesLoading] = useState(isBackendId);

  useEffect(() => {
    if (!isBackendId) return;
    let cancelled = false;
    setRuntimeStatusesLoading(true);
    getDiscoverySourceRuntimeStatusViaRest()
      .then((res) => {
        if (!cancelled) setRuntimeStatuses(res.items);
      })
      .catch(() => {
        if (!cancelled) setRuntimeStatuses([]);
      })
      .finally(() => {
        if (!cancelled) setRuntimeStatusesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isBackendId]);

  const runnableSources = useMemo<FeedSource[]>(() => {
    if (runtimeStatusesLoading) return [];
    const runnableSet = new Set(
      runtimeStatuses.filter((s) => s.runnable).map((s) => s.sourceId.toLowerCase()),
    );
    return sources
      .filter((src) => runnableSet.has(src.toLowerCase()))
      .map((src) => ({
        sourceId: src.toLowerCase(),
        label:
          DISCOVERY_SOURCE_OPTIONS.find((o) => o.value === src.toLowerCase())?.label ?? src,
      }));
  }, [sources, runtimeStatuses, runtimeStatusesLoading]);

  if (!isBackendId) return null;
  if (runtimeStatusesLoading) {
    return <div className="text-[12px] text-muted-foreground">Проверяем источники…</div>;
  }
  if (runnableSources.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border bg-card p-5 text-[12.5px] text-muted-foreground">
        Нет источников с поддержкой автоматического поиска. Добавь Arbeitsagentur, Remotive,
        Arbeit Now или другой поддерживаемый источник в настройках.
      </div>
    );
  }
  return (
    <DiscoveryPreviewFeed
      loopId={loop.id}
      sources={runnableSources}
      onMatchSaved={onMatchSaved}
      onRunComplete={onRefreshSourceStats}
    />
  );
}

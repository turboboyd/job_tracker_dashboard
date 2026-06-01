import { useEffect, useMemo, useRef, useState } from "react";

import {
  runDiscoveryPreviewViaRest,
  type DiscoveryRunPreviewItem,
} from "src/features/discoveryRuns";
import {
  getDiscoveryPreviewSaveButtonLabel,
  getDiscoveryPreviewSaveErrorMessage,
  isDiscoveryPreviewSaveDisabled,
  type DiscoveryPreviewSaveState,
} from "src/features/discoveryRuns/ui/discoveryPreview.helpers";
import { saveDiscoveryPreviewAsMatchViaRest } from "src/features/vacancyMatches";
import { Button } from "src/shared/ui";

const PAGE_SIZE = 20;

export interface FeedSource {
  sourceId: string;
  label: string;
}

interface FeedItem extends DiscoveryRunPreviewItem {
  _sourceId: string;
  _sourceLabel: string;
}

interface SourceState {
  page: number;
  hasMore: boolean;
}

interface FetchPageResult {
  sourceId: string;
  items: FeedItem[];
  hasMore: boolean;
}

export interface DiscoveryPreviewFeedProps {
  loopId: string;
  sources: FeedSource[];
  onMatchSaved?: () => void;
  onRunComplete?: () => void;
}

function getItemKey(item: FeedItem): string {
  return `${item._sourceId}:${item.externalId ?? item.sourceUrl}`;
}

function formatPostedAt(postedAt: string | null): string | null {
  if (!postedAt) return null;
  const ts = Date.parse(postedAt);
  if (!Number.isFinite(ts)) return null;
  const diffMs = Date.now() - ts;
  if (diffMs < 0) return null;
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "только что";
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед назад`;
  return new Date(ts).toLocaleDateString("ru-RU");
}

function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  const decoded = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  return decoded.replace(/\s+/g, " ").trim();
}

function FeedCard({
  item,
  saveState,
  saveError,
  onSave,
}: {
  item: FeedItem;
  saveState: DiscoveryPreviewSaveState;
  saveError: string | null;
  onSave: () => void;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5">
            <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              {item._sourceLabel}
            </span>
          </div>
          <div className="text-[14px] font-semibold text-foreground">
            {item.title || "Вакансия без названия"}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">
            {item.company || "Компания не указана"}
            {item.location ? ` · ${item.location}` : ""}
            {formatPostedAt(item.postedAt) ? ` · ${formatPostedAt(item.postedAt)}` : ""}
          </div>
          {item.snippet ? (
            <p className="mt-2 line-clamp-3 text-[12.5px] text-muted-foreground">
              {stripHtml(item.snippet)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          Открыть вакансию
        </a>
        <Button size="sm" onClick={onSave} disabled={isDiscoveryPreviewSaveDisabled(saveState)}>
          {getDiscoveryPreviewSaveButtonLabel(saveState)}
        </Button>
        {item.confidence.source_quality !== undefined ? (
          <span className="text-[11.5px] text-muted-foreground">
            Качество: {Math.round(item.confidence.source_quality * 100)}%
          </span>
        ) : null}
      </div>
      {saveError ? (
        <div className="mt-2 text-[12px] text-destructive">{saveError}</div>
      ) : null}
    </div>
  );
}

export function DiscoveryPreviewFeed({
  loopId,
  sources,
  onMatchSaved,
  onRunComplete,
}: DiscoveryPreviewFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [sourceStates, setSourceStates] = useState<Record<string, SourceState>>({});
  const [isLoadingFirst, setIsLoadingFirst] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStates, setSaveStates] = useState<Record<string, DiscoveryPreviewSaveState>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string | null>>({});
  const didAutoRun = useRef(false);

  const labelMap = useMemo(
    () => new Map(sources.map(({ sourceId, label }) => [sourceId, label])),
    [sources],
  );

  async function fetchPage(sourceId: string, page: number): Promise<FetchPageResult | null> {
    try {
      const response = await runDiscoveryPreviewViaRest({
        loopId,
        dryRun: true,
        sourceIds: [sourceId],
        page,
        pageSize: PAGE_SIZE,
      });
      const runItem =
        response.items.find((i) => i.sourceId === sourceId) ?? response.items[0];
      if (!runItem || runItem.status === "skipped" || runItem.status === "unsupported") {
        return { sourceId, items: [], hasMore: false };
      }
      if (runItem.status === "failed") {
        return { sourceId, items: [], hasMore: false };
      }
      return {
        sourceId,
        items: runItem.previewItems.map((item) => ({
          ...item,
          _sourceId: sourceId,
          _sourceLabel: labelMap.get(sourceId) ?? sourceId,
        })),
        hasMore: runItem.hasMore ?? false,
      };
    } catch {
      return null;
    }
  }

  async function loadInitial() {
    setIsLoadingFirst(true);
    setError(null);

    const results = await Promise.all(
      sources.map(({ sourceId }) => fetchPage(sourceId, 1)),
    );

    const allItems: FeedItem[] = [];
    const newSourceStates: Record<string, SourceState> = {};
    let allFailed = true;

    for (const result of results) {
      if (!result) continue;
      allFailed = false;
      allItems.push(...result.items);
      newSourceStates[result.sourceId] = { page: 1, hasMore: result.hasMore };
    }

    setItems(allItems);
    setSourceStates(newSourceStates);
    setIsLoadingFirst(false);

    if (allFailed) {
      setError("Не удалось загрузить вакансии. Попробуйте позже.");
      return;
    }

    if (allItems.length > 0) {
      onRunComplete?.();
    }
  }

  async function loadMore() {
    setIsLoadingMore(true);

    const sourcesToFetch = sources.filter(({ sourceId }) => sourceStates[sourceId]?.hasMore);

    const results = await Promise.all(
      sourcesToFetch.map(({ sourceId }) =>
        fetchPage(sourceId, (sourceStates[sourceId]?.page ?? 1) + 1),
      ),
    );

    const newItems: FeedItem[] = [];
    const updatedStates = { ...sourceStates };

    for (const result of results) {
      if (!result) continue;
      newItems.push(...result.items);
      updatedStates[result.sourceId] = {
        page: (sourceStates[result.sourceId]?.page ?? 1) + 1,
        hasMore: result.hasMore,
      };
    }

    setItems((prev) => [...prev, ...newItems]);
    setSourceStates(updatedStates);
    setIsLoadingMore(false);
  }

  useEffect(() => {
    if (didAutoRun.current) return;
    didAutoRun.current = true;
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRefresh() {
    setItems([]);
    setSourceStates({});
    setSaveStates({});
    setSaveErrors({});
    setError(null);
    void loadInitial();
  }

  async function handleSave(item: FeedItem) {
    const key = getItemKey(item);
    setSaveStates((prev) => ({ ...prev, [key]: "saving" }));
    setSaveErrors((prev) => ({ ...prev, [key]: null }));
    try {
      const result = await saveDiscoveryPreviewAsMatchViaRest(loopId, {
        sourceId: item._sourceId,
        externalId: item.externalId,
        sourceUrl: item.sourceUrl,
        title: item.title,
        company: item.company,
        location: item.location,
        description: item.snippet,
        postedAt: item.postedAt,
        rawMetadata: item.rawMetadata,
        confidence: item.confidence,
      });
      setSaveStates((prev) => ({
        ...prev,
        [key]: result.duplicate ? "duplicate" : "saved",
      }));
      onMatchSaved?.();
    } catch (saveErr: unknown) {
      setSaveStates((prev) => ({ ...prev, [key]: "idle" }));
      setSaveErrors((prev) => ({
        ...prev,
        [key]: getDiscoveryPreviewSaveErrorMessage(saveErr),
      }));
    }
  }

  const hasMore = Object.values(sourceStates).some((s) => s.hasMore);
  const sourceNames = sources.map((s) => s.label).join(" · ");

  return (
    <section className="rounded-[16px] border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">Предварительный поиск</h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {sourceNames} · не сохраняется автоматически
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isLoadingFirst}>
          {isLoadingFirst ? "Загружаем…" : "Обновить"}
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-[10px] border border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {error}
        </div>
      ) : isLoadingFirst ? (
        <div className="mt-4 rounded-[10px] bg-muted/30 p-3 text-[12.5px] text-muted-foreground">
          Ищем вакансии в {sourceNames}…
        </div>
      ) : !isLoadingFirst && Object.keys(sourceStates).length > 0 && items.length === 0 ? (
        <div className="mt-4 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          Вакансии не найдены. Попробуйте уточнить профессию или ключевые слова в настройках.
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="text-[12px] font-medium text-muted-foreground">
            Найдено: {items.length}
            {hasMore ? "+" : ""}
          </div>
          {items.map((item) => {
            const key = getItemKey(item);
            return (
              <FeedCard
                key={key}
                item={item}
                saveState={saveStates[key] ?? "idle"}
                saveError={saveErrors[key] ?? null}
                onSave={() => {
                  void handleSave(item);
                }}
              />
            );
          })}
          {hasMore ? (
            <div className="pt-2 text-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void loadMore();
                }}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Загружаем…" : "Показать ещё"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

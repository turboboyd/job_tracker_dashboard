import { useMemo, useState } from "react";

import {
  runDiscoveryPreviewViaRest,
  type DiscoveryRunPreviewItem,
  type DiscoveryRunResponse,
} from "src/features/discoveryRuns";
import {
  collectDiscoveryPreviewMessages,
  DISCOVERY_PREVIEW_COPY,
  getDiscoveryPreviewErrorMessage,
  getDiscoveryPreviewSaveErrorMessage,
  getDiscoveryPreviewSaveButtonLabel,
  isDiscoveryPreviewSaveDisabled,
  isArbeitsagenturSelected,
  type DiscoveryPreviewSaveState,
} from "src/features/discoveryRuns/ui/discoveryPreview.helpers";
import { saveDiscoveryPreviewAsMatchViaRest } from "src/features/vacancyMatches";
import { Button } from "src/shared/ui";

interface ArbeitsagenturDiscoveryPreviewPanelProps {
  loopId: string;
  selectedSources?: string[];
  onMatchSaved?: () => void;
}

function getPreviewItemKey(item: DiscoveryRunPreviewItem): string {
  return item.externalId ?? item.sourceUrl;
}

function PreviewCard({
  item,
  saveState,
  saveError,
  onSave,
}: {
  item: DiscoveryRunPreviewItem;
  saveState: DiscoveryPreviewSaveState;
  saveError: string | null;
  onSave: () => void;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-foreground">
            {item.title || "Вакансия без названия"}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">
            {item.company || "Компания не указана"}
            {item.location ? ` · ${item.location}` : ""}
          </div>
          {item.snippet ? (
            <p className="mt-2 line-clamp-3 text-[12.5px] text-muted-foreground">
              {item.snippet}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          {DISCOVERY_PREVIEW_COPY.previewBadge}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          {DISCOVERY_PREVIEW_COPY.openVacancy}
        </a>
        <Button
          size="sm"
          onClick={onSave}
          disabled={isDiscoveryPreviewSaveDisabled(saveState)}
        >
          {getDiscoveryPreviewSaveButtonLabel(saveState)}
        </Button>
        {item.confidence.source_quality !== undefined ? (
          <span className="text-[11.5px] text-muted-foreground">
            Качество источника: {Math.round(item.confidence.source_quality * 100)}%
          </span>
        ) : null}
      </div>
      {saveError ? (
        <div className="mt-2 text-[12px] text-destructive">{saveError}</div>
      ) : null}
    </div>
  );
}

export function ArbeitsagenturDiscoveryPreviewPanel({
  loopId,
  selectedSources,
  onMatchSaved,
}: ArbeitsagenturDiscoveryPreviewPanelProps) {
  const [result, setResult] = useState<DiscoveryRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStates, setSaveStates] = useState<Record<string, DiscoveryPreviewSaveState>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string | null>>({});
  const isSelected = isArbeitsagenturSelected(selectedSources);

  const previewItems = useMemo(
    () => result?.items.flatMap((item) => item.previewItems) ?? [],
    [result],
  );
  const messages = useMemo(() => collectDiscoveryPreviewMessages(result), [result]);

  async function handleRunPreview() {
    if (!isSelected) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSaveStates({});
    setSaveErrors({});
    try {
      const response = await runDiscoveryPreviewViaRest({
        loopId,
        dryRun: true,
        sourceIds: ["arbeitsagentur"],
      });
      setResult(response);
    } catch (runError: unknown) {
      setError(getDiscoveryPreviewErrorMessage(runError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSavePreviewItem(item: DiscoveryRunPreviewItem) {
    const key = getPreviewItemKey(item);
    setSaveStates((current) => ({ ...current, [key]: "saving" }));
    setSaveErrors((current) => ({ ...current, [key]: null }));
    try {
      const response = await saveDiscoveryPreviewAsMatchViaRest(loopId, {
        sourceId: "arbeitsagentur",
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
      setSaveStates((current) => ({
        ...current,
        [key]: response.duplicate ? "duplicate" : "saved",
      }));
      onMatchSaved?.();
    } catch (saveError: unknown) {
      setSaveStates((current) => ({ ...current, [key]: "idle" }));
      setSaveErrors((current) => ({
        ...current,
        [key]: getDiscoveryPreviewSaveErrorMessage(saveError),
      }));
    }
  }

  return (
    <section className="mt-6 rounded-[16px] border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">
            {DISCOVERY_PREVIEW_COPY.title}
          </h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {DISCOVERY_PREVIEW_COPY.intro} {DISCOVERY_PREVIEW_COPY.supportedOnly}
          </p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {DISCOVERY_PREVIEW_COPY.openAndAddManually} {DISCOVERY_PREVIEW_COPY.futureSave}
          </p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {DISCOVERY_PREVIEW_COPY.manualSaveBoundary}
          </p>
        </div>
        <Button size="sm" onClick={handleRunPreview} disabled={!isSelected || isLoading}>
          {isLoading ? DISCOVERY_PREVIEW_COPY.loading : DISCOVERY_PREVIEW_COPY.runButton}
        </Button>
      </div>

      {!isSelected ? (
        <div className="mt-4 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {DISCOVERY_PREVIEW_COPY.hintNotSelected}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[10px] border border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {error}
        </div>
      ) : null}

      {messages.length > 0 ? (
        <div className="mt-4 rounded-[10px] border border-border bg-muted/30 p-3">
          <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-muted-foreground">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result && previewItems.length === 0 && !isLoading ? (
        <div className="mt-4 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {DISCOVERY_PREVIEW_COPY.empty}
        </div>
      ) : null}

      {previewItems.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="text-[12px] font-medium text-muted-foreground">
            Найдено для предварительного просмотра: {previewItems.length}. Ничего не сохранено.
          </div>
          {previewItems.map((item) => {
            const key = getPreviewItemKey(item);
            return (
              <PreviewCard
                key={key}
                item={item}
                saveState={saveStates[key] ?? "idle"}
                saveError={saveErrors[key] ?? null}
                onSave={() => handleSavePreviewItem(item)}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

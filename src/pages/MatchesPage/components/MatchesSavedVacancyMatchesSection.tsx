import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { VacancyAnalysisPanel } from "src/features/vacancyAnalysis";
import {
  createApplicationFromVacancyMatchViaRest,
  listLoopVacancyMatchesViaRest,
  patchLoopVacancyMatchViaRest,
  type VacancyMatch,
} from "src/features/vacancyMatches";
import { getErrorMessage } from "src/shared/lib";
import { Button } from "src/shared/ui";
import type { Loop } from "src/entities/loop";

import {
  getApplicationDetailsRoute,
  getCreateApplicationLabel,
  getPersistedApplicationFeedback,
  getSavedMatchesTargetLoops,
  getSavedMatchSourceLabel,
  getSavedMatchStatusLabel,
  isSavedMatchActionable,
  MATCHES_SAVED_MATCHES_COPY,
  sortSavedMatchesByUpdatedAt,
  type MatchApplicationFeedback,
  type MatchWithLoopName,
} from "./matchesSavedVacancyMatches.helpers";

interface MatchesSavedVacancyMatchesSectionProps {
  loops: Loop[];
  loopsLoading: boolean;
  onItemsLoaded?: (matches: VacancyMatch[]) => void;
  reloadKey: number;
  selectedLoopIds: string[];
}

function SavedMatchCard({
  feedback,
  isCreating,
  isIgnoring,
  item,
  onCreateApplication,
  onIgnore,
  onOpenApplication,
}: {
  feedback: MatchApplicationFeedback | null;
  isCreating: boolean;
  isIgnoring: boolean;
  item: MatchWithLoopName;
  onCreateApplication: (match: VacancyMatch) => void;
  onIgnore: (match: VacancyMatch) => void;
  onOpenApplication: (applicationId: string) => void;
}) {
  const { loopName, match } = item;
  const actionable = isSavedMatchActionable(match);

  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-foreground">
            {match.roleTitle || MATCHES_SAVED_MATCHES_COPY.titleMissing}
          </div>
          <div className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
            {match.companyName || MATCHES_SAVED_MATCHES_COPY.companyMissing}
            {match.locationText ? ` · ${match.locationText}` : ""}
          </div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">{loopName}</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            {getSavedMatchSourceLabel(match)}
          </div>
          <a
            href={match.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate text-[12px] text-primary hover:underline"
          >
            {match.sourceUrl}
          </a>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            {getSavedMatchStatusLabel(match)}
          </span>
          {actionable ? (
            <>
              <button
                type="button"
                onClick={() => onIgnore(match)}
                disabled={isIgnoring}
                className="rounded-md border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                {isIgnoring
                  ? MATCHES_SAVED_MATCHES_COPY.ignoring
                  : MATCHES_SAVED_MATCHES_COPY.ignore}
              </button>
              <Button
                size="sm"
                onClick={() => onCreateApplication(match)}
                disabled={isCreating}
              >
                {getCreateApplicationLabel(isCreating)}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-[12px] text-muted-foreground">
        {MATCHES_SAVED_MATCHES_COPY.explicitOnly}{" "}
        {MATCHES_SAVED_MATCHES_COPY.noExternalSubmission}
      </p>

      <VacancyAnalysisPanel loopId={match.loopId} matchId={match.id} />

      {feedback ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[10px] border border-border bg-muted/30 p-3 text-[12.5px] text-muted-foreground">
          <span>{feedback.message}</span>
          <button
            type="button"
            className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => onOpenApplication(feedback.applicationId)}
          >
            {MATCHES_SAVED_MATCHES_COPY.openApplication}
          </button>
          <span>{MATCHES_SAVED_MATCHES_COPY.matchRetained}</span>
        </div>
      ) : null}
    </div>
  );
}

export function MatchesSavedVacancyMatchesSection({
  loops,
  loopsLoading,
  onItemsLoaded,
  reloadKey,
  selectedLoopIds,
}: MatchesSavedVacancyMatchesSectionProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<MatchWithLoopName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [feedbackByMatchId, setFeedbackByMatchId] = useState<
    Record<string, MatchApplicationFeedback>
  >({});

  const targetLoops = useMemo(
    () => getSavedMatchesTargetLoops(loops, selectedLoopIds),
    [loops, selectedLoopIds],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (loopsLoading) return;
      if (targetLoops.length === 0) {
        setItems([]);
        onItemsLoaded?.([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const envelopes = await Promise.all(
          targetLoops.map(async (loop) => {
            const envelope = await listLoopVacancyMatchesViaRest(loop.id, {
              limit: 50,
              offset: 0,
            });
            return envelope.items.map((match) => ({
              loopName: loop.name || loop.title || loop.id,
              match,
            }));
          }),
        );

        if (!cancelled) {
          const loadedItems = envelopes.flat();
          setItems(sortSavedMatchesByUpdatedAt(loadedItems));
          onItemsLoaded?.(loadedItems.map((item) => item.match));
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setItems([]);
          onItemsLoaded?.([]);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [targetLoops, loopsLoading, reloadKey, onItemsLoaded]);

  async function handleCreateApplication(match: VacancyMatch) {
    setCreatingId(match.id);
    setError(null);

    try {
      const result = await createApplicationFromVacancyMatchViaRest(
        match.loopId,
        match.id,
      );
      setItems((current) =>
        sortSavedMatchesByUpdatedAt(
          current.map((item) =>
            item.match.id === match.id ? { ...item, match: result.match } : item,
          ),
        ),
      );
      setFeedbackByMatchId((current) => ({
        ...current,
        [match.id]: {
          applicationId: result.applicationId,
          message: result.alreadyLinked
            ? MATCHES_SAVED_MATCHES_COPY.applicationAlreadyCreated
            : MATCHES_SAVED_MATCHES_COPY.applicationCreated,
        },
      }));
    } catch (createError: unknown) {
      setError(getErrorMessage(createError));
    } finally {
      setCreatingId(null);
    }
  }

  async function handleIgnore(match: VacancyMatch) {
    setIgnoringId(match.id);
    setError(null);

    try {
      const updated = await patchLoopVacancyMatchViaRest(match.loopId, match.id, {
        status: "ignored",
      });
      setItems((current) =>
        current.map((item) =>
          item.match.id === match.id ? { ...item, match: updated } : item,
        ),
      );
    } catch (ignoreError: unknown) {
      setError(getErrorMessage(ignoreError));
    } finally {
      setIgnoringId(null);
    }
  }

  return (
    <section className="mb-5 rounded-[14px] border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">
            {MATCHES_SAVED_MATCHES_COPY.title}
          </h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {MATCHES_SAVED_MATCHES_COPY.intro}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-[10px] border border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {MATCHES_SAVED_MATCHES_COPY.error} {error}
        </div>
      ) : null}

      {isLoading || loopsLoading ? (
        <p className="mt-4 text-[12.5px] text-muted-foreground">
          {MATCHES_SAVED_MATCHES_COPY.loading}
        </p>
      ) : null}

      {!isLoading && !loopsLoading && items.length === 0 ? (
        <div className="mt-4 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {MATCHES_SAVED_MATCHES_COPY.empty}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-4 space-y-2">
          {items.map((item) => {
            const feedback =
              feedbackByMatchId[item.match.id] ??
              getPersistedApplicationFeedback(item.match);
            return (
              <SavedMatchCard
                key={item.match.id}
                item={item}
                isCreating={creatingId === item.match.id}
                isIgnoring={ignoringId === item.match.id}
                feedback={feedback}
                onCreateApplication={(match) => {
                  void handleCreateApplication(match);
                }}
                onIgnore={(match) => {
                  void handleIgnore(match);
                }}
                onOpenApplication={(applicationId) => {
                  navigate(getApplicationDetailsRoute(applicationId));
                }}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

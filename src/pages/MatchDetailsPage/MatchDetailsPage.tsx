import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import type { Loop } from "src/entities/loop";
import { useBackendLoopsQuery } from "src/features/loops";
import { VacancyAnalysisPanel } from "src/features/vacancyAnalysis";
import {
  createApplicationFromVacancyMatchViaRest,
  getLoopVacancyMatchViaRest,
  listLoopVacancyMatchesViaRest,
  markLoopVacancyMatchSeenViaRest,
  type VacancyMatch,
  type VacancyMatchStatus,
} from "src/features/vacancyMatches";
import { AppRoutes, RoutePath } from "src/shared/config/routes";
import { getErrorMessage } from "src/shared/lib";

function getLoopName(loop: Loop | null | undefined): string {
  return loop?.name || loop?.title || loop?.id || "";
}

function getScore(match: VacancyMatch): number | null {
  const raw = match.confidence?.score ?? match.confidence?.overall ?? match.confidence?.match;
  return typeof raw === "number" ? Math.round(raw) : null;
}

function getStatusLabel(status: VacancyMatchStatus): string {
  if (status === "new") return "New";
  if (status === "saved") return "Saved";
  return "Converted";
}

function getStatusClass(status: VacancyMatchStatus): string {
  if (status === "converted") return "bg-blue-100 text-blue-700";
  if (status === "saved") return "bg-emerald-100 text-emerald-700";
  return "bg-primary/10 text-primary";
}

function getApplicationDetailsRoute(applicationId: string): string {
  return `/dashboard/applications/${encodeURIComponent(applicationId)}`;
}

async function findMatchAcrossLoops(
  loops: readonly Loop[],
  matchId: string,
): Promise<VacancyMatch | null> {
  for (const loop of loops) {
    if (loop.status === "archived") continue;
    const response = await listLoopVacancyMatchesViaRest(loop.id, { limit: 100, offset: 0 });
    const found = response.items.find((item) => item.id === matchId);
    if (found) return found;
  }
  return null;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[65%] text-right text-foreground break-words">{value || "--"}</dd>
    </div>
  );
}

export default function MatchDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const matchId = String(params.matchId ?? "");
  const requestedLoopId = searchParams.get("loopId") ?? "";
  const loopsQ = useBackendLoopsQuery({ includeArchived: false });
  const loops = useMemo(() => loopsQ.data ?? [], [loopsQ.data]);

  const [match, setMatch] = useState<VacancyMatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  // Remember which match ids we already marked seen so opening the page once is
  // enough and re-renders don't fire redundant requests.
  const markedSeenRef = useRef<Set<string>>(new Set());

  const loop = useMemo(
    () => loops.find((item) => item.id === match?.loopId || item.id === requestedLoopId) ?? null,
    [loops, match?.loopId, requestedLoopId],
  );
  const loopName = getLoopName(loop);
  const score = match ? getScore(match) : null;
  const applicationId = match?.applicationId ?? null;

  const loadMatch = useCallback(async () => {
    if (!matchId) return;
    if (!requestedLoopId && loopsQ.isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const loaded = requestedLoopId
        ? await getLoopVacancyMatchViaRest(requestedLoopId, matchId)
        : await findMatchAcrossLoops(loops, matchId);
      setMatch(loaded);
      if (!loaded) setError("Vacancy match not found.");
    } catch (loadError: unknown) {
      setMatch(null);
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [loops, loopsQ.isLoading, matchId, requestedLoopId]);

  useEffect(() => {
    void loadMatch();
  }, [loadMatch]);

  // Opening the details page counts as "viewing" the vacancy: mark it seen on the
  // backend (idempotent, best-effort) and reflect it locally. Guarded so it runs
  // once per match id even across re-renders.
  useEffect(() => {
    if (!match || match.seenAt) return;
    if (markedSeenRef.current.has(match.id)) return;
    markedSeenRef.current.add(match.id);
    const { loopId, id } = match;
    markLoopVacancyMatchSeenViaRest(loopId, id)
      .then((updated) => {
        setMatch((current) => (current && current.id === updated.id ? updated : current));
      })
      .catch(() => {
        /* seen-tracking is best-effort */
      });
  }, [match]);

  async function handleCreateApplication() {
    if (!match) return;
    setConverting(true);
    setError(null);
    try {
      const result = await createApplicationFromVacancyMatchViaRest(match.loopId, match.id);
      setMatch(result.match);
    } catch (convertError: unknown) {
      setError(getErrorMessage(convertError));
    } finally {
      setConverting(false);
    }
  }

  // Loading / error / not-found blocker for the main area — extracted from a
  // nested ternary into an ordered if/else (sonarjs/no-nested-conditional).
  // Returns the status element, or null when the match content should render.
  // Branch order, conditions, text and class names are unchanged.
  function renderStatusBlock() {
    if (isLoading || loopsQ.isLoading) {
      return (
        <div className="rounded-[12px] border border-border bg-card p-6 text-[13px] text-muted-foreground">
          Loading match...
        </div>
      );
    }
    if (error && !match) {
      return (
        <div className="rounded-[12px] border border-destructive/30 bg-destructive/5 p-6 text-[13px] text-destructive">
          {error}
        </div>
      );
    }
    if (!match) {
      return (
        <div className="rounded-[12px] border border-dashed border-border bg-card p-6 text-[13px] text-muted-foreground">
          Vacancy match not found.
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border px-7 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11.5px] text-muted-foreground/60">
              <span>Loopboard</span>
              <span>/</span>
              <Link to={RoutePath[AppRoutes.MATCHES]} className="hover:text-foreground">Matches</Link>
              <span>/</span>
              <span className="truncate">{match?.roleTitle || "Match details"}</span>
            </div>
            <h1 className="truncate text-[22px] font-semibold tracking-[-0.025em] text-foreground">
              {match?.roleTitle || "Match details"}
            </h1>
            {match ? (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {[match.companyName, match.locationText, match.source, loopName].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={
                match?.loopId
                  ? `${RoutePath[AppRoutes.MATCHES]}?loopId=${encodeURIComponent(match.loopId)}`
                  : RoutePath[AppRoutes.MATCHES]
              }
              className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted"
            >
              Back
            </Link>
            {match?.sourceUrl ? (
              <a
                href={match.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground"
              >
                Open source
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-7">
        {renderStatusBlock() ?? (match && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <section className="min-w-0 space-y-5">
              <div className="rounded-[12px] border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(match.status)}`}>
                        {getStatusLabel(match.status)}
                      </span>
                      {score !== null ? (
                        <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          Score {score}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-[20px] font-semibold text-foreground">
                      {match.roleTitle || "Untitled vacancy"}
                    </h2>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {match.companyName || "Company missing"}
                    </p>
                  </div>
                </div>

                <a
                  href={match.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block break-all text-[12.5px] text-primary hover:underline"
                >
                  {match.sourceUrl}
                </a>
              </div>

              <div className="rounded-[12px] border border-border bg-card p-5">
                <h2 className="text-[16px] font-semibold text-foreground">Description</h2>
                <div className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                  {match.vacancyDescription || "No description or snippet was saved for this match."}
                </div>
              </div>

              <VacancyAnalysisPanel loopId={match.loopId} matchId={match.id} />
            </section>

            <aside className="space-y-5">
              <div className="rounded-[12px] border border-border bg-card p-5">
                <h2 className="text-[16px] font-semibold text-foreground">Actions</h2>
                {error ? (
                  <div className="mt-3 rounded-[10px] border border-destructive/30 bg-destructive/5 p-3 text-[12.5px] text-destructive">
                    {error}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-col gap-2">
                  {applicationId ? (
                    <button
                      type="button"
                      onClick={() => navigate(getApplicationDetailsRoute(applicationId))}
                      className="rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground"
                    >
                      Open existing Application
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={converting}
                      onClick={() => { void handleCreateApplication(); }}
                      className="rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {converting ? "Creating..." : "Create Application"}
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-[12px] border border-border bg-card p-5">
                <h2 className="text-[16px] font-semibold text-foreground">Metadata</h2>
                <dl className="mt-3 text-[13px]">
                  <MetaRow label="Loop" value={loopName || match.loopId} />
                  <MetaRow label="Source" value={match.source || "--"} />
                  <MetaRow label="External ID" value={match.externalId || "--"} />
                  <MetaRow label="Location" value={match.locationText || "--"} />
                  <MetaRow label="Created" value={match.createdAt} />
                  <MetaRow label="Updated" value={match.updatedAt} />
                  <MetaRow label="Application" value={match.applicationId || "--"} />
                </dl>
              </div>

              <div className="rounded-[12px] border border-border bg-card p-5">
                <h2 className="text-[16px] font-semibold text-foreground">Confidence</h2>
                {Object.keys(match.confidence ?? {}).length === 0 ? (
                  <p className="mt-3 text-[13px] text-muted-foreground">No confidence metadata.</p>
                ) : (
                  <pre className="mt-3 max-h-72 overflow-auto rounded-[8px] bg-muted p-3 text-[12px] text-muted-foreground">
                    {JSON.stringify(match.confidence, null, 2)}
                  </pre>
                )}
              </div>
            </aside>
          </div>
        ))}
      </main>
    </div>
  );
}

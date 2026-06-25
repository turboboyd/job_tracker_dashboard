import { ArrowLeft, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

function HeaderStatusBadge({
  isLoadingLoops,
  count,
}: {
  isLoadingLoops: boolean;
  count: number;
}) {
  const { t } = useTranslation();
  if (isLoadingLoops) return null;
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
      ● {t("matches.header.vacancies", "{{count}} vacancies", { count })}
    </span>
  );
}

interface MatchesHeaderProps {
  /** Present when the user arrived from a loop — renders a "back to loop" crumb. */
  fromLoopId: string | null;
  isLoadingLoops: boolean;
  countAll: number;
  loopsCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onBackToLoop: () => void;
}

export function MatchesHeader({
  fromLoopId,
  isLoadingLoops,
  countAll,
  loopsCount,
  isLoading,
  isRefreshing,
  onRefresh,
  onBackToLoop,
}: MatchesHeaderProps) {
  const { t } = useTranslation();
  const refreshDisabled = loopsCount === 0 || isLoading || isRefreshing;
  const spinning = isLoading || isRefreshing;
  const title = t("matches.header.title", "Matches");
  const subtitle =
    loopsCount > 1
      ? t("matches.header.subtitleMulti", "Combined list from {{count}} search loops", {
          count: loopsCount,
        })
      : t("matches.header.subtitleSingle", "Saved vacancies from all your search loops");

  return (
    <header className="shrink-0 border-b border-border bg-background px-7 pb-3 pt-4">
      <div className="mb-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        {fromLoopId ? (
          <button
            type="button"
            onClick={onBackToLoop}
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("matches.header.backToLoop", "Back to loop")}
          </button>
        ) : (
          <>
            <span>Loopboard</span>
            <span>/</span>
            <span>{title}</span>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground">
              {title}
            </h1>
            <HeaderStatusBadge isLoadingLoops={isLoadingLoops} count={countAll} />
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshDisabled}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`} />
            {isRefreshing
              ? t("matches.header.refreshing", "Refreshing…")
              : t("matches.header.refresh", "Refresh")}
          </button>
        </div>
      </div>
    </header>
  );
}

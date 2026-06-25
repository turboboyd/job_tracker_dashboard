import { useTranslation } from "react-i18next";

import { AutoRefreshCountdown } from "./MatchesAutoRefresh";
import { type MatchWithLoopName } from "./matchesV2.helpers";
import { MatchListItem } from "./MatchListItem";

interface MatchesListPanelProps {
  items: readonly MatchWithLoopName[];
  totalCount: number;
  activeMatchId: string | null;
  onSelect: (matchId: string) => void;
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  /** ISO of the soonest scheduled run; enables the live auto-refresh countdown. */
  nextRunAt?: string | null;
  onAutoRefresh?: () => void;
}

function PageButton({
  label,
  disabled,
  active,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-[12px] tabular-nums transition-colors",
        active
          ? "border border-primary/40 bg-primary/10 font-medium text-foreground"
          : "border border-border bg-card text-muted-foreground hover:bg-muted",
        disabled ? "opacity-40" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let offset = -1; offset <= 1; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= totalPages) pages.add(candidate);
  }
  const ordered = [...pages].sort((left, right) => left - right);

  return (
    <div className="flex items-center justify-center gap-1.5 border-t border-border bg-background/60 p-3">
      <PageButton
        label="‹"
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
      />
      {ordered.map((value, index) => {
        const previous = ordered[index - 1];
        const showEllipsis = previous !== undefined && value - previous > 1;
        return (
          <span key={value} className="flex items-center gap-1.5">
            {showEllipsis ? (
              <span className="px-1 text-[12px] text-muted-foreground/60">…</span>
            ) : null}
            <PageButton
              label={String(value)}
              active={value === page}
              onClick={() => onChange(value)}
            />
          </span>
        );
      })}
      <PageButton
        label="›"
        disabled={page >= totalPages}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
      />
    </div>
  );
}

export function MatchesListPanel({
  items,
  totalCount,
  activeMatchId,
  onSelect,
  isLoading,
  page,
  totalPages,
  onPageChange,
  nextRunAt,
  onAutoRefresh,
}: MatchesListPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <span className="text-[12px] text-muted-foreground">
          <strong className="font-semibold text-foreground tabular-nums">{items.length}</strong>
          {" / "}
          <span className="tabular-nums">{totalCount}</span>{" "}
          {t("matches.feed.vacanciesWord", "vacancies")}
        </span>
        {nextRunAt ? (
          <AutoRefreshCountdown targetIso={nextRunAt} onElapsed={onAutoRefresh} />
        ) : (
          <span className="text-[11px] text-muted-foreground/70">
            {t("matches.feed.pageOf", "Page {{page}} of {{total}}", {
              page,
              total: Math.max(totalPages, 1),
            })}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ListBody
          items={items}
          activeMatchId={activeMatchId}
          onSelect={onSelect}
          isLoading={isLoading}
        />
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </div>
  );
}

function ListBody({
  items,
  activeMatchId,
  onSelect,
  isLoading,
}: {
  items: readonly MatchWithLoopName[];
  activeMatchId: string | null;
  onSelect: (matchId: string) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        {t("matches.feed.loading", "Loading matches…")}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <div className="text-[14px] font-medium text-foreground">
          {t("matches.feed.emptyTitle", "Nothing here yet")}
        </div>
        <p className="mx-auto mt-2 max-w-[300px] text-[12.5px] leading-relaxed text-muted-foreground">
          {t(
            "matches.feed.emptyHint",
            "Try switching the tab, picking another source, or running a search loop manually.",
          )}
        </p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <MatchListItem
          key={item.match.id}
          item={item}
          isActive={item.match.id === activeMatchId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

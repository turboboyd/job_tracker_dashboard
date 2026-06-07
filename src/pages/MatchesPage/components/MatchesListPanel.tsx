import { AutoRefreshCountdown } from "./MatchesAutoRefresh";
import {
  getMatchInitial,
  getMatchScore,
  getMatchTags,
  getSourceColor,
  getSourceLabel,
  getVacancyMetaChips,
  type MatchWithLoopName,
} from "./matchesV2.helpers";

interface MatchesListPanelProps {
  items: readonly MatchWithLoopName[];
  totalCount: number;
  activeMatchId: string | null;
  onSelect: (matchId: string) => void;
  isLoading: boolean;
  /** Backend preview cache is warming; live "добор" rows are still arriving. */
  isWarming?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  /** ISO of the selected loop's next run; enables the live auto-refresh countdown. */
  nextRunAt?: string | null;
  onAutoRefresh?: () => void;
}

function getScoreTone(score: number): string {
  if (score >= 85) {
    return "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (score >= 70) {
    return "border-amber-300/70 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "border-border bg-muted text-muted-foreground";
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex h-8 w-10 items-center justify-center rounded-md border border-border bg-muted text-[10px] text-muted-foreground">
        —
      </div>
    );
  }
  const tone = getScoreTone(score);
  return (
    <div
      className={`flex h-8 w-10 items-center justify-center rounded-md border text-[12.5px] font-semibold tabular-nums ${tone}`}
    >
      {score}
    </div>
  );
}

function MatchRow({
  item,
  isActive,
  onSelect,
}: {
  item: MatchWithLoopName;
  isActive: boolean;
  onSelect: (matchId: string) => void;
}) {
  const { match, loopName } = item;
  const isPreview = item.isPreview ?? false;
  const score = getMatchScore(match);
  const tags = getMatchTags(match);
  const metaChips = getVacancyMetaChips(match).slice(0, 3);
  const sourceColor = getSourceColor(match.source);
  const sourceLabel = getSourceLabel(match.source);
  const initial = getMatchInitial(match);

  return (
    <button
      type="button"
      onClick={() => onSelect(match.id)}
      className={[
        "block w-full border-l-2 px-4 py-3.5 text-left transition-colors",
        isActive
          ? "border-primary bg-muted/50"
          : "border-transparent hover:bg-muted/30",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[12px] font-semibold text-white"
          style={{ background: sourceColor }}
        >
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[13.5px] font-medium text-foreground">
              {match.roleTitle || "Без названия"}
            </span>
            {isPreview ? (
              <span className="rounded-full border border-emerald-300/70 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                Найдено
              </span>
            ) : null}
            {match.status === "saved" ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
                Сохранено
              </span>
            ) : null}
            {match.status === "converted" ? (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10.5px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Отклик
              </span>
            ) : null}
            {match.status === "new" && score !== null && score >= 90 ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-medium text-primary">
                ★ Топ-матч
              </span>
            ) : null}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted-foreground">
            {match.companyName ? (
              <span className="font-medium text-foreground/80">{match.companyName}</span>
            ) : null}
            {match.locationText ? <span>· {match.locationText}</span> : null}
            <span className="inline-flex items-center gap-1">
              ·
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-[1px]"
                style={{ background: sourceColor }}
              />
              {sourceLabel}
            </span>
            <span className="text-muted-foreground/70">· {loopName}</span>
          </div>

          {metaChips.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {metaChips.map((chip) => (
                <span
                  key={chip.key}
                  title={chip.title}
                  className="rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 4 ? (
                <span className="text-[10.5px] text-muted-foreground/70">+{tags.length - 4}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <ScoreBadge score={score} />
      </div>
    </button>
  );
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
  isWarming,
  page,
  totalPages,
  onPageChange,
  nextRunAt,
  onAutoRefresh,
}: MatchesListPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <span className="text-[12px] text-muted-foreground">
          <strong className="font-semibold text-foreground tabular-nums">{items.length}</strong>
          {" / "}
          <span className="tabular-nums">{totalCount}</span> вакансий
          {isWarming ? (
            <span className="ml-2 text-[11px] text-muted-foreground/70">· обновляем базу…</span>
          ) : null}
        </span>
        {nextRunAt ? (
          <AutoRefreshCountdown targetIso={nextRunAt} onElapsed={onAutoRefresh} />
        ) : (
          <span className="text-[11px] text-muted-foreground/70">
            Страница {page} из {Math.max(totalPages, 1)}
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
  if (isLoading) {
    return <div className="p-6 text-[13px] text-muted-foreground">Загружаем матчи…</div>;
  }
  if (items.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <div className="text-[14px] font-medium text-foreground">Здесь пока пусто</div>
        <p className="mx-auto mt-2 max-w-[300px] text-[12.5px] leading-relaxed text-muted-foreground">
          Попробуйте сменить вкладку, выбрать другой источник или запустить цикл поиска вручную.
        </p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <MatchRow
          key={item.match.id}
          item={item}
          isActive={item.match.id === activeMatchId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

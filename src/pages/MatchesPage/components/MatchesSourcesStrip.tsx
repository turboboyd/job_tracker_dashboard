import type { SourceBucket } from "./matchesV2.helpers";

interface MatchesSourcesStripProps {
  buckets: readonly SourceBucket[];
  totalCount: number;
  activeSource: string;
  onChange: (next: string) => void;
}

export function MatchesSourcesStrip({
  buckets,
  totalCount,
  activeSource,
  onChange,
}: MatchesSourcesStripProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto border-b border-border bg-background px-7 py-3">
      <button
        type="button"
        onClick={() => onChange("")}
        className={[
          "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
          activeSource === ""
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-card text-muted-foreground hover:bg-muted",
        ].join(" ")}
      >
        Все источники
        <span
          className={[
            "rounded-full px-1.5 text-[10.5px] tabular-nums",
            activeSource === "" ? "bg-foreground/15 text-background" : "bg-muted text-muted-foreground/80",
          ].join(" ")}
        >
          {totalCount}
        </span>
      </button>

      <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />

      {buckets.map((bucket) => {
        const isActive = activeSource === bucket.key;
        return (
          <button
            key={bucket.key}
            type="button"
            onClick={() => onChange(bucket.key)}
            className={[
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
              isActive
                ? "border-primary/40 bg-primary/10 font-medium text-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ background: bucket.color }}
            />
            <span>{bucket.label}</span>
            {bucket.count !== undefined ? (
              <span className="rounded-full bg-muted px-1.5 text-[10.5px] text-muted-foreground tabular-nums">
                {bucket.count}
              </span>
            ) : null}
          </button>
        );
      })}

      {buckets.length === 0 ? (
        <span className="text-[11.5px] text-muted-foreground">
          Источники появятся после первого запуска поиска
        </span>
      ) : null}
    </div>
  );
}

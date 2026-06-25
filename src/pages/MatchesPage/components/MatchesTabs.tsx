import { useTranslation } from "react-i18next";

import type { MatchesFeedCounts } from "src/features/vacancyMatches";

import { STATUS_TAB_ORDER, type StatusTab } from "./matchesV2.helpers";

const TAB_FALLBACK: Record<StatusTab, string> = {
  all: "All",
  new: "New",
  saved: "Saved",
};

export function MatchesTabs({
  tab,
  counts,
  onChange,
}: {
  tab: StatusTab;
  /** Backend-provided per-tab totals — the tab badges render these as-is. */
  counts: MatchesFeedCounts;
  onChange: (next: StatusTab) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="-mb-px flex flex-wrap gap-0.5">
      {STATUS_TAB_ORDER.map((entry) => {
        const isActive = tab === entry;
        return (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            className={[
              "inline-flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-[12.5px] transition-colors",
              isActive
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t(`matches.tabs.${entry}`, TAB_FALLBACK[entry])}
            <span className="rounded-full border border-border bg-muted px-1.5 text-[10.5px] text-muted-foreground tabular-nums">
              {counts[entry]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

import { useTranslation } from "react-i18next";

import { SORT_OPTIONS, type SortKey } from "./matchesV2.helpers";

export function MatchesToolbar({
  searchQuery,
  onSearchChange,
  sort,
  onSortChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (next: SortKey) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 pb-1.5">
      <input
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t("matches.toolbar.searchPlaceholder", "Role, company…")}
        className="h-8 w-44 rounded-md border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
      />
      <span className="text-[11px] text-muted-foreground">
        {t("matches.toolbar.sortLabel", "Sort:")}
      </span>
      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value as SortKey)}
        className="h-8 rounded-md border border-border bg-background px-2 text-[12px] text-foreground"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(`matches.sort.${option.value}`, option.label)}
          </option>
        ))}
      </select>
    </div>
  );
}
